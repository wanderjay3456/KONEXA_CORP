-- Allow authenticated users to create and update only their own core records.

create or replace function private.can_insert_app_record(c text, d jsonb, record_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select (select auth.uid()) is not null
    and record_owner = (select auth.uid())
    and (
      private.konexa_is_admin((select auth.uid()))
      or (
        c in ('users','student_profiles','company_profiles')
        and d->>'uid' = (select auth.uid())::text
      )
      or c in ('logs','sessions','verification_requests','security_logs')
      or (
        c = 'messages'
        and d->>'senderId' = (select auth.uid())::text
        and private.konexa_match_member(d->>'matchId', (select auth.uid()))
      )
      or (
        c = 'projects'
        and private.konexa_role((select auth.uid())) = 'company'
        and d->>'companyId' = (select auth.uid())::text
      )
      or (
        c = 'applications'
        and private.konexa_role((select auth.uid())) = 'student'
        and d->>'studentId' = (select auth.uid())::text
      )
      or (
        c = 'consents'
        and d->>'userId' = (select auth.uid())::text
        and d->>'documentVersion' is not null
      )
      or (
        c = 'introductions'
        and private.konexa_role((select auth.uid())) = 'company'
        and private.konexa_company_verified((select auth.uid()))
        and d->>'companyId' = (select auth.uid())::text
        and d->>'talentId' is not null
      )
      or (
        c in ('contracts','milestones','hiring_offers')
        and private.konexa_role((select auth.uid())) = 'company'
        and private.konexa_company_verified((select auth.uid()))
        and d->>'companyId' = (select auth.uid())::text
        and private.konexa_relationship_party(d->>'relationshipId', (select auth.uid()))
      )
      or (
        c in ('contract_signatures','milestone_submissions')
        and d->>'userId' = (select auth.uid())::text
        and private.konexa_relationship_party(d->>'relationshipId', (select auth.uid()))
      )
      or (
        c = 'reviews'
        and d->>'reviewerId' = (select auth.uid())::text
        and d->>'status' = 'sealed'
      )
      or (
        c = 'disputes'
        and d->>'createdBy' = (select auth.uid())::text
        and private.konexa_relationship_party(d->>'relationshipId', (select auth.uid()))
      )
      or (
        c = 'risk_events'
        and d->>'actorId' = (select auth.uid())::text
        and d->>'status' = 'open'
      )
      or (
        c = 'activity_checkins'
        and d->>'userId' = (select auth.uid())::text
      )
      or (
        c = 'protected_contacts'
        and private.konexa_role((select auth.uid())) = 'student'
        and d->>'userId' = (select auth.uid())::text
        and d->>'talentId' = (select auth.uid())::text
      )
    );
$$;

create or replace function private.can_update_app_record(c text, d jsonb, record_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select (select auth.uid()) is not null and (
    private.konexa_is_admin((select auth.uid()))
    or (
      c in ('users','student_profiles','company_profiles')
      and record_owner = (select auth.uid())
      and d->>'uid' = (select auth.uid())::text
    )
    or (
      c not in ('users','student_profiles','company_profiles','projects','applications','consents','introductions','contracts','contract_signatures','payment_records','contact_unlocks','risk_events','reviews','work_passport_entries')
      and record_owner = (select auth.uid())
    )
    or (
      c = 'applications'
      and d->>'companyId' = (select auth.uid())::text
      and private.konexa_role((select auth.uid())) = 'company'
    )
  );
$$;

revoke all on function private.can_insert_app_record(text, jsonb, uuid) from public, anon, authenticated;
revoke all on function private.can_update_app_record(text, jsonb, uuid) from public, anon, authenticated;
