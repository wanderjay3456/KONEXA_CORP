-- An uploaded resume alone is not a complete profile. Require the validated
-- student onboarding flow as well as the resume and one-minute introduction video.
create or replace function private.konexa_award_early_bird()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid;
  entitlement_id text;
  entitlement jsonb;
begin
  if clock_timestamp() > timestamptz '2026-08-05 23:59:59+09' then
    return new;
  end if;

  if new.collection_name = 'projects'
     and coalesce(new.data->>'companyId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    account_id := (new.data->>'companyId')::uuid;
    entitlement_id := 'company:' || account_id::text;
    entitlement := jsonb_build_object(
      'id', entitlement_id,
      'userId', account_id::text,
      'role', 'company',
      'campaign', 'early_bird_2026_08_05',
      'qualifiedBy', 'first_project_published',
      'qualifiedAt', (extract(epoch from clock_timestamp()) * 1000)::bigint,
      'subscriptionDiscountPercent', 30,
      'subscriptionDiscountMonths', 5,
      'premiumTalentViewCredits', 1,
      'status', 'qualified'
    );
  elsif new.collection_name = 'student_profiles'
        and coalesce(new.data->>'uid', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        and lower(coalesce(new.data->>'onboardingCompleted', 'false')) = 'true'
        and nullif(btrim(new.data->>'resumeUrl'), '') is not null
        and nullif(btrim(new.data->>'introVideoPath'), '') is not null then
    account_id := (new.data->>'uid')::uuid;
    entitlement_id := 'student:' || account_id::text;
    entitlement := jsonb_build_object(
      'id', entitlement_id,
      'userId', account_id::text,
      'role', 'student',
      'campaign', 'early_bird_2026_08_05',
      'qualifiedBy', 'completed_profile_resume_and_intro_video',
      'qualifiedAt', (extract(epoch from clock_timestamp()) * 1000)::bigint,
      'badge', 'Early Pioneer',
      'priorityUntil', 'first_successful_placement',
      'resumeConsultingCredits', 1,
      'withdrawalFeePaybackWeeks', 4,
      'status', 'qualified'
    );
  else
    return new;
  end if;

  insert into public.app_records (collection_name, record_id, owner_id, data, is_public)
  values ('early_bird_entitlements', entitlement_id, account_id, entitlement, false)
  on conflict (collection_name, record_id)
  do update set data = public.app_records.data || excluded.data, owner_id = excluded.owner_id, updated_at = clock_timestamp();

  return new;
end;
$$;

revoke all on function private.konexa_award_early_bird() from public, anon, authenticated;