-- Actual Postgres functions and service-role ACLs; synthetic data rolled back.
begin;
set local statement_timeout='30s';
create temporary table qa_coordination_results(name text primary key,passed boolean not null) on commit drop;
grant all on qa_coordination_results to service_role,authenticated;
create function pg_temp.co_assert(n text,v boolean) returns void language plpgsql as $$
begin if v is distinct from true then raise exception 'QA failed: %',n; end if; insert into qa_coordination_results values(n,true); end $$;
create function pg_temp.co_denied(n text,cmd text,expected text) returns void language plpgsql as $$
declare caught boolean:=false;
begin begin execute cmd; exception when others then if sqlerrm !~ expected then raise; end if; caught:=true; end;
perform pg_temp.co_assert(n,caught); end $$;
do $$
declare c uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); o uuid:=gen_random_uuid(); a uuid:=gen_random_uuid();
  rel uuid:=gen_random_uuid(); contract uuid:=gen_random_uuid(); m jsonb; ch jsonb; support jsonb; payload jsonb; result jsonb;
  slot timestamptz:=date_trunc('minute',clock_timestamp()+interval '2 hours'); before_count integer; response_count integer;
begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values
    (c,c||'@example.invalid','{"role":"company","display_name":"QA coordination company"}','{"provider":"email"}'),
    (s,s||'@example.invalid','{"role":"student","display_name":"QA coordination student"}','{"provider":"email"}'),
    (o,o||'@example.invalid','{"role":"student","display_name":"QA coordination outsider"}','{"provider":"email"}'),
    (a,a||'@example.invalid','{"role":"student","display_name":"QA coordination administrator"}','{"provider":"email"}');
  perform set_config('request.jwt.claims',jsonb_build_object('role','service_role','sub',a)::text,true);
  perform set_config('konexa.allow_role_change',a::text,true);
  update public.app_records set data=data||'{"role":"admin","accountStatus":"Active"}' where collection_name='users' and record_id=a::text;
  insert into public.konexa_relationships(id,company_id,student_id,purpose,status,conversion_window_ends_at) values(rel,c,s,'project','active',now()+interval '12 months');
  insert into public.konexa_contracts(id,relationship_id,company_id,student_id,title,contract_type,document_version,scope,monthly_amount_krw,status)
    values(contract,rel,c,s,'QA immutable agreement','company_project','qa-rollback','{"deliverables":"Research report","reviewDays":5}',100000,'active');
  perform pg_temp.co_assert('new_commands_service_only',not has_function_privilege('authenticated','public.konexa_create_coordination_v4(uuid,text,jsonb)','execute')
    and not has_function_privilege('anon','public.konexa_update_coordination_v4(uuid,text,uuid,jsonb)','execute'));
  set local role service_role;
  payload:=jsonb_build_object('kind','meeting','relationshipId',rel,'title','Research interview','details',jsonb_build_object('slots',jsonb_build_array(slot),'durationMinutes',30,'timeZone','Asia/Seoul','note','Discuss the project scope'));
  m:=public.konexa_create_coordination_v4(c,'qa-meeting',payload);
  perform pg_temp.co_assert('meeting_created_as_real_service_role',m->>'status'='proposed');
  perform pg_temp.co_assert('create_retry_returns_same_record',public.konexa_create_coordination_v4(c,'qa-meeting',payload)->>'id'=m->>'id');
  perform pg_temp.co_denied('unrelated_create_denied',format('select public.konexa_create_coordination_v4(%L,%L,%L)',o,'outsider',payload),'forbidden');
  perform pg_temp.co_denied('meeting_self_confirmation_denied',format('select public.konexa_update_coordination_v4(%L,%L,%L,%L)',c,'self-confirm',m->>'id',jsonb_build_object('action','confirm','version',1,'slot',slot)),'invalid_transition');
  perform pg_temp.co_denied('meeting_outsider_update_hidden',format('select public.konexa_update_coordination_v4(%L,%L,%L,%L)',o,'outside-update',m->>'id','{"action":"cancel","version":1,"note":"Cancel please"}'),'not_found');
  perform pg_temp.co_denied('contact_link_before_release_denied',format('select public.konexa_create_coordination_v4(%L,%L,%L)',c,'locked-url',jsonb_set(payload,'{details,meetingUrl}','"https://example.invalid/meeting"')),'contact_locked');
  result:=public.konexa_update_coordination_v4(s,'accept', (m->>'id')::uuid,jsonb_build_object('action','confirm','version',1,'slot',slot));
  perform pg_temp.co_assert('opposite_party_acceptance',result->>'status'='confirmed' and (result->>'version')::int=2);
  perform pg_temp.co_assert('action_retry_is_idempotent',public.konexa_update_coordination_v4(s,'accept',(m->>'id')::uuid,jsonb_build_object('action','confirm','version',1,'slot',slot))=result);
  perform pg_temp.co_denied('stale_updates_rejected',format('select public.konexa_update_coordination_v4(%L,%L,%L,%L)',c,'stale',m->>'id','{"action":"cancel","version":1,"note":"Cancel please"}'),'stale_version');
  perform pg_temp.co_denied('future_meeting_not_completed',format('select public.konexa_update_coordination_v4(%L,%L,%L,%L)',c,'early-done',m->>'id','{"action":"complete","version":2}'),'invalid_transition');
  result:=public.konexa_create_coordination_v4(c,'conflicting-proposal',payload);
  perform pg_temp.co_denied('confirmed_overlap_rejected',format('select public.konexa_update_coordination_v4(%L,%L,%L,%L)',s,'overlap',result->>'id',jsonb_build_object('action','confirm','version',1,'slot',slot)),'meeting_conflict');
  result:=public.konexa_create_coordination_v4(c,'reschedule',jsonb_set(jsonb_set(payload,'{details,supersedesId}',m->'id'),'{details,slots}',jsonb_build_array(slot+interval '2 hours')));
  perform pg_temp.co_assert('reschedule_preserves_original_until_accepted',(select status='confirmed' from public.konexa_coordination_items where id=(m->>'id')::uuid));
  result:=public.konexa_update_coordination_v4(s,'accept-reschedule',(result->>'id')::uuid,jsonb_build_object('action','confirm','version',1,'slot',slot+interval '2 hours'));
  perform pg_temp.co_assert('reschedule_atomically_supersedes_original',(select status='rescheduled' from public.konexa_coordination_items where id=(m->>'id')::uuid) and result->>'status'='confirmed');
  payload:=jsonb_build_object('kind','change','relationshipId',rel,'contractId',contract,'title','Additional research scope','details',jsonb_build_object('reason','Company requires another market segment','deliverables','A new market research summary','schedule','Next week Friday','additionalAmountKrw',20000));
  ch:=public.konexa_create_coordination_v4(c,'change',payload);
  perform pg_temp.co_assert('original_scope_snapshotted',ch->'details'->'beforeScope'->>'deliverables'='Research report');
  perform pg_temp.co_denied('change_requires_explicit_acknowledgement',format('select public.konexa_update_coordination_v4(%L,%L,%L,%L)',s,'no-ack',ch->>'id','{"action":"agree","version":1}'),'acknowledgement_required');
  perform pg_temp.co_denied('admin_cannot_consent_for_participant',format('select public.konexa_update_coordination_v4(%L,%L,%L,%L)',a,'admin-ack',ch->>'id','{"action":"agree","version":1,"acknowledged":true}'),'participant_action_required');
  result:=public.konexa_update_coordination_v4(s,'agree',(ch->>'id')::uuid,'{"action":"agree","version":1,"acknowledged":true}');
  perform pg_temp.co_assert('change_agreed_without_forged_contract',result->>'status'='agreed' and (select monthly_amount_krw=100000 and scope->>'deliverables'='Research report' from public.konexa_contracts where id=contract));
  perform pg_temp.co_assert('no_signature_forged',not exists(select 1 from public.konexa_contract_signatures where contract_id=contract));
  payload:=jsonb_build_object('kind','support','relationshipId',rel,'contractId',contract,'title','Replacement support request','details',jsonb_build_object('caseType','replacement','reason','Please review the recorded missed handover and propose a replacement.'));
  support:=public.konexa_create_coordination_v4(s,'support',payload);
  perform pg_temp.co_assert('case_real_record',support->>'status'='open' and support->'details'->>'eligibility'='manual_review_required');
  perform pg_temp.co_denied('participant_cannot_resolve_own_case',format('select public.konexa_update_coordination_v4(%L,%L,%L,%L)',s,'self-resolve',support->>'id','{"action":"resolved","version":1,"note":"A detailed resolution that is not authorized"}'),'forbidden');
  perform pg_temp.co_denied('fake_replacement_not_accepted',format('select public.konexa_update_coordination_v4(%L,%L,%L,%L)',a,'fake-replacement',support->>'id',jsonb_build_object('action','proposal_sent','version',1,'note','A detailed replacement proposal with no valid introduction','replacementRelationshipId',gen_random_uuid())),'invalid_replacement');
  result:=public.konexa_update_coordination_v4(a,'review-case',(support->>'id')::uuid,'{"action":"in_review","version":1,"note":"The operations team is reviewing documented facts and eligibility."}');
  result:=public.konexa_update_coordination_v4(a,'resolve-case',(support->>'id')::uuid,'{"action":"resolved","version":2,"note":"Both parties accepted the documented resolution after operations review."}');
  perform pg_temp.co_assert('admin_case_resolution_with_evidence',result->>'status'='resolved' and result->'details'->>'assignedAdminId'=a::text);
  perform pg_temp.co_assert('history_has_every_version',(select count(*)=3 from public.konexa_coordination_events where item_id=(support->>'id')::uuid));
  perform pg_temp.co_assert('notifications_are_durable',exists(select 1 from public.konexa_notification_outbox where recipient_id=a and template='coordination_action') and exists(select 1 from public.app_records where collection_name='notifications' and owner_id=c));
  perform public.konexa_queue_coordination_reminders_v4();
  select count(*) into before_count from public.konexa_notification_outbox where recipient_id in (c,s) and idempotency_key like 'coordination-reminder:%';
  perform public.konexa_queue_coordination_reminders_v4();
  perform pg_temp.co_assert('reminders_deduplicated',before_count>0 and before_count=(select count(*) from public.konexa_notification_outbox where recipient_id in (c,s) and idempotency_key like 'coordination-reminder:%'));
  reset role;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',o,'role','authenticated')::text,true);
  set local role authenticated;
  select count(*) into response_count from public.konexa_coordination_items where relationship_id=rel;
  perform pg_temp.co_assert('outsider_rls_hides_items',response_count=0);
  perform pg_temp.co_assert('outsider_rls_hides_events',not exists(select 1 from public.konexa_coordination_events where item_id=(support->>'id')::uuid));
  reset role;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',s,'role','authenticated')::text,true);
  set local role authenticated;
  perform pg_temp.co_assert('participant_rls_allows_own_history',exists(select 1 from public.konexa_coordination_events where item_id=(support->>'id')::uuid));
  reset role;
end $$;
select name,passed from qa_coordination_results order by name;
rollback;
