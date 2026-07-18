-- Publish only a deliberately minimized talent card. Private student profiles,
-- names, emails, social URLs, documents, and video paths remain owner/admin-only.
create or replace function private.konexa_sync_talent_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid;
  safe_card jsonb;
  is_pioneer boolean;
begin
  if new.collection_name <> 'student_profiles'
     or coalesce(new.data->>'uid', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return new;
  end if;

  account_id := (new.data->>'uid')::uuid;
  if lower(coalesce(new.data->>'onboardingCompleted', 'false')) <> 'true' then
    delete from public.app_records
    where collection_name = 'talent_cards' and record_id = account_id::text;
    return new;
  end if;

  is_pioneer := lower(coalesce(new.data->>'earlyPioneerEligible', 'false')) = 'true'
    or exists (
      select 1 from public.app_records entitlement
      where entitlement.collection_name = 'early_bird_entitlements'
        and entitlement.record_id = 'student:' || account_id::text
        and entitlement.data->>'status' = 'qualified'
    );

  safe_card := jsonb_build_object(
    'id', account_id::text,
    'degree', coalesce(new.data->>'degree', ''),
    'major', coalesce(new.data->>'major', ''),
    'graduationYear', coalesce(new.data->>'graduationYear', ''),
    'skills', coalesce(new.data->'skills', '[]'::jsonb),
    'languages', coalesce(new.data->'languages', '[]'::jsonb),
    'englishLevel', coalesce(new.data->>'englishLevel', ''),
    'koreanLevel', coalesce(new.data->>'koreanLevel', ''),
    'careerInterests', coalesce(new.data->'careerInterests', '[]'::jsonb),
    'preferredIndustry', coalesce(new.data->>'preferredIndustry', ''),
    'preferredJob', coalesce(new.data->>'preferredJob', ''),
    'availability', coalesce(new.data->>'availability', ''),
    'workPreference', coalesce(new.data->>'workPreference', ''),
    'timezone', coalesce(new.data->>'timezone', ''),
    'trustScore', case when coalesce(new.data->>'trustScore', '') ~ '^[0-9]+([.][0-9]+)?$' then (new.data->>'trustScore')::numeric else 0 end,
    'completedProjects', case when coalesce(new.data->>'completedProjects', '') ~ '^[0-9]+([.][0-9]+)?$' then (new.data->>'completedProjects')::numeric else 0 end,
    'aiCareerReadiness', case when coalesce(new.data->>'aiCareerReadiness', '') ~ '^[0-9]+([.][0-9]+)?$' then (new.data->>'aiCareerReadiness')::numeric else 0 end,
    'aiEmployabilityScore', case when coalesce(new.data->>'aiEmployabilityScore', '') ~ '^[0-9]+([.][0-9]+)?$' then (new.data->>'aiEmployabilityScore')::numeric else 0 end,
    'portfolioAvailable', coalesce(nullif(btrim(new.data->>'github'), ''), nullif(btrim(new.data->>'portfolio'), '')) is not null,
    'resumeAvailable', nullif(btrim(new.data->>'resumeUrl'), '') is not null,
    'introVideoAvailable', nullif(btrim(new.data->>'introVideoPath'), '') is not null,
    'earlyPioneerEligible', is_pioneer,
    'createdAt', coalesce(new.data->'createdAt', to_jsonb((extract(epoch from clock_timestamp()) * 1000)::bigint))
  );

  insert into public.app_records (collection_name, record_id, owner_id, data, is_public)
  values ('talent_cards', account_id::text, account_id, safe_card, false)
  on conflict (collection_name, record_id)
  do update set data = excluded.data, owner_id = excluded.owner_id, is_public = false, updated_at = clock_timestamp();

  return new;
end;
$$;

revoke all on function private.konexa_sync_talent_card() from public, anon, authenticated;

-- Talent cards are not public. Only the owner, admins, and business-verified
-- company accounts can read the minimized directory record.
create or replace function private.can_read_app_record(c text, d jsonb, record_owner uuid, public_record boolean)
returns boolean
language sql
stable security definer
set search_path to 'public', 'private'
as $$
  select public_record
    or ((select auth.uid()) is not null and record_owner = (select auth.uid()))
    or private.konexa_is_admin((select auth.uid()))
    or (
      (select auth.uid()) is not null
      and c = 'talent_cards'
      and private.konexa_company_verified((select auth.uid()))
    )
    or (
      (select auth.uid()) is not null
      and c = 'applications'
      and (d->>'studentId' = (select auth.uid())::text or d->>'companyId' = (select auth.uid())::text)
    )
    or (
      (select auth.uid()) is not null
      and c = 'messages'
      and private.konexa_match_member(d->>'matchId', (select auth.uid()))
    )
    or (
      c in ('introductions','contracts','contract_signatures','milestones','milestone_submissions','payment_records','contact_unlocks','hiring_offers','disputes','activity_checkins','work_passport_entries')
      and private.konexa_record_party(c, d, (select auth.uid()))
    )
    or (
      c = 'reviews'
      and private.konexa_record_party(c, d, (select auth.uid()))
    )
    or (
      c = 'risk_events'
      and d->>'actorId' = (select auth.uid())::text
    )
    or (
      c = 'protected_contacts'
      and exists (
        select 1
        from public.app_records unlock
        where unlock.collection_name = 'contact_unlocks'
          and unlock.data->>'companyId' = (select auth.uid())::text
          and unlock.data->>'talentId' = d->>'talentId'
          and unlock.data->>'status' = 'unlocked'
      )
    );
$$;

drop trigger if exists konexa_sync_talent_card_trigger on public.app_records;
create trigger konexa_sync_talent_card_trigger
after insert or update of data on public.app_records
for each row
execute function private.konexa_sync_talent_card();

-- Backfill only profiles that already passed the validated required-information flow.
update public.app_records
set data = data
where collection_name = 'student_profiles'
  and lower(coalesce(data->>'onboardingCompleted', 'false')) = 'true';