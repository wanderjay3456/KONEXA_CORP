-- Browser-created confirmations are not legal signatures. Only a trusted
-- provider webhook running with the service role may create signature records.
create or replace function private.require_verified_signature_writer()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.collection_name = 'contract_signatures'
     and coalesce(auth.role(), '') <> 'service_role' then
    raise insufficient_privilege using message = 'Verified e-signature provider webhook required';
  end if;
  return new;
end;
$$;

drop trigger if exists app_records_verified_signature_writer on public.app_records;
create trigger app_records_verified_signature_writer
before insert or update on public.app_records
for each row execute function private.require_verified_signature_writer();

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
        'basis', 'verified_modusign_signatures_and_secured_payment',
        'unlockedAt', floor(extract(epoch from now()) * 1000)
      ), false
    )
    on conflict (collection_name, record_id) do nothing;
  end if;
end;
$$;

revoke all on function private.require_verified_signature_writer() from public, anon, authenticated;
revoke all on function private.refresh_contact_unlock(text) from public, anon, authenticated;
