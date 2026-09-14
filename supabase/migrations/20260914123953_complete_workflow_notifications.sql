-- Durable in-app notifications for relational workflows; the four legacy
-- project/application events already have transactional compatibility triggers.
alter table public.konexa_notification_outbox drop constraint if exists konexa_notification_outbox_status_check;
alter table public.konexa_notification_outbox add constraint konexa_notification_outbox_status_check
check (status in ('pending','processing','sent','failed','dead_letter','suppressed'));

create or replace function private.konexa_enqueue_notification(
  p_recipient uuid, p_template text, p_payload jsonb, p_idempotency_key text
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  notification_id text := 'v2_' || md5(p_recipient::text || ':' || p_idempotency_key);
  kind_value text;
  title_value text;
  entity_id text := coalesce(p_payload->>'milestoneId',p_payload->>'contractId',p_payload->>'reviewId',p_payload->>'disputeId',p_payload->>'relationshipId','');
  email_disabled boolean;
begin
  if p_template not in ('project_published','application_received','new_application','application_status') then
    kind_value := case
      when p_template in ('contract_action','introduction_requested') then 'contract'
      when p_template='payment_status' then 'payment'
      when p_template='review_updated' then 'review'
      else 'system' end;
    title_value := case p_template
      when 'introduction_requested' then '새 소개 요청이 도착했습니다'
      when 'contract_action' then '계약 상태가 변경되었습니다'
      when 'milestone_action' then '마일스톤 상태가 변경되었습니다'
      when 'review_updated' then '거래 리뷰 상태가 변경되었습니다'
      when 'dispute_action' then '분쟁 접수 상태가 변경되었습니다'
      when 'payment_status' then '결제 상태가 변경되었습니다'
      else 'KONEXA 활동 알림' end;
    insert into public.app_records(collection_name,record_id,owner_id,data,is_public)
    values ('notifications',notification_id,p_recipient,jsonb_build_object(
      'id',notification_id,'recipientId',p_recipient::text,'kind',kind_value,
      'title',title_value,'message','프로젝트 운영 화면에서 최신 상태와 필요한 조치를 확인해 주세요.',
      'entityId',entity_id,'entityType',p_template,'actionTab','trust-operations',
      'createdAt',floor(extract(epoch from clock_timestamp())*1000),'readAt',null),false)
    on conflict(collection_name,record_id) do nothing;
  end if;
  select coalesce(bool_or(data->'notificationPreferences'->>'email'='false'),false)
  into email_disabled from public.app_records
  where owner_id=p_recipient and collection_name in ('student_profiles','company_profiles');
  insert into public.konexa_notification_outbox(recipient_id,template,payload,idempotency_key,status,last_error)
  values (p_recipient,left(p_template,100),coalesce(p_payload,'{}'),left(p_idempotency_key,240),
    case when email_disabled then 'suppressed' else 'pending' end,
    case when email_disabled then 'disabled_by_preferences' else null end)
  on conflict(idempotency_key) do nothing;
end;
$$;

-- Patch the established command functions without discarding their audit and
-- idempotency behavior. A missing anchor fails the migration rather than silently
-- applying a partial security change.
do $$
declare definition text; anchor text;
begin
  definition := pg_get_functiondef('private.konexa_protect_profile_facts()'::regprocedure);
  definition := replace(definition, '''earlyPioneerPriority'',', '''earlyPioneerPriority'',''earlyPioneerEligible'',''earlyPioneerQualifiedAt'',');
  execute definition;
  definition := pg_get_functiondef('public.konexa_create_dispute_v2(uuid,uuid,uuid,uuid,text,text,text)'::regprocedure);
  anchor := '  insert into public.konexa_disputes(';
  if position(anchor in definition)=0 then raise exception 'Dispute guard anchor missing'; end if;
  definition := replace(definition,anchor,$guard$
  if p_contract_id is not null and not exists (
    select 1 from public.konexa_contracts where id=p_contract_id and relationship_id=p_relationship_id
  ) then raise exception using message='contract_relationship_mismatch'; end if;
  if p_milestone_id is not null and not exists (
    select 1 from public.konexa_milestones where id=p_milestone_id and relationship_id=p_relationship_id
      and (p_contract_id is null or contract_id=p_contract_id)
  ) then raise exception using message='milestone_relationship_mismatch'; end if;
  insert into public.konexa_disputes($guard$);
  anchor := '  perform private.konexa_complete_command(p_actor, ''create_dispute'', p_idempotency_key, result);';
  definition := replace(definition,anchor,$notice$
  perform private.konexa_enqueue_notification(relationship_row.company_id,'dispute_action',result || jsonb_build_object('disputeId',dispute_id),'dispute-company:'||dispute_id::text);
  perform private.konexa_enqueue_notification(relationship_row.student_id,'dispute_action',result || jsonb_build_object('disputeId',dispute_id),'dispute-student:'||dispute_id::text);
  perform private.konexa_complete_command(p_actor, 'create_dispute', p_idempotency_key, result);$notice$);
  execute definition;

  definition := pg_get_functiondef('public.konexa_create_review_v2(uuid,uuid,uuid,integer,integer,integer,integer,integer,text,text)'::regprocedure);
  anchor := '  perform private.konexa_append_audit(';
  definition := replace(definition,anchor,$notice$
  perform private.konexa_enqueue_notification(p_actor,'review_updated',jsonb_build_object('reviewId',review_id,'status','submitted'),'review-submitted:'||review_id::text);
  perform private.konexa_append_audit($notice$);
  execute definition;

  definition := pg_get_functiondef('public.konexa_moderate_review_v2(uuid,uuid,text,text)'::regprocedure);
  anchor := '  result := jsonb_build_object(';
  definition := replace(definition,anchor,$notice$
  perform private.konexa_enqueue_notification(review_row.reviewer_id,'review_updated',jsonb_build_object('reviewId',p_review_id,'status',p_decision),'review-moderated:'||p_review_id::text||':'||p_decision);
  result := jsonb_build_object($notice$);
  definition := replace(definition,
    '''status'', case when p_decision = ''rejected'' then ''removed'' else ''sealed'' end',
    '''status'', (select status from public.konexa_reviews where id=p_review_id)');
  execute definition;
end;
$$;
