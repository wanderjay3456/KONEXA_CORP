-- Match the three-step profile form. Public portfolios are optional for non-software talent.
-- Preserve mandatory private evidence and validate malformed/null collections safely.
create or replace function private.validate_konexa_profile_completion()
returns trigger language plpgsql set search_path = '' as $$
declare
  d jsonb := new.data;
  missing text[] := array[]::text[];
  fields text[];
  field_name text;
  skill_key text;
begin
  if new.collection_name not in ('student_profiles','company_profiles')
    or lower(coalesce(d->>'onboardingCompleted','false')) <> 'true' then return new; end if;
  if new.owner_id is null or new.record_id <> new.owner_id::text then
    raise exception using message = 'KONEXA_PROFILE_OWNER_MISMATCH';
  end if;
  if new.collection_name = 'student_profiles' then
    fields := array['name','nationality','currentCountry','timezone','university','degree','major',
      'graduationYear','englishLevel','preferredJob','availability','bio','identityDocumentPath','resumeUrl'];
    skill_key := 'skills';
    if coalesce(d->>'preferredWeeklyPayKrw','') ~ '^[0-9]+([.][0-9]+)?$' then
      if (d->>'preferredWeeklyPayKrw')::numeric <= 0 then missing := array_append(missing,'preferredWeeklyPayKrw'); end if;
    else missing := array_append(missing,'preferredWeeklyPayKrw'); end if;
  else
    fields := array['companyName','businessRegistrationNumber','country','industry','companySize','website',
      'officeLocation','contactPerson','position','corporateEmail','phoneNumber','companyIntroduction','businessRegistrationDocumentPath'];
    skill_key := 'requiredSkills';
    if coalesce(d->>'website','') !~* '^https?://[^[:space:]]+$' then missing := array_append(missing,'website'); end if;
    if coalesce(d->>'corporateEmail','') !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then missing := array_append(missing,'corporateEmail'); end if;
  end if;
  foreach field_name in array fields loop
    if nullif(btrim(d->>field_name),'') is null then missing := array_append(missing,field_name); end if;
  end loop;
  if jsonb_typeof(d->skill_key) is distinct from 'array' then
    missing := array_append(missing,skill_key);
  elsif jsonb_array_length(d->skill_key) = 0 then
    missing := array_append(missing,skill_key);
  end if;
  if cardinality(missing) > 0 then
    raise exception using message = 'KONEXA_PROFILE_INCOMPLETE:' || array_to_string(missing,',');
  end if;
  return new;
end;
$$;
