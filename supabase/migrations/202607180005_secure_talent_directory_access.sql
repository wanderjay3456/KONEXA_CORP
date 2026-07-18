-- Company verification status is server-controlled. Client-owned profile writes
-- cannot grant directory access by setting verified fields themselves.
create or replace function private.konexa_protect_company_verification()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'private'
as $$
begin
  if new.collection_name <> 'company_profiles' or coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.data := (new.data - 'verified' - 'verifiedStatus' - 'verificationReviewedAt')
      || jsonb_build_object('verified', false, 'verifiedStatus', 'Pending');
  else
    new.data := (new.data - 'verified' - 'verifiedStatus' - 'verificationReviewedAt')
      || jsonb_build_object(
        'verified', coalesce(old.data->'verified', 'false'::jsonb),
        'verifiedStatus', coalesce(old.data->'verifiedStatus', '"Pending"'::jsonb)
      )
      || case when old.data ? 'verificationReviewedAt'
        then jsonb_build_object('verificationReviewedAt', old.data->'verificationReviewedAt')
        else '{}'::jsonb end;
  end if;
  return new;
end;
$$;

revoke all on function private.konexa_protect_company_verification() from public, anon, authenticated;

drop trigger if exists konexa_protect_company_verification_trigger on public.app_records;
create trigger konexa_protect_company_verification_trigger
before insert or update of data on public.app_records
for each row
execute function private.konexa_protect_company_verification();

update public.app_records set is_public = false where collection_name = 'talent_cards';

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
      and private.konexa_role((select auth.uid())) = 'company'
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
    or (c = 'reviews' and private.konexa_record_party(c, d, (select auth.uid())))
    or (c = 'risk_events' and d->>'actorId' = (select auth.uid())::text)
    or (
      c = 'protected_contacts'
      and exists (
        select 1 from public.app_records unlock
        where unlock.collection_name = 'contact_unlocks'
          and unlock.data->>'companyId' = (select auth.uid())::text
          and unlock.data->>'talentId' = d->>'talentId'
          and unlock.data->>'status' = 'unlocked'
      )
    );
$$;