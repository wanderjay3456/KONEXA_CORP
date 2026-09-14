-- Respect private-profile choices and never publish internal QA fixtures.
do $$
declare definition text; previous text := 'if lower(coalesce(new.data->>''onboardingCompleted'', ''false'')) <> ''true'' then';
begin
  definition := pg_get_functiondef('private.konexa_sync_talent_card()'::regprocedure);
  if strpos(definition, previous) = 0 then raise exception 'Unexpected talent-card trigger definition'; end if;
  definition := replace(definition, previous,
    'if lower(coalesce(new.data->>''onboardingCompleted'', ''false'')) <> ''true''
      or lower(coalesce(new.data->>''isTest'', ''false'')) = ''true''
      or lower(coalesce(new.data#>>''{privacySettings,publicProfile}'', ''true'')) = ''false'' then');
  execute definition;
end;
$$;
delete from public.app_records card
using public.app_records profile
where card.collection_name='talent_cards' and profile.collection_name='student_profiles'
  and card.record_id=profile.record_id
  and (profile.data->>'isTest'='true' or profile.data#>>'{privacySettings,publicProfile}'='false');
