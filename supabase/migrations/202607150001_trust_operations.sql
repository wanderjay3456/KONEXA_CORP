-- KONEXA trust, contracting, contact-release, and off-platform risk controls.
-- Product records remain in app_records for compatibility with the existing client.

create index if not exists app_records_relationship_idx
  on public.app_records ((data->>'relationshipId'))
  where collection_name in ('introductions','contracts','contract_signatures','milestones','milestone_submissions','payment_records','contact_unlocks','hiring_offers','disputes');

create index if not exists app_records_company_talent_idx
  on public.app_records ((data->>'companyId'), (data->>'talentId'))
  where collection_name in ('introductions','contracts','payment_records','contact_unlocks','hiring_offers','disputes');

create index if not exists app_records_risk_status_idx
  on public.app_records ((data->>'status'), updated_at desc)
  where collection_name = 'risk_events';

create or replace function private.konexa_company_verified(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select target_user is not null and exists (
    select 1
    from public.app_records
    where collection_name = 'company_profiles'
      and record_id = target_user::text
      and coalesce((data->>'verified')::boolean, false) = true
      and data->>'verifiedStatus' = 'Verified'
  );
$$;

create or replace function private.konexa_record_party(c text, d jsonb, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select target_user is not null and (
    d->>'userId' = target_user::text
    or d->>'companyId' = target_user::text
    or d->>'talentId' = target_user::text
    or d->>'studentId' = target_user::text
    or d->>'createdBy' = target_user::text
    or d->>'reviewerId' = target_user::text
    or (c = 'reviews' and d->>'status' = 'published' and d->>'revieweeId' = target_user::text)
  );
$$;

create or replace function private.konexa_relationship_party(relationship_id text, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select target_user is not null and exists (
    select 1
    from public.app_records
    where collection_name = 'introductions'
      and record_id = relationship_id
      and (data->>'companyId' = target_user::text or data->>'talentId' = target_user::text)
  );
$$;

create or replace function private.can_read_app_record(c text, d jsonb, record_owner uuid, public_record boolean)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select public_record
    or ((select auth.uid()) is not null and record_owner = (select auth.uid()))
    or private.konexa_is_admin((select auth.uid()))
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
        c = 'milestone_submissions'
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
      c not in ('users','student_profiles','company_profiles','projects','applications','consents','introductions','contracts','contract_signatures','payment_records','contact_unlocks','risk_events','work_passport_entries')
      and record_owner = (select auth.uid())
    )
    or (
      c = 'applications'
      and d->>'companyId' = (select auth.uid())::text
      and private.konexa_role((select auth.uid())) = 'company'
    )
  );
$$;

drop policy if exists "app_records_delete" on public.app_records;
create policy "app_records_delete" on public.app_records
for delete to authenticated
using (
  private.konexa_is_admin((select auth.uid()))
  or (
    owner_id = (select auth.uid())
    and collection_name not in (
      'users','student_profiles','company_profiles','projects','applications','consents','introductions','contracts',
      'contract_signatures','milestones','milestone_submissions','payment_records','contact_unlocks','hiring_offers',
      'reviews','disputes','risk_events','work_passport_entries','protected_contacts'
    )
  )
);

create or replace function private.refresh_contact_unlock(target_relationship text)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  relationship_data jsonb;
  company_user uuid;
  talent_user text;
  signed_count integer;
  paid_count integer;
begin
  select data into relationship_data
  from public.app_records
  where collection_name = 'introductions' and record_id = target_relationship;

  if relationship_data is null then return; end if;

  select count(distinct data->>'userId') into signed_count
  from public.app_records
  where collection_name = 'contract_signatures'
    and data->>'relationshipId' = target_relationship
    and data->>'signatureType' in ('company','talent')
    and data->>'provider' = 'modusign'
    and data->>'verificationStatus' = 'verified';

  select count(*) into paid_count
  from public.app_records
  where collection_name = 'payment_records'
    and data->>'relationshipId' = target_relationship
    and data->>'status' in ('paid','funds_secured');

  if signed_count >= 2 and paid_count >= 1 then
    if coalesce(relationship_data->>'companyId','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      return;
    end if;
    company_user := (relationship_data->>'companyId')::uuid;
    talent_user := relationship_data->>'talentId';
    insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
    values (
      'contact_unlocks', target_relationship, company_user,
      jsonb_build_object(
        'relationshipId', target_relationship,
        'companyId', relationship_data->>'companyId',
        'talentId', talent_user,
        'status', 'unlocked',
        'basis', 'bilateral_signature_and_secured_payment',
        'unlockedAt', floor(extract(epoch from now()) * 1000)
      ), false
    )
    on conflict (collection_name, record_id) do nothing;
  end if;
end;
$$;

create or replace function private.scan_konexa_trust_events()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  body_text text;
  actor uuid;
  signal text;
  target_relationship text;
begin
  if new.collection_name = 'messages' then
    body_text := coalesce(new.data->>'text', new.data->>'content', '');
    signal := case
      when body_text ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}' then 'email'
      when body_text ~* '(\+?[0-9][0-9 ()-]{7,}[0-9])' then 'phone'
      when body_text ~* '(linkedin\.com|instagram\.com|facebook\.com|t\.me/|telegram|kakao|zalo|whatsapp|wechat)' then 'social_id'
      else null
    end;
    actor := case
      when coalesce(new.data->>'senderId','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (new.data->>'senderId')::uuid
      else null
    end;
    if signal is not null and actor is not null then
      insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
      values (
        'risk_events', gen_random_uuid()::text, actor,
        jsonb_build_object(
          'actorId', actor::text,
          'matchId', new.data->>'matchId',
          'messageRecordId', new.record_id,
          'code', 'CONTACT_PATTERN',
          'matchedType', signal,
          'severity', 'medium',
          'status', 'open',
          'createdAt', floor(extract(epoch from now()) * 1000),
          'privacyNote', 'Message content is not copied into the risk event.'
        ), false
      );
    end if;
  end if;

  if new.collection_name in ('contract_signatures','payment_records') then
    target_relationship := new.data->>'relationshipId';
    if target_relationship is not null then
      perform private.refresh_contact_unlock(target_relationship);
    end if;
  end if;

  if tg_op = 'UPDATE' and new.collection_name = 'introductions' then
    if old.data->>'status' is distinct from new.data->>'status'
       and new.data->>'status' = 'cancelled' then
      actor := case
        when coalesce(new.data->>'cancelledBy','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then (new.data->>'cancelledBy')::uuid
        else new.owner_id
      end;
      if actor is not null then
      insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
      values (
        'risk_events', gen_random_uuid()::text, actor,
        jsonb_build_object(
          'actorId', actor::text,
          'relationshipId', new.record_id,
          'companyId', new.data->>'companyId',
          'talentId', new.data->>'talentId',
          'code', 'RELATIONSHIP_CANCELLED',
          'severity', 'low',
          'status', 'open',
          'createdAt', floor(extract(epoch from now()) * 1000)
        ), false
        );
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists app_records_trust_scan on public.app_records;
create trigger app_records_trust_scan
after insert or update on public.app_records
for each row execute function private.scan_konexa_trust_events();

-- Capture a durable signup consent receipt from the immutable auth event.
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
begin
  selected_role := case
    when new.raw_user_meta_data->>'role' in ('student','company') then new.raw_user_meta_data->>'role'
    else 'student'
  end;
  display_name := coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1), 'KONEXA Member');
  created_ms := floor(extract(epoch from now()) * 1000);

  insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
  values ('users', new.id::text, new.id,
    jsonb_build_object('uid',new.id::text,'email',coalesce(new.email,''),'displayName',display_name,'role',selected_role,'createdAt',created_ms), false)
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

revoke all on function private.konexa_company_verified(uuid) from public;
revoke all on function private.konexa_record_party(text,jsonb,uuid) from public;
revoke all on function private.konexa_relationship_party(text,uuid) from public;
revoke all on function private.refresh_contact_unlock(text) from public, anon, authenticated;
revoke all on function private.scan_konexa_trust_events() from public, anon, authenticated;
grant execute on function private.konexa_company_verified(uuid) to authenticated;
grant execute on function private.konexa_record_party(text,jsonb,uuid) to authenticated;
grant execute on function private.konexa_relationship_party(text,uuid) to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_konexa_user();
