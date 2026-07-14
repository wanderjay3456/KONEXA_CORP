
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.konexa_role(target_user uuid default auth.uid())
returns text language sql stable security definer set search_path = public, private
as $$
  select coalesce(
    (select data->>'role' from public.app_records where collection_name = 'users' and record_id = target_user::text),
    'student'
  );
$$;

create or replace function private.konexa_is_admin(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public, private
as $$
  select target_user is not null and private.konexa_role(target_user) = 'admin';
$$;

create or replace function private.can_read_app_record(c text, d jsonb, record_owner uuid, public_record boolean)
returns boolean language sql stable security definer set search_path = public, private
as $$
  select public_record
    or (auth.uid() is not null and record_owner = auth.uid())
    or private.konexa_is_admin(auth.uid())
    or (
      auth.uid() is not null and c = 'applications'
      and (d->>'studentId' = auth.uid()::text or d->>'companyId' = auth.uid()::text)
    )
    or (auth.uid() is not null and c = 'messages' and d->>'senderId' = auth.uid()::text);
$$;

create or replace function private.can_insert_app_record(c text, d jsonb, record_owner uuid)
returns boolean language sql stable security definer set search_path = public, private
as $$
  select auth.uid() is not null
    and record_owner = auth.uid()
    and (
      private.konexa_is_admin(auth.uid())
      or c in ('logs','sessions','verification_requests','security_logs','messages')
      or (c = 'projects' and private.konexa_role(auth.uid()) = 'company' and d->>'companyId' = auth.uid()::text)
      or (c = 'applications' and private.konexa_role(auth.uid()) = 'student' and d->>'studentId' = auth.uid()::text)
    );
$$;

create or replace function private.can_update_app_record(c text, d jsonb, record_owner uuid)
returns boolean language sql stable security definer set search_path = public, private
as $$
  select auth.uid() is not null and (
    private.konexa_is_admin(auth.uid())
    or record_owner = auth.uid()
    or (c = 'applications' and d->>'companyId' = auth.uid()::text and private.konexa_role(auth.uid()) = 'company')
  );
$$;

create or replace function private.handle_konexa_user()
returns trigger language plpgsql security definer set search_path = public, private
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

drop policy if exists "app_records_select" on public.app_records;
create policy "app_records_select" on public.app_records
for select to anon, authenticated
using (private.can_read_app_record(collection_name, data, owner_id, is_public));

drop policy if exists "app_records_insert" on public.app_records;
create policy "app_records_insert" on public.app_records
for insert to authenticated
with check (private.can_insert_app_record(collection_name, data, owner_id));

drop policy if exists "app_records_update" on public.app_records;
create policy "app_records_update" on public.app_records
for update to authenticated
using (private.can_update_app_record(collection_name, data, owner_id))
with check (private.can_update_app_record(collection_name, data, owner_id));

drop policy if exists "app_records_delete" on public.app_records;
create policy "app_records_delete" on public.app_records
for delete to authenticated using (
  private.konexa_is_admin((select auth.uid()))
  or (owner_id = (select auth.uid()) and collection_name not in ('users','student_profiles','company_profiles','projects','applications'))
);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_konexa_user();

revoke all on all functions in schema private from public;
grant execute on function private.can_read_app_record(text,jsonb,uuid,boolean) to anon, authenticated;
grant execute on function private.can_insert_app_record(text,jsonb,uuid) to authenticated;
grant execute on function private.can_update_app_record(text,jsonb,uuid) to authenticated;
grant execute on function private.konexa_is_admin(uuid) to authenticated;
grant execute on function private.konexa_role(uuid) to authenticated;

drop function if exists public.can_read_app_record(text,jsonb,uuid,boolean);
drop function if exists public.can_insert_app_record(text,jsonb,uuid);
drop function if exists public.can_update_app_record(text,jsonb,uuid);
drop function if exists public.konexa_is_admin(uuid);
drop function if exists public.konexa_role(uuid);
drop function if exists public.handle_konexa_user();
