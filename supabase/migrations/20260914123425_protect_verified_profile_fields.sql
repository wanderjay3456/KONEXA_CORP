-- Verified facts are server-owned; ordinary profile edits remain available.
create or replace function private.konexa_protect_profile_facts()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  protected text[];
  field_name text;
  previous_data jsonb;
begin
  if new.collection_name not in ('users','student_profiles','company_profiles') then return new; end if;
  -- Auth bootstrap, SQL maintenance and server APIs are trusted writers.
  if current_user in ('postgres','supabase_admin','supabase_auth_admin','service_role') then return new; end if;
  if tg_op = 'UPDATE' and (new.collection_name, new.record_id, new.owner_id)
    is distinct from (old.collection_name, old.record_id, old.owner_id) then
    raise insufficient_privilege using message = 'KONEXA_PROFILE_IDENTITY_IMMUTABLE';
  end if;
  if new.record_id is distinct from new.owner_id::text then
    raise insufficient_privilege using message = 'KONEXA_PROFILE_OWNER_MISMATCH';
  end if;
  new.is_public := false;
  protected := array['trustScore','completedProjects','verified','verifiedStatus',
    'identityVerified','identityVerificationStatus','verificationReviewedAt',
    'verifiedAt','verifiedBy','badges','earlyPioneer','earlyPioneerPriority',
    'workPassport','accountStatus','isAdmin','subscriptionStatus','subscriptionTier'];
  if new.collection_name = 'users' then
    protected := protected || array['uid','email','role','createdAt','authProvider',
      'onboardingStatus','suspendedAt','suspensionReason'];
  end if;
  if tg_op = 'UPDATE' then
    previous_data := old.data;
  else
    -- UPSERT runs INSERT triggers before conflict resolution. Preserve an
    -- existing account, and never let a browser bootstrap its own role.
    select data into previous_data from public.app_records
      where collection_name=new.collection_name and record_id=new.record_id;
    if previous_data is null and new.collection_name='users' then
      raise insufficient_privilege using message = 'KONEXA_AUTH_BOOTSTRAP_REQUIRED';
    end if;
  end if;
  foreach field_name in array protected loop
    new.data := new.data - field_name;
    if previous_data ? field_name then
      new.data := new.data || jsonb_build_object(field_name, previous_data->field_name);
    end if;
  end loop;
  if previous_data is null and new.collection_name='student_profiles' then
    new.data := new.data || '{"trustScore":0,"completedProjects":0,"verified":false,"verifiedStatus":"Pending"}'::jsonb;
  end if;
  return new;
end;
$$;
revoke all on function private.konexa_protect_profile_facts() from public, anon, authenticated;
drop trigger if exists konexa_protect_profile_facts_trigger on public.app_records;
create trigger konexa_protect_profile_facts_trigger before insert or update on public.app_records
for each row execute function private.konexa_protect_profile_facts();

-- Keep the established auth/Google bootstrap logic, but remove user-controlled
-- verification flags and the historical, unearned default Trust Score of 80.
do $$
declare definition text; target regprocedure;
begin
  foreach target in array array[
    'private.handle_konexa_user()'::regprocedure,
    'public.complete_google_onboarding(text,jsonb,jsonb)'::regprocedure
  ] loop
    definition := pg_get_functiondef(target);
    definition := replace(definition, '''trustScore'',80', '''trustScore'',0');
    definition := replace(definition,
      'coalesce(new.raw_user_meta_data->''student_profile'', ''{}''::jsonb)',
      '(coalesce(new.raw_user_meta_data->''student_profile'', ''{}''::jsonb) - array[''verified'',''verifiedStatus'',''identityVerified'',''identityVerificationStatus'',''verificationReviewedAt'',''verifiedAt'',''verifiedBy'',''badges'',''earlyPioneer'',''workPassport'',''accountStatus'',''isAdmin''])');
    definition := replace(definition,
      '- ''uid'' - ''createdAt'' - ''verified'' - ''verifiedStatus'' - ''trustScore'' - ''completedProjects''',
      '- ''uid'' - ''createdAt'' - ''verified'' - ''verifiedStatus'' - ''trustScore'' - ''completedProjects'' - ''identityVerified'' - ''identityVerificationStatus'' - ''verificationReviewedAt'' - ''verifiedAt'' - ''verifiedBy'' - ''badges'' - ''earlyPioneer'' - ''workPassport'' - ''accountStatus'' - ''isAdmin''');
    execute definition;
  end loop;
end;
$$;

-- A suspended account must not retain its application role in database checks.
create or replace function private.konexa_role(target_user uuid default auth.uid())
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select case
    when data->>'accountStatus'='Suspended' then 'suspended'
    when data->>'onboardingStatus'='pending_google' then 'pending'
    else data->>'role' end
    from public.app_records where collection_name='users' and record_id=target_user::text), 'pending');
$$;
