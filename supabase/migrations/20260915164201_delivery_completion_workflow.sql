-- Delivery evidence, bilateral completion and durable feedback. No payment,
-- signature or verified identity is fabricated or relaxed by this migration.
alter table public.konexa_contracts add column if not exists company_completed_at timestamptz;
alter table public.konexa_contracts add column if not exists student_completed_at timestamptz;
alter table public.konexa_milestone_submissions add column if not exists review_feedback text;
alter table public.konexa_milestone_submissions add column if not exists review_decision text
  check (review_decision in ('approved','rejected'));
alter table public.konexa_milestone_submissions add column if not exists reviewed_at timestamptz;

create or replace function private.konexa_guard_delivery_evidence()
returns trigger language plpgsql security invoker set search_path='' as $$
declare m public.konexa_milestones%rowtype; c public.konexa_contracts%rowtype; path text;
begin
  select * into m from public.konexa_milestones where id=new.milestone_id;
  select * into c from public.konexa_contracts where id=m.contract_id for update;
  if new.submitted_by <> m.student_id then raise exception 'submission_owner_forbidden'; end if;
  if c.status not in ('funded','active') or not exists (
    select 1 from public.konexa_payment_orders where contract_id=c.id
      and status in ('funds_secured','paid') and amount_krw >= c.monthly_amount_krw
  ) then raise exception 'verified_funding_required'; end if;
  if char_length(btrim(new.notes)) < 10 and cardinality(new.storage_paths)=0 then
    raise exception 'delivery_evidence_required';
  end if;
  foreach path in array new.storage_paths loop
    if split_part(path,'/',1) <> new.submitted_by::text or not exists (
      select 1 from storage.objects where bucket_id='project-deliverables' and name=path
        and coalesce(owner_id,owner::text)=new.submitted_by::text
    ) then raise exception 'delivery_file_forbidden'; end if;
  end loop;
  return new;
end $$;
revoke all on function private.konexa_guard_delivery_evidence() from public,anon,authenticated;
create trigger konexa_guard_delivery_evidence before insert on public.konexa_milestone_submissions
  for each row execute function private.konexa_guard_delivery_evidence();

create or replace function private.konexa_guard_milestone_budget()
returns trigger language plpgsql security invoker set search_path='' as $$
declare c public.konexa_contracts%rowtype; allocated bigint;
begin
  select * into c from public.konexa_contracts where id=new.contract_id for update;
  if c.company_completed_at is not null or c.student_completed_at is not null then
    raise exception 'completion_already_started';
  end if;
  select coalesce(sum(amount_krw),0) into allocated from public.konexa_milestones
    where contract_id=c.id and status<>'cancelled';
  if allocated+new.amount_krw > c.monthly_amount_krw then raise exception 'invalid_milestone_budget'; end if;
  return new;
end $$;
revoke all on function private.konexa_guard_milestone_budget() from public,anon,authenticated;
create trigger konexa_guard_milestone_budget before insert on public.konexa_milestones
  for each row execute function private.konexa_guard_milestone_budget();

