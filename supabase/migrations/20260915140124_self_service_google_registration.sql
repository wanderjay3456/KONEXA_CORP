-- Applied as 20260915140124 to the linked project.
-- The API verifies the access token with auth.getUser before calling this
-- service-only wrapper. service_role deliberately cannot SELECT auth.users.
-- Check the server-created account row here; the existing definer function
-- below still checks the Google identity, expiring intent and actual consents.
create or replace function public.konexa_complete_google_registration_v2(
  p_registration_id uuid,
  p_caller_id uuid
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  account_data jsonb;
begin
  select data into account_data
  from public.app_records
  where collection_name = 'users'
    and record_id = p_caller_id::text
    and owner_id = p_caller_id;

  if p_caller_id is null or account_data is null then
    raise exception using message = 'authenticated_user_not_found';
  end if;
  if account_data->>'accountStatus' = 'Suspended' then
    raise insufficient_privilege using message = 'account_suspended';
  end if;

  perform set_config('request.jwt.claim.sub', p_caller_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  -- No administrative approval is involved in account creation or consent.
  -- Document verification stays separate and is never set to Approved here.
  return public.complete_google_registration(p_registration_id);
end;
$$;

revoke all on function public.konexa_complete_google_registration_v2(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.konexa_complete_google_registration_v2(uuid, uuid)
  to service_role;
