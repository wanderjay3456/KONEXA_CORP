-- Secure Google OAuth onboarding. OAuth-created accounts remain pending until
-- the user has selected a role and accepted the required KONEXA agreements.

create or replace function public.touch_app_record()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  authorized_role_change boolean;
begin
  new.updated_at = now();
  authorized_role_change :=
    auth.uid() is not null
    and current_setting('konexa.allow_role_change', true) = auth.uid()::text;

  if old.collection_name = 'users' then
    if not authorized_role_change then
      new.data = jsonb_set(new.data, '{role}', old.data->'role', true);
    end if;
    new.data = jsonb_set(new.data, '{email}', old.data->'email', true);
  end if;
  return new;
end;
$$;

-- Pending OAuth users must not inherit the default student permissions while
-- they have not selected a role and accepted the required agreements.
create or replace function private.konexa_role(target_user uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    (
      select case
        when data->>'onboardingStatus' = 'pending_google' then 'pending'
        else data->>'role'
      end
      from public.app_records
      where collection_name = 'users' and record_id = target_user::text
    ),
    'pending'
  );
$$;

create or replace function private.handle_konexa_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  selected_role text;
  display_name text;
  created_ms bigint;
  profile_payload jsonb;
  consent_payload jsonb;
  is_google boolean;
  onboarding_status text;
begin
  is_google :=
    coalesce(new.raw_app_meta_data->>'provider', '') = 'google'
    or coalesce(new.raw_app_meta_data->'providers', '[]'::jsonb) ? 'google';
  selected_role := case
    when new.raw_user_meta_data->>'role' in ('student','company') then new.raw_user_meta_data->>'role'
    else 'student'
  end;
  onboarding_status := case
    when is_google and new.raw_user_meta_data->>'role' is null then 'pending_google'
    else 'complete'
  end;
  display_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name',''),
    nullif(new.raw_user_meta_data->>'full_name',''),
    split_part(new.email,'@',1),
    'KONEXA Member'
  );
  created_ms := floor(extract(epoch from now()) * 1000);

  insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
  values ('users', new.id::text, new.id,
    jsonb_build_object(
      'uid',new.id::text,
      'email',coalesce(new.email,''),
      'displayName',display_name,
      'role',selected_role,
      'authProvider',case when is_google then 'google' else 'email' end,
      'onboardingStatus',onboarding_status,
      'createdAt',created_ms
    ), false)
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

  consent_payload := new.raw_user_meta_data->'consent_bundle';
  if consent_payload is not null and coalesce((consent_payload->>'terms')::boolean, false) then
    insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
    values (
      'consents', gen_random_uuid()::text, new.id,
      consent_payload || jsonb_build_object(
        'userId', new.id::text,
        'role', selected_role,
        'stage', 'signup',
        'acceptedAt', created_ms
      ), false
    );
  end if;
  return new;
end;
$$;

create or replace function public.complete_google_onboarding(
  requested_role text,
  consent_payload jsonb default '{}'::jsonb,
  profile_payload jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  caller uuid := auth.uid();
  existing_user jsonb;
  current_status text;
  existing_role text;
  created_ms bigint := floor(extract(epoch from now()) * 1000);
  safe_profile jsonb;
begin
  if caller is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;
  if requested_role not in ('student','company') then
    raise exception using message = 'Unsupported self-service role';
  end if;
  if not exists (
    select 1 from auth.identities
    where user_id = caller and provider = 'google'
  ) then
    raise insufficient_privilege using message = 'Verified Google identity required';
  end if;

  select data into existing_user
  from public.app_records
  where collection_name = 'users' and record_id = caller::text
  for update;

  if existing_user is null then
    raise exception using message = 'KONEXA user record not found';
  end if;

  current_status := coalesce(existing_user->>'onboardingStatus', 'complete');
  existing_role := coalesce(existing_user->>'role', 'student');
  if current_status <> 'pending_google' then
    return existing_role;
  end if;

  if not (
    coalesce((consent_payload->>'terms')::boolean, false)
    and coalesce((consent_payload->>'nonCircumvention')::boolean, false)
    and coalesce((consent_payload->>'crossBorderPrivacy')::boolean, false)
    and nullif(consent_payload->>'documentVersion', '') is not null
  ) then
    raise exception using message = 'Required signup agreements were not accepted';
  end if;

  perform set_config('konexa.allow_role_change', caller::text, true);
  update public.app_records
  set data = existing_user || jsonb_build_object(
    'role', requested_role,
    'authProvider', 'google',
    'onboardingStatus', 'complete'
  )
  where collection_name = 'users' and record_id = caller::text;

  if requested_role = 'company' then
    delete from public.app_records
    where collection_name = 'student_profiles' and record_id = caller::text;
    safe_profile := coalesce(profile_payload, '{}'::jsonb)
      - 'uid' - 'createdAt' - 'verified' - 'verifiedStatus' - 'trustScore' - 'completedProjects';
    insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
    values (
      'company_profiles', caller::text, caller,
      jsonb_build_object(
        'uid',caller::text,
        'companyName',coalesce(nullif(safe_profile->>'companyName',''), existing_user->>'displayName', 'Corporate Partner'),
        'verified',false,
        'verifiedStatus','Pending',
        'createdAt',created_ms
      ) || safe_profile,
      false
    )
    on conflict (collection_name, record_id) do update
      set data = excluded.data, updated_at = now();
  else
    delete from public.app_records
    where collection_name = 'company_profiles' and record_id = caller::text;
    safe_profile := coalesce(profile_payload, '{}'::jsonb)
      - 'uid' - 'createdAt' - 'verified' - 'verifiedStatus' - 'trustScore' - 'completedProjects';
    insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
    values (
      'student_profiles', caller::text, caller,
      jsonb_build_object(
        'uid',caller::text,
        'name',coalesce(nullif(safe_profile->>'name',''), existing_user->>'displayName', 'KONEXA Student'),
        'trustScore',80,
        'completedProjects',0,
        'createdAt',created_ms
      ) || safe_profile,
      false
    )
    on conflict (collection_name, record_id) do update
      set data = excluded.data, updated_at = now();
  end if;

  insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
  values (
    'consents', gen_random_uuid()::text, caller,
    consent_payload || jsonb_build_object(
      'userId',caller::text,
      'role',requested_role,
      'stage','signup',
      'acceptedAt',created_ms
    ),
    false
  );

  return requested_role;
end;
$$;

revoke all on function public.complete_google_onboarding(text,jsonb,jsonb) from public, anon;
grant execute on function public.complete_google_onboarding(text,jsonb,jsonb) to authenticated;
revoke all on function public.touch_app_record() from public, anon, authenticated;
