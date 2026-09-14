create function public.konexa_claim_recipient_notifications(p_worker_id text, p_recipient uuid, p_limit integer default 2)
returns setof public.konexa_notification_outbox
language sql security invoker set search_path = '' as $$
  with claimable as (
    select id from public.konexa_notification_outbox
    where recipient_id = p_recipient
      and (status in ('pending','failed') or (status='processing' and locked_at < clock_timestamp()-interval '15 minutes'))
      and next_attempt_at <= clock_timestamp() and attempts < 5
    order by created_at for update skip locked limit greatest(1,least(coalesce(p_limit,2),2))
  )
  update public.konexa_notification_outbox n
  set status='processing',locked_by=left(p_worker_id,160),locked_at=clock_timestamp(),attempts=attempts+1
  from claimable where n.id=claimable.id returning n.*;
$$;
revoke all on function public.konexa_claim_recipient_notifications(text,uuid,integer) from public,anon,authenticated;
grant execute on function public.konexa_claim_recipient_notifications(text,uuid,integer) to service_role;
create index if not exists notification_outbox_recipient_due on public.konexa_notification_outbox(recipient_id,next_attempt_at)
where status in ('pending','failed','processing');
