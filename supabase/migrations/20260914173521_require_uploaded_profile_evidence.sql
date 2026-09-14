-- A path string is not evidence: completion requires an existing private object
-- in the correct bucket and the same account's path namespace. Existing source
-- records are not modified by this migration.
do $migration$
declare
  definition text := pg_get_functiondef('private.validate_konexa_profile_completion()'::regprocedure);
  anchor text := E'  return new;\nend;';
  checks text := $checks$
  if new.collection_name = 'student_profiles' then
    if left(coalesce(d->>'identityDocumentPath',''), length(new.owner_id::text) + 1) <> new.owner_id::text || '/'
      or not exists (select 1 from storage.objects o where o.bucket_id='identity-documents' and o.name=d->>'identityDocumentPath') then
      raise exception using message = 'KONEXA_PROFILE_FILE_MISSING:identityDocumentPath';
    end if;
    if left(coalesce(d->>'resumeUrl',''), length(new.owner_id::text) + 1) <> new.owner_id::text || '/'
      or not exists (select 1 from storage.objects o where o.bucket_id='resumes' and o.name=d->>'resumeUrl') then
      raise exception using message = 'KONEXA_PROFILE_FILE_MISSING:resumeUrl';
    end if;
  elsif new.collection_name = 'company_profiles' then
    if left(coalesce(d->>'businessRegistrationDocumentPath',''), length(new.owner_id::text) + 1) <> new.owner_id::text || '/'
      or not exists (select 1 from storage.objects o where o.bucket_id='business-documents' and o.name=d->>'businessRegistrationDocumentPath') then
      raise exception using message = 'KONEXA_PROFILE_FILE_MISSING:businessRegistrationDocumentPath';
    end if;
  end if;
$checks$;
begin
  if position('KONEXA_PROFILE_FILE_MISSING' in definition) > 0 then return; end if;
  if position(anchor in definition) = 0 then raise exception 'Profile validation anchor changed; review migration'; end if;
  execute replace(definition, anchor, checks || anchor);
end;
$migration$;