create or replace function public.konexa_review_delivery_v3(
  p_actor uuid,p_milestone_id uuid,p_decision text,p_feedback text,p_idempotency_key text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior jsonb; result jsonb; s public.konexa_milestone_submissions%rowtype;
  m public.konexa_milestones%rowtype;
begin
  prior:=private.konexa_reserve_command(p_actor,'review_delivery',p_idempotency_key,
    jsonb_build_object('id',p_milestone_id,'decision',p_decision,'feedback',p_feedback));
  if prior is not null then return prior; end if;
  if char_length(btrim(coalesce(p_feedback,''))) not between 10 and 5000 then raise exception 'review_feedback_required'; end if;
  select * into m from public.konexa_milestones where id=p_milestone_id for update;
  select * into s from public.konexa_milestone_submissions where milestone_id=p_milestone_id order by version desc limit 1;
  if s.id is null then raise exception 'delivery_evidence_required'; end if;
  if m.company_id<>p_actor or private.konexa_role(p_actor)<>'company' then raise exception 'milestone_review_forbidden'; end if;
  if m.status<>'submitted' or p_decision not in ('approved','rejected') then raise exception 'invalid_milestone_review_transition'; end if;
  update public.konexa_milestones set status=p_decision,reviewed_at=clock_timestamp(),
    completed_at=case when p_decision='approved' then clock_timestamp() else null end where id=m.id;
  result:=jsonb_build_object('id',m.id,'status',p_decision);
  perform private.konexa_append_audit(p_actor,'MILESTONE_REVIEWED','milestone',m.id::text,to_jsonb(m),result,p_idempotency_key);
  update public.konexa_milestone_submissions set review_decision=p_decision,
    review_feedback=btrim(p_feedback),reviewed_at=clock_timestamp() where id=s.id;
  -- Version-specific key: a second revision request must not be suppressed.
  perform private.konexa_enqueue_notification(m.student_id,'milestone_action',
    jsonb_build_object('milestoneId',m.id,'status',p_decision,'version',s.version),
    'delivery-reviewed:'||s.id::text);
  perform private.konexa_complete_command(p_actor,'review_delivery',p_idempotency_key,result);
  return result;
end $$;
revoke all on function public.konexa_review_delivery_v3(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.konexa_review_delivery_v3(uuid,uuid,text,text,text) to service_role;

create or replace function public.konexa_confirm_completion_v3(p_actor uuid,p_contract_id uuid,p_idempotency_key text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.konexa_contracts%rowtype; prior jsonb; result jsonb; evidence jsonb; recipient uuid;
begin
  prior:=private.konexa_reserve_command(p_actor,'confirm_completion',p_idempotency_key,jsonb_build_object('id',p_contract_id));
  if prior is not null then return prior; end if;
  select * into c from public.konexa_contracts where id=p_contract_id for update;
  if c.id is null then raise exception 'contract_not_found'; end if;
  if p_actor not in (c.company_id,c.student_id) then raise exception 'completion_forbidden'; end if;
  if c.status='completed' then
    result:=jsonb_build_object('id',c.id,'status','completed');
    perform private.konexa_complete_command(p_actor,'confirm_completion',p_idempotency_key,result);
    return result;
  end if;
  if c.status not in ('active','funded') then raise exception 'contract_not_ready'; end if;
  if not exists(select 1 from public.konexa_payment_orders where contract_id=c.id
    and status in ('funds_secured','paid') and amount_krw>=c.monthly_amount_krw) then raise exception 'verified_funding_required'; end if;
  if exists(select 1 from public.konexa_disputes where relationship_id=c.relationship_id and status not in ('resolved','closed')) then raise exception 'dispute_resolution_required'; end if;
  if not exists(select 1 from public.konexa_milestones where contract_id=c.id and status<>'cancelled')
    or exists(select 1 from public.konexa_milestones where contract_id=c.id and status not in ('approved','payout_ready','paid','cancelled'))
    then raise exception 'all_deliverables_approval_required'; end if;
  if exists(select 1 from public.konexa_milestones m where m.contract_id=c.id and m.status<>'cancelled'
    and not exists(select 1 from public.konexa_milestone_submissions s where s.milestone_id=m.id))
    then raise exception 'delivery_evidence_required'; end if;
  update public.konexa_contracts set
    company_completed_at=case when p_actor=c.company_id then coalesce(company_completed_at,clock_timestamp()) else company_completed_at end,
    student_completed_at=case when p_actor=c.student_id then coalesce(student_completed_at,clock_timestamp()) else student_completed_at end
    where id=c.id returning * into c;
  if c.company_completed_at is not null and c.student_completed_at is not null then
    update public.konexa_contracts set status='completed',completed_at=clock_timestamp() where id=c.id;
    if not exists(select 1 from public.konexa_contracts where relationship_id=c.relationship_id and id<>c.id and status not in ('completed','cancelled')) then
      update public.konexa_relationships set status='completed' where id=c.relationship_id;
    end if;
    select jsonb_build_object('title',c.title,'contractId',c.id,'projectId',c.project_id,
      'completedAt',clock_timestamp(),'milestones',jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'completedAt',m.completed_at)))
      into evidence from public.konexa_milestones m where m.contract_id=c.id and m.status<>'cancelled';
    insert into public.konexa_work_passport_entries(student_id,relationship_id,contract_id,evidence_type,evidence,source_hash)
      values(c.student_id,c.relationship_id,c.id,'project_completed',evidence,
        encode(extensions.digest('completed-contract:'||c.id::text,'sha256'),'hex')) on conflict(student_id,source_hash) do nothing;
    if c.project_id is not null and not exists(select 1 from public.konexa_contracts where project_id=c.project_id and status not in ('completed','cancelled')) then
      update public.konexa_projects set status='completed',closed_at=clock_timestamp() where id=c.project_id;
      update public.app_records set data=data||'{"status":"completed"}'::jsonb where collection_name='projects' and record_id=c.project_id::text;
    end if;
    result:=jsonb_build_object('id',c.id,'status','completed');
  else result:=jsonb_build_object('id',c.id,'status','awaiting_other_party'); end if;
  perform private.konexa_append_audit(p_actor,'COMPLETION_CONFIRMED','contract',c.id::text,null,result,p_idempotency_key);
  foreach recipient in array array[c.company_id,c.student_id] loop
    perform private.konexa_enqueue_notification(recipient,'contract_action',result||jsonb_build_object('contractId',c.id),
      'completion:'||c.id::text||':'||p_actor::text||':'||recipient::text);
  end loop;
  perform private.konexa_complete_command(p_actor,'confirm_completion',p_idempotency_key,result);
  return result;
end $$;
revoke all on function public.konexa_confirm_completion_v3(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.konexa_confirm_completion_v3(uuid,uuid,text) to service_role;

create or replace function private.konexa_guard_final_review()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.contract_id is not null then
    if not exists(select 1 from public.konexa_contracts where id=new.contract_id and status='completed') then
      raise exception 'project_completion_required'; end if;
  elsif not exists(select 1 from public.konexa_relationships where id=new.relationship_id and status='completed') then
    raise exception 'project_completion_required';
  end if;
  return new;
end $$;
revoke all on function private.konexa_guard_final_review() from public,anon,authenticated;
create trigger konexa_guard_final_review before insert on public.konexa_reviews for each row execute function private.konexa_guard_final_review();
