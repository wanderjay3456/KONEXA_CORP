-- Keep Google registration payloads on the server while OAuth leaves the app.
-- The browser only carries a short-lived, single-use UUID in the redirect URL.

create table if not exists private.oauth_registration_intents (
  id uuid primary key default gen_random_uuid(),
  requested_role text not null check (requested_role in ('student', 'company')),
  consent_payload jsonb not null default '{}'::jsonb,
  profile_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  consumed_at timestamptz
);

create index if not exists oauth_registration_intents_expiry_idx
  on private.oauth_registration_intents (expires_at)
  where consumed_at is null;

revoke all on table private.oauth_registration_intents from public, anon, authenticated;

create or replace function public.begin_google_registration(
  requested_role text,
  consent_payload jsonb default '{}'::jsonb,
  profile_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  registration_id uuid;
begin
  if requested_role not in ('student', 'company') then
    raise exception using message = 'Unsupported self-service role';
  end if;

  if not (
    coalesce((consent_payload->>'terms')::boolean, false)
    and coalesce((consent_payload->>'nonCircumvention')::boolean, false)
    and coalesce((consent_payload->>'crossBorderPrivacy')::boolean, false)
    and nullif(consent_payload->>'documentVersion', '') is not null
  ) then
    raise exception using message = 'Required signup agreements were not accepted';
  end if;

  if octet_length(coalesce(profile_payload, '{}'::jsonb)::text) > 50000
    or octet_length(coalesce(consent_payload, '{}'::jsonb)::text) > 10000 then
    raise exception using message = 'Registration payload is too large';
  end if;

  delete from private.oauth_registration_intents
  where expires_at < now() - interval '1 day';

  insert into private.oauth_registration_intents(requested_role, consent_payload, profile_payload)
  values (requested_role, coalesce(consent_payload, '{}'::jsonb), coalesce(profile_payload, '{}'::jsonb))
  returning id into registration_id;

  return registration_id;
end;
$$;

create or replace function public.complete_google_registration(registration_id uuid)
returns text
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  caller uuid := auth.uid();
  intent private.oauth_registration_intents%rowtype;
  existing_user jsonb;
  existing_role text;
  current_status text;
  completed_role text;
begin
  if caller is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  if not exists (
    select 1 from auth.identities
    where user_id = caller and provider = 'google'
  ) then
    raise insufficient_privilege using message = 'Verified Google identity required';
  end if;

  select * into intent
  from private.oauth_registration_intents
  where id = registration_id
    and consumed_at is null
    and expires_at > now()
  for update;

  if intent.id is null then
    raise exception using message = 'Google registration request expired or was already used';
  end if;

  select data into existing_user
  from public.app_records
  where collection_name = 'users' and record_id = caller::text
  for update;

  if existing_user is null then
    raise exception using message = 'KONEXA user record not found';
  end if;

  existing_role := coalesce(existing_user->>'role', 'student');
  current_status := coalesce(existing_user->>'onboardingStatus', 'complete');

  if current_status <> 'pending_google' then
    if existing_role <> intent.requested_role then
      raise exception using message = 'KONEXA_ROLE_CONFLICT:' || existing_role;
    end if;
    update private.oauth_registration_intents set consumed_at = now() where id = intent.id;
    return existing_role;
  end if;

  completed_role := public.complete_google_onboarding(
    intent.requested_role,
    intent.consent_payload,
    intent.profile_payload
  );

  update private.oauth_registration_intents set consumed_at = now() where id = intent.id;
  return completed_role;
end;
$$;

revoke all on function public.begin_google_registration(text, jsonb, jsonb) from public;
grant execute on function public.begin_google_registration(text, jsonb, jsonb) to anon, authenticated;

revoke all on function public.complete_google_registration(uuid) from public, anon;
grant execute on function public.complete_google_registration(uuid) to authenticated;

-- The payload-bearing completion endpoint is now internal to the nonce flow.
revoke all on function public.complete_google_onboarding(text, jsonb, jsonb) from authenticated;
