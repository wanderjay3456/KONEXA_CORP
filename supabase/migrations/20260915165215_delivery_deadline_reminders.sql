-- One reminder per milestone, recipient and UTC day; existing outbox handles
-- preferences, suspension, delivery retries and duplicate worker claims.
create or replace function public.konexa_queue_delivery_reminders_v3()
returns integer language plpgsql security invoker set search_path='' as $$
declare r record; n integer:=0; reminder_key text;
begin
  for r in
    select m.id,m.status,m.student_id,m.company_id,m.due_at,m.submitted_at,c.scope
    from public.konexa_milestones m join public.konexa_contracts c on c.id=m.contract_id
    where c.status in ('funded','active') and (
      (m.status in ('scheduled','in_progress','rejected') and m.due_at<clock_timestamp()+interval '24 hours') or
      (m.status='submitted' and m.submitted_at<clock_timestamp()-make_interval(days=>case when c.scope->>'reviewDays' ~ '^[0-9]{1,2}$' then greatest(1,least(30,(c.scope->>'reviewDays')::integer)) else 5 end))
    )
    and not exists(select 1 from public.konexa_notification_outbox o where o.idempotency_key=
      'delivery-reminder:'||m.id::text||':'||case when m.status='submitted' then m.company_id::text else m.student_id::text end||':'||to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD'))
    order by m.due_at,m.id limit 200
  loop
    reminder_key:='delivery-reminder:'||r.id::text||':'||case when r.status='submitted' then r.company_id::text else r.student_id::text end||':'||to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD');
    perform private.konexa_enqueue_notification(case when r.status='submitted' then r.company_id else r.student_id end,'milestone_action',
      jsonb_build_object('milestoneId',r.id,'status',case when r.status='submitted' then 'review_due' when r.due_at<clock_timestamp() then 'overdue' else 'due_soon' end),reminder_key);
    n:=n+1;
  end loop;
  return n;
end $$;
revoke all on function public.konexa_queue_delivery_reminders_v3() from public,anon,authenticated;
grant execute on function public.konexa_queue_delivery_reminders_v3() to service_role;
create index if not exists konexa_milestones_delivery_reminder_idx on public.konexa_milestones(due_at,id)
  where status in ('scheduled','in_progress','rejected','submitted');
