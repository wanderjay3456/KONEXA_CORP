create extension if not exists pgcrypto;

create table if not exists public.app_records (
  collection_name text not null,
  record_id text not null default gen_random_uuid()::text,
  owner_id uuid null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection_name, record_id)
);

create index if not exists app_records_collection_idx on public.app_records (collection_name);
create index if not exists app_records_owner_idx on public.app_records (owner_id);
create index if not exists app_records_student_idx on public.app_records ((data->>'studentId')) where collection_name = 'applications';
create index if not exists app_records_company_idx on public.app_records ((data->>'companyId')) where collection_name in ('projects','applications');
create index if not exists app_records_match_idx on public.app_records ((data->>'matchId')) where collection_name = 'messages';

create or replace function public.konexa_role(target_user uuid default auth.uid())
returns text language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select data->>'role' from public.app_records where collection_name = 'users' and record_id = target_user::text),
    'student'
  );
$$;

create or replace function public.konexa_is_admin(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$
  select target_user is not null and public.konexa_role(target_user) = 'admin';
$$;

create or replace function public.can_read_app_record(c text, d jsonb, record_owner uuid, public_record boolean)
returns boolean language sql stable security definer set search_path = public
as $$
  select public_record
    or (auth.uid() is not null and record_owner = auth.uid())
    or public.konexa_is_admin(auth.uid())
    or (
      auth.uid() is not null and c = 'applications'
      and (d->>'studentId' = auth.uid()::text or d->>'companyId' = auth.uid()::text)
    )
    or (auth.uid() is not null and c = 'messages' and d->>'senderId' = auth.uid()::text);
$$;

create or replace function public.can_insert_app_record(c text, d jsonb, record_owner uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select auth.uid() is not null
    and record_owner = auth.uid()
    and (
      public.konexa_is_admin(auth.uid())
      or c in ('logs','sessions','verification_requests','security_logs','messages')
      or (c = 'projects' and public.konexa_role(auth.uid()) = 'company' and d->>'companyId' = auth.uid()::text)
      or (c = 'applications' and public.konexa_role(auth.uid()) = 'student' and d->>'studentId' = auth.uid()::text)
    );
$$;

create or replace function public.can_update_app_record(c text, d jsonb, record_owner uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select auth.uid() is not null and (
    public.konexa_is_admin(auth.uid())
    or record_owner = auth.uid()
    or (c = 'applications' and d->>'companyId' = auth.uid()::text and public.konexa_role(auth.uid()) = 'company')
  );
$$;

create or replace function public.touch_app_record()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  if old.collection_name = 'users' then
    new.data = jsonb_set(new.data, '{role}', old.data->'role', true);
    new.data = jsonb_set(new.data, '{email}', old.data->'email', true);
  end if;
  return new;
end;
$$;

drop trigger if exists app_records_touch on public.app_records;
create trigger app_records_touch before update on public.app_records
for each row execute function public.touch_app_record();

create or replace function public.handle_konexa_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  selected_role text;
  display_name text;
  created_ms bigint;
  profile_payload jsonb;
begin
  selected_role := case
    when new.raw_user_meta_data->>'role' in ('student','company') then new.raw_user_meta_data->>'role'
    else 'student'
  end;
  display_name := coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1), 'KONEXA Member');
  created_ms := floor(extract(epoch from now()) * 1000);

  insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
  values ('users', new.id::text, new.id,
    jsonb_build_object('uid',new.id::text,'email',coalesce(new.email,''),'displayName',display_name,'role',selected_role,'createdAt',created_ms),
    false)
  on conflict (collection_name, record_id) do nothing;

  if selected_role = 'company' then
    profile_payload := coalesce(new.raw_user_meta_data->'company_profile', '{}'::jsonb)
      || jsonb_build_object('uid',new.id::text,'companyName',display_name,'verified',false,'verifiedStatus','Pending','createdAt',created_ms);
    insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
    values ('company_profiles', new.id::text, new.id, profile_payload, false)
    on conflict (collection_name, record_id) do nothing;
  else
    profile_payload := coalesce(new.raw_user_meta_data->'student_profile', '{}'::jsonb)
      || jsonb_build_object('uid',new.id::text,'name',display_name,'trustScore',80,'completedProjects',0,'createdAt',created_ms);
    insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
    values ('student_profiles', new.id::text, new.id, profile_payload, false)
    on conflict (collection_name, record_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_konexa_user();

alter table public.app_records enable row level security;

drop policy if exists "app_records_select" on public.app_records;
create policy "app_records_select" on public.app_records
for select using (public.can_read_app_record(collection_name, data, owner_id, is_public));

drop policy if exists "app_records_insert" on public.app_records;
create policy "app_records_insert" on public.app_records
for insert with check (public.can_insert_app_record(collection_name, data, owner_id));

drop policy if exists "app_records_update" on public.app_records;
create policy "app_records_update" on public.app_records
for update using (public.can_update_app_record(collection_name, data, owner_id))
with check (public.can_update_app_record(collection_name, data, owner_id));

drop policy if exists "app_records_delete" on public.app_records;
create policy "app_records_delete" on public.app_records
for delete using (
  auth.uid() is not null and (
    public.konexa_is_admin(auth.uid())
    or (owner_id = auth.uid() and collection_name not in ('users','student_profiles','company_profiles','projects','applications'))
  )
);

drop policy if exists "waitlist_insert" on public.app_records;
create policy "waitlist_insert" on public.app_records
for insert to anon with check (collection_name = 'waitlist' and owner_id is null and is_public = false);

revoke all on table public.app_records from anon, authenticated;
grant select, insert on table public.app_records to anon;
grant select, insert, update, delete on table public.app_records to authenticated;
grant execute on function public.konexa_role(uuid) to authenticated;
grant execute on function public.konexa_is_admin(uuid) to authenticated;

insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
values
('projects','proj_seed_0',null,'{"id":"proj_seed_0","companyId":"seed","companyName":"KONEXA Labs","title":"Vite + React Core Performance Optimizer","description":"Build a lightweight profiling hook for Vite-based SPAs.","requirements":["Implement a custom performance profiler hook","Record component rendering metrics","Keep production overhead minimal"],"difficulty":"Hard","reward":"$2,800 + Fast-Track Offer","tags":["React 19","Vite","Web Vitals"],"status":"open","createdAt":1773504000000}'::jsonb,true),
('projects','proj_seed_1',null,'{"id":"proj_seed_1","companyId":"seed","companyName":"KONEXA Labs","title":"Google Workspace Sidebar Add-on","description":"Build a secure productivity companion for Workspace.","requirements":["Design collaborative views","Use OAuth securely","Build responsive components"],"difficulty":"Medium","reward":"$1,500 + Internship Interview","tags":["OAuth 2.0","TypeScript","SaaS"],"status":"open","createdAt":1773417600000}'::jsonb,true),
('projects','proj_seed_2',null,'{"id":"proj_seed_2","companyId":"seed","companyName":"KONEXA Labs","title":"Collaborative Canvas State Syncer","description":"Design a state synchronization layer for a collaborative canvas.","requirements":["Support concurrent edits","Implement undo and redo","Handle conflicts deterministically"],"difficulty":"Hard","reward":"$3,200 Contract","tags":["Realtime","TypeScript","Canvas"],"status":"open","createdAt":1773331200000}'::jsonb,true),
('projects','proj_seed_3',null,'{"id":"proj_seed_3","companyId":"seed","companyName":"KONEXA Labs","title":"Safe Markdown Parser","description":"Build a modular markdown preview with secure rendering.","requirements":["Sanitize HTML","Support code blocks","Keep bundle size low"],"difficulty":"Easy","reward":"$800 Task Reward","tags":["Security","Markdown","TypeScript"],"status":"open","createdAt":1773244800000}'::jsonb,true)
on conflict (collection_name, record_id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_records'
  ) then
    alter publication supabase_realtime add table public.app_records;
  end if;
end $$;
