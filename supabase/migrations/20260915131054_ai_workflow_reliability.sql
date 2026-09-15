-- Track attempts before contacting an AI provider; old rows are complete.
alter table public.konexa_ai_assessments add column if not exists status text not null default 'completed'
  check (status in ('pending', 'completed', 'failed'));
create index if not exists konexa_assessment_owner_history_idx
  on public.konexa_ai_assessments(requested_by, assessment_type, entity_id, created_at desc)
  where status='completed';
create index if not exists konexa_talent_card_paging_idx
  on public.app_records(record_id) where collection_name='talent_cards';

-- A talent card is deliberately NOT public to anonymous users. The API first
-- verifies the requesting company. Only the service role can call this lookup.
-- Joining the live account/profile also honors suspension and withdrawn consent
-- even if an old card survived a previous trigger or import.
create or replace function public.konexa_matching_candidate_page(p_after text default '', p_limit integer default 250)
returns table(record_id text, data jsonb)
language sql stable security invoker set search_path = '' as $$
  select c.record_id,
    c.data || jsonb_build_object(
      'preferredWeeklyPayKrw', p.data->'preferredWeeklyPayKrw',
      'availableHoursPerWeek', p.data->'availableHoursPerWeek')
  from public.app_records c
  join public.app_records p on p.collection_name='student_profiles' and p.record_id=c.record_id
  join public.app_records u on u.collection_name='users' and u.record_id=c.record_id
  where c.collection_name='talent_cards' and c.record_id > coalesce(p_after, '')
    and p.data->>'onboardingCompleted'='true'
    and coalesce(p.data->>'isTest','false') <> 'true'
    and coalesce(p.data#>>'{privacySettings,publicProfile}','true') <> 'false'
    and u.data->>'role'='student'
    and coalesce(u.data->>'accountStatus','Active') <> 'Suspended'
    and coalesce(u.data->>'onboardingStatus','complete') <> 'pending_google'
  order by c.record_id limit greatest(1,least(coalesce(p_limit,250),250));
$$;
revoke all on function public.konexa_matching_candidate_page(text,integer) from public, anon, authenticated;
grant execute on function public.konexa_matching_candidate_page(text,integer) to service_role;

-- Aggregates only. No recipient addresses, document paths, or message contents.
create or replace function public.konexa_automation_health()
returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object(
    'checkedAt', now(),
    'openProjects', (select count(*) from public.konexa_projects where status='open'),
    'pendingVerifications', (select count(*) from public.app_records where collection_name='verification_requests' and data->>'status'='Pending'),
    'queuedNotifications', (select count(*) from public.konexa_notification_outbox where status in ('pending','failed','processing')),
    'delayedNotifications', (select count(*) from public.konexa_notification_outbox where (status in ('pending','failed') and next_attempt_at < now()-interval '15 minutes') or (status='processing' and locked_at < now()-interval '15 minutes')),
    'deadLetters', (select count(*) from public.konexa_notification_outbox where status='dead_letter'),
    'aiCompleted24h', (select count(*) from public.konexa_ai_assessments where status='completed' and created_at > now()-interval '24 hours'),
    'aiFailed24h', (select count(*) from public.konexa_ai_assessments where status='failed' and created_at > now()-interval '24 hours'),
    'aiStale', (select count(*) from public.konexa_ai_assessments where status='pending' and created_at < now()-interval '5 minutes')
  );
$$;
revoke all on function public.konexa_automation_health() from public, anon, authenticated;
grant execute on function public.konexa_automation_health() to service_role;
