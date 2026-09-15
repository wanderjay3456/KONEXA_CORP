create or replace function public.konexa_resolve_dispute_v3(p_actor uuid,p_dispute_id uuid,p_summary text,p_resume boolean,p_idempotency_key text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.konexa_disputes%rowtype; c public.konexa_contracts%rowtype; prior jsonb; result jsonb; recipient uuid;
begin
  prior:=private.konexa_reserve_command(p_actor,'resolve_dispute',p_idempotency_key,
    jsonb_build_object('id',p_dispute_id,'summary',p_summary,'resume',p_resume));
  if prior is not null then return prior; end if;
  if private.konexa_role(p_actor)<>'admin' then raise exception 'admin_role_required'; end if;
  if char_length(btrim(coalesce(p_summary,''))) not between 20 and 5000 then raise exception 'resolution_summary_required'; end if;
  select * into d from public.konexa_disputes where id=p_dispute_id for update;
  if d.id is null then raise exception 'dispute_not_found'; end if;
  if d.status in ('resolved','closed') then raise exception 'dispute_already_resolved'; end if;
  perform 1 from public.konexa_relationships where id=d.relationship_id for update;
  update public.konexa_disputes set status='resolved',assigned_admin_id=p_actor,
    resolution=jsonb_build_object('summary',btrim(p_summary),'resolvedAt',clock_timestamp(),'resumeRequested',p_resume,'fundsMoved',false)
    where id=d.id;
  if p_resume and not exists(select 1 from public.konexa_disputes where relationship_id=d.relationship_id and status not in ('resolved','closed')) then
    for c in select * from public.konexa_contracts where relationship_id=d.relationship_id and status='disputed' for update loop
      -- Restore only states backed by persisted evidence. Never fabricate funding/signatures.
      update public.konexa_contracts set status=case
        when c.company_completed_at is not null and c.student_completed_at is not null then 'completed'
        when exists(select 1 from public.konexa_payment_orders where contract_id=c.id and status in ('funds_secured','paid') and amount_krw>=c.monthly_amount_krw)
          and (select count(*)=2 from public.konexa_contract_signatures where contract_id=c.id and verification_status='verified') then 'active'
        when (select count(*)=2 from public.konexa_contract_signatures where contract_id=c.id and verification_status='verified') then 'signed'
        else 'issued' end where id=c.id;
    end loop;
    update public.konexa_milestones m set status=coalesce((select case when s.review_decision='approved' then 'approved' when s.review_decision='rejected' then 'rejected' else 'submitted' end from public.konexa_milestone_submissions s where s.milestone_id=m.id order by version desc limit 1),'scheduled')
      where m.relationship_id=d.relationship_id and m.status='disputed';
    update public.konexa_relationships set status=case
      when exists(select 1 from public.konexa_contracts where relationship_id=d.relationship_id and status='completed')
        and not exists(select 1 from public.konexa_contracts where relationship_id=d.relationship_id and status not in ('completed','cancelled')) then 'completed'
      when exists(select 1 from public.konexa_contracts where relationship_id=d.relationship_id and status='active') then 'active'
      else 'accepted' end where id=d.relationship_id;
  end if;
  result:=jsonb_build_object('id',d.id,'status','resolved');
  perform private.konexa_append_audit(p_actor,'DISPUTE_RESOLVED','dispute',d.id::text,to_jsonb(d),result||jsonb_build_object('summary',p_summary,'resumeRequested',p_resume),p_idempotency_key);
  foreach recipient in array array[d.company_id,d.student_id] loop
    perform private.konexa_enqueue_notification(recipient,'dispute_action',result||jsonb_build_object('disputeId',d.id),'dispute-resolved:'||d.id::text||':'||recipient::text);
  end loop;
  perform private.konexa_complete_command(p_actor,'resolve_dispute',p_idempotency_key,result);
  return result;
end $$;
revoke all on function public.konexa_resolve_dispute_v3(uuid,uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.konexa_resolve_dispute_v3(uuid,uuid,text,boolean,text) to service_role;
