create index if not exists konexa_talent_application_events_actor_idx
  on public.konexa_talent_application_events (actor_id);

create index if not exists konexa_talent_applications_reviewed_by_idx
  on public.konexa_talent_applications (reviewed_by);
