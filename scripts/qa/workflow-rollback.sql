-- Reusable database integration suite. ALWAYS run as one transaction.
-- No committed users, jobs, signatures, money movements or email sends.
begin;
set local statement_timeout = '30s';
select set_config('request.jwt.claims','{"role":"service_role"}',true);
create temporary table qa_results (name text primary key, passed boolean not null) on commit drop;
create function pg_temp.qa_assert(name text, value boolean) returns void language plpgsql as $$
begin
  if value is distinct from true then raise exception 'QA failed: %',name; end if;
  insert into qa_results values(name,true);
end $$;
create function pg_temp.qa_denied(name text, command text, expected text) returns void language plpgsql as $$
declare caught boolean := false;
begin
  begin execute command;
  exception when others then
    if sqlerrm !~ expected then raise; end if;
    caught := true;
  end;
  perform pg_temp.qa_assert(name,caught);
end $$;

do $$
<<qa>>
declare
  company uuid := gen_random_uuid(); other_company uuid := gen_random_uuid();
  student uuid := gen_random_uuid(); other_student uuid := gen_random_uuid(); admin_id uuid := gen_random_uuid();
  project_id uuid; other_project uuid; application_id uuid; relationship_id uuid; other_relationship uuid;
  contract_id uuid; other_contract uuid; milestone_id uuid; review_id uuid; other_review uuid; result jsonb;
  payload jsonb := '{"title":"[QA] rollback research project","description":"Synthetic integration test. Never committed or publicly published.","requirements":["Research"],"difficulty":"Easy","contactPolicyAccepted":true,"tags":[]}'::jsonb;
  row_id uuid; claimed integer;
begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values
    (company,company||'@example.invalid','{"role":"company","display_name":"[QA] Company","company_profile":{"subscriptionDiscountPercent":100,"verified":true}}','{"provider":"email"}'),
    (other_company,other_company||'@example.invalid','{"role":"company","display_name":"[QA] Other company"}','{"provider":"email"}'),
    (student,student||'@example.invalid','{"role":"student","display_name":"[QA] Student","student_profile":{"verified":true,"identityVerified":true,"trustScore":99,"earlyPioneerEligible":true,"aiEmployabilityScore":99}}','{"provider":"email"}'),
    (other_student,other_student||'@example.invalid','{"role":"student","display_name":"[QA] Other student"}','{"provider":"email"}'),
    (admin_id,admin_id||'@example.invalid','{"role":"student","display_name":"[QA] Test operator"}','{"provider":"email"}');
  perform pg_temp.qa_assert('signup_score_zero_and_not_verified',exists(select 1 from public.app_records where collection_name='student_profiles' and record_id=student::text and data->>'trustScore'='0' and coalesce(data->>'verified','false')='false' and coalesce(data->>'identityVerified','false')='false'));
  perform pg_temp.qa_assert('signup_cannot_grant_entitlements_or_ai_scores',not exists(select 1 from public.app_records where record_id in (student::text,company::text) and (data ? 'subscriptionDiscountPercent' or data ? 'earlyPioneerEligible' or data ? 'aiEmployabilityScore')));
  perform pg_temp.qa_assert('analysis_writer_is_service_only',not has_function_privilege('authenticated','public.konexa_save_profile_analysis(uuid,text,jsonb)','EXECUTE') and not has_function_privilege('anon','public.konexa_save_profile_analysis(uuid,text,jsonb)','EXECUTE') and has_function_privilege('service_role','public.konexa_save_profile_analysis(uuid,text,jsonb)','EXECUTE'));
  perform public.konexa_save_profile_analysis(student,'student_profiles','{"aiEmployabilityScore":12,"aiAnalysisStatus":"completed","bio":"must not overwrite"}');
  perform pg_temp.qa_assert('analysis_merge_preserves_other_fields',exists(select 1 from public.app_records where collection_name='student_profiles' and record_id=student::text and data->>'aiEmployabilityScore'='12' and not (data ? 'bio') and data->>'name'='[QA] Student'));
  perform set_config('request.jwt.claims',jsonb_build_object('sub',student,'role','authenticated')::text,true);
  set local role authenticated;
  update public.app_records set data=data||'{"trustScore":99,"aiEmployabilityScore":99,"earlyPioneerEligible":true,"uid":"forged","bio":"Allowed bio edit"}',is_public=true where collection_name='student_profiles' and record_id=student::text;
  reset role;
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  perform pg_temp.qa_assert('browser_cannot_forge_facts_but_can_edit_bio',exists(select 1 from public.app_records where collection_name='student_profiles' and record_id=student::text and data->>'trustScore'='0' and data->>'aiEmployabilityScore'='12' and not (data ? 'earlyPioneerEligible') and data->>'uid'=student::text and data->>'bio'='Allowed bio edit' and not is_public));
  perform pg_temp.qa_denied('unverified_company_cannot_publish',format('select public.konexa_create_project_v2(%L,%L::jsonb,%L)',company,payload,'qa-denied'),'verified_company_required');
  update public.app_records set data=data||'{"verified":true,"verifiedStatus":"Verified"}' where collection_name='company_profiles' and record_id in (company::text,other_company::text);
  result := public.konexa_create_project_v2(company,payload,'qa-project'); project_id := (result->>'id')::uuid;
  perform pg_temp.qa_assert('company_project_relational_and_legacy',exists(select 1 from public.konexa_projects where id=project_id and status='open') and exists(select 1 from public.app_records where collection_name='projects' and record_id=project_id::text));
  perform pg_temp.qa_assert('project_retry_idempotent',public.konexa_create_project_v2(company,payload,'qa-project')=result);
  perform pg_temp.qa_denied('different_payload_same_key_rejected',format('select public.konexa_create_project_v2(%L,%L::jsonb,%L)',company,payload||'{"title":"[QA] changed title"}','qa-project'),'idempotency_key_reused');
  perform pg_temp.qa_denied('incomplete_student_cannot_apply',format('select public.konexa_apply_to_project_v2(%L,%L,%L::jsonb,%L)',student,project_id,'{}','qa-incomplete'),'completed_student_profile_required');
  -- Storage metadata fixtures only; no real uploaded documents. Rolled back.
  insert into storage.objects(bucket_id,name,owner,owner_id) values ('identity-documents',student||'/qa-not-real-document',student,student::text),('resumes',student||'/qa-not-real-resume',student,student::text);
  update public.app_records set data=data||jsonb_build_object('onboardingCompleted',true,'name','[QA] Student','nationality','Vietnam','currentCountry','Vietnam','timezone','Asia/Ho_Chi_Minh','university','[QA] Not a real university','degree','Test','major','Research','graduationYear','2027','englishLevel','B2','skills',jsonb_build_array('Research'),'portfolio','https://example.invalid/qa','preferredJob','Market research','availability','10 hours per week','preferredWeeklyPayKrw',100000,'bio','[QA] Synthetic fixture, not a real applicant','identityDocumentPath',student||'/qa-not-real-document','resumeUrl',student||'/qa-not-real-resume') where collection_name='student_profiles' and record_id=student::text;
  result := public.konexa_apply_to_project_v2(student,project_id,'{"submission":"[QA] Research outline"}','qa-apply'); application_id := (result->>'id')::uuid;
  perform pg_temp.qa_assert('student_application_saved',exists(select 1 from public.konexa_applications where id=application_id and student_id=student));
  perform public.konexa_apply_to_project_v2(student,project_id,'{}','qa-apply-again');
  perform pg_temp.qa_assert('duplicate_application_not_created',(select count(*)=1 from public.konexa_applications a where a.project_id=qa.project_id and a.student_id=student));
  perform pg_temp.qa_denied('unrelated_company_review_denied',format('select public.konexa_review_application_v2(%L,%L,%L,%L,80,%L)',other_company,application_id,'approved','[QA] denied','qa-other-review'),'application_review_forbidden');
  perform public.konexa_review_application_v2(company,application_id,'approved','[QA] Owner review',80,'qa-review');
  perform pg_temp.qa_assert('company_review_synced',exists(select 1 from public.app_records where collection_name='applications' and record_id=application_id::text and data->>'status'='approved'));
  result := public.konexa_create_relationship_v2(company,student,project_id,'project',false,'qa-rel'); relationship_id := (result->>'id')::uuid;
  perform pg_temp.qa_assert('introduction_has_in_app_and_outbox',exists(select 1 from public.app_records where collection_name='notifications' and owner_id=student and data->>'entityId'=relationship_id::text) and exists(select 1 from public.konexa_notification_outbox where recipient_id=student and template='introduction_requested'));
  result := public.konexa_create_contract_v2(company,relationship_id,'{"title":"[QA] Unsigned contract","monthlyAmountKrw":400000,"scope":{}}','qa-contract'); contract_id := (result->>'id')::uuid;
  perform pg_temp.qa_denied('unsigned_contract_cannot_start_work',format('select public.konexa_create_milestone_v2(%L,%L,%L::jsonb,%L)',company,contract_id,'{"title":"QA milestone","deliverable":"Synthetic research result","amountKrw":100000,"dueAt":"2099-01-01T00:00:00Z"}','qa-unsigned'),'contract_not_ready_for_milestones');
  -- Isolated state fixture only: never a real signature or financial action.
  update public.konexa_contracts set status='active' where id=contract_id;
  result := public.konexa_create_milestone_v2(company,contract_id,'{"title":"QA milestone","deliverable":"Synthetic research result","amountKrw":100000,"dueAt":"2099-01-01T00:00:00Z"}','qa-milestone'); milestone_id := (result->>'id')::uuid;
  perform pg_temp.qa_denied('unrelated_student_submission_denied',format('select public.konexa_submit_milestone_v2(%L,%L,%L,ARRAY[]::text[],%L)',other_student,milestone_id,'[QA] denied','qa-other-submit'),'milestone_submission_forbidden');
  result := public.konexa_submit_milestone_v2(student,milestone_id,'[QA] First deliverable',array[]::text[],'qa-submit1');
  perform pg_temp.qa_assert('milestone_submission_version_1',result->>'version'='1');
  perform public.konexa_review_milestone_v2(company,milestone_id,'rejected','qa-request-revision');
  result := public.konexa_submit_milestone_v2(student,milestone_id,'[QA] Revised deliverable',array[]::text[],'qa-submit2');
  perform pg_temp.qa_assert('milestone_revision_version_2',result->>'version'='2');
  perform public.konexa_review_milestone_v2(company,milestone_id,'approved','qa-approve');
  perform pg_temp.qa_assert('milestone_approved',exists(select 1 from public.konexa_milestones where id=milestone_id and status='approved'));
  perform pg_temp.qa_denied('unpaid_relationship_review_denied',format('select public.konexa_create_review_v2(%L,%L,%L,5,5,5,5,5,%L,%L)',student,relationship_id,contract_id,'[QA] Review content for database validation only','qa-no-pay-review'),'verified_payment_required');
  insert into public.konexa_payment_orders(relationship_id,contract_id,payer_company_id,payee_student_id,provider,idempotency_key,amount_krw,status) values(relationship_id,contract_id,company,student,'qa_rollback_only','qa-paid-fixture',400000,'paid');
  result := public.konexa_create_review_v2(student,relationship_id,contract_id,5,5,5,5,5,'[QA] Review content for database validation only','qa-student-review');review_id:=(result->>'id')::uuid;
  result := public.konexa_create_review_v2(company,relationship_id,contract_id,5,5,5,5,5,'[QA] Company review for database validation only','qa-company-review');other_review:=(result->>'id')::uuid;
  perform pg_temp.qa_assert('reviews_sealed_before_moderation',(select bool_and(r.status='sealed') from public.konexa_reviews r where r.relationship_id=qa.relationship_id));
  perform set_config('request.jwt.claims',jsonb_build_object('role','service_role','sub',admin_id)::text,true);
  perform set_config('konexa.allow_role_change',admin_id::text,true);
  update public.app_records set data=data||'{"role":"admin"}' where collection_name='users' and record_id=admin_id::text;
  perform public.konexa_moderate_review_v2(admin_id,review_id,'approved','qa-moderate1');
  perform pg_temp.qa_assert('one_approved_review_remains_sealed',exists(select 1 from public.konexa_reviews where id=review_id and status='sealed'));
  result:=public.konexa_moderate_review_v2(admin_id,other_review,'approved','qa-moderate2');
  perform pg_temp.qa_assert('mutual_reviews_publish_and_response_agrees',result->>'status'='published' and (select bool_and(status='published') from public.konexa_reviews where id in(review_id,other_review)));
  result:=public.konexa_create_project_v2(other_company,payload,'qa-other-project');other_project:=(result->>'id')::uuid;
  result:=public.konexa_create_relationship_v2(other_company,other_student,other_project,'project',false,'qa-other-rel');other_relationship:=(result->>'id')::uuid;
  result:=public.konexa_create_contract_v2(other_company,other_relationship,'{"title":"[QA] Other unsigned contract","monthlyAmountKrw":400000,"scope":{}}','qa-other-contract');other_contract:=(result->>'id')::uuid;
  perform pg_temp.qa_denied('dispute_cannot_mutate_unrelated_contract',format('select public.konexa_create_dispute_v2(%L,%L,%L,null,%L,%L,%L)',student,relationship_id,other_contract,'scope','[QA] A synthetic cross-relationship dispute attempt','qa-cross-dispute'),'contract_relationship_mismatch');
  result:=public.konexa_create_dispute_v2(student,relationship_id,contract_id,milestone_id,'scope','[QA] A synthetic dispute for the correct relationship','qa-dispute');
  perform pg_temp.qa_assert('dispute_saved_with_two_outbox_notifications',(select count(*)=2 from public.konexa_notification_outbox o where o.template='dispute_action' and o.payload->>'disputeId'=result->>'id'));
  update public.app_records set data=data||'{"notificationPreferences":{"email":false}}' where collection_name='student_profiles' and record_id=student::text;
  perform private.konexa_enqueue_notification(student,'milestone_action','{"status":"test"}','qa-opt-out');
  perform pg_temp.qa_assert('email_opt_out_is_suppressed',exists(select 1 from public.konexa_notification_outbox where idempotency_key='qa-opt-out' and status='suppressed'));
  perform private.konexa_enqueue_notification(student,'milestone_action','{"status":"test"}','qa-opt-out');
  perform pg_temp.qa_assert('notifications_are_deduplicated',(select count(*)=1 from public.konexa_notification_outbox where idempotency_key='qa-opt-out'));
  select count(*) into claimed from public.konexa_claim_notification_outbox_v2('qa-worker',1);
  perform pg_temp.qa_assert('outbox_claims_bounded_batch',claimed=1);
  select id into row_id from public.konexa_notification_outbox where locked_by='qa-worker';
  perform public.konexa_complete_notification_outbox_v2(row_id,'wrong-worker',true,'qa-provider',null);
  perform pg_temp.qa_assert('wrong_worker_cannot_complete',exists(select 1 from public.konexa_notification_outbox where id=row_id and status='processing'));
  perform public.konexa_complete_notification_outbox_v2(row_id,'qa-worker',false,null,'QA temporary failure');
  perform pg_temp.qa_assert('failed_delivery_gets_backoff',exists(select 1 from public.konexa_notification_outbox where id=row_id and status='failed' and next_attempt_at>clock_timestamp()));
end $$;
do $$
declare student uuid := gen_random_uuid(); assessment uuid := gen_random_uuid();
begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values
    (student,student||'@example.invalid','{"role":"student","display_name":"[QA] Matching rollback"}','{"provider":"email"}');
  insert into storage.objects(bucket_id,name,owner,owner_id) values ('identity-documents',student||'/qa-document',student,student::text),('resumes',student||'/qa-resume',student,student::text);
  update public.app_records set data=data||jsonb_build_object('onboardingCompleted',true,'privacySettings','{"publicProfile":true}'::jsonb,'name','[QA] Matching rollback','nationality','Vietnam','currentCountry','Vietnam','timezone','Asia/Ho_Chi_Minh','university','[QA] Fixture','degree','Test','major','Research','graduationYear','2027','englishLevel','B2','preferredJob','Market research','availability','Immediately','bio','[QA] Rollback only','identityDocumentPath',student||'/qa-document','resumeUrl',student||'/qa-resume','skills','["Research"]'::jsonb,'preferredWeeklyPayKrw',100000,'availableHoursPerWeek',12) where collection_name='student_profiles' and record_id=student::text;
  perform pg_temp.qa_assert('matching_uses_private_directory_cards',exists(select 1 from public.app_records where collection_name='talent_cards' and record_id=student::text and not is_public)
    and exists(select 1 from public.konexa_matching_candidate_page('',250) where record_id=student::text and data->>'availableHoursPerWeek'='12'));
  perform pg_temp.qa_assert('matching_lookup_is_service_only',not has_function_privilege('anon','public.konexa_matching_candidate_page(text,integer)','execute') and not has_function_privilege('authenticated','public.konexa_matching_candidate_page(text,integer)','execute'));
  update public.app_records set data=data||'{"accountStatus":"Suspended"}' where collection_name='users' and record_id=student::text;
  perform pg_temp.qa_assert('suspended_candidate_excluded',not exists(select 1 from public.konexa_matching_candidate_page('',250) where record_id=student::text));
  update public.app_records set data=data||'{"accountStatus":"Active"}' where collection_name='users' and record_id=student::text;
  update public.app_records set data=data||'{"privacySettings":{"publicProfile":false}}' where collection_name='student_profiles' and record_id=student::text;
  perform pg_temp.qa_assert('withdrawn_candidate_excluded',not exists(select 1 from public.konexa_matching_candidate_page('',250) where record_id=student::text));
  perform set_config('request.jwt.claims',jsonb_build_object('sub',student,'role','authenticated')::text,true);
  set local role authenticated;
  update public.app_records set data=data||'{"careerVision":"Saved research goal","availableHoursPerWeek":14}' where collection_name='student_profiles' and record_id=student::text;
  reset role;
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  perform pg_temp.qa_assert('career_goal_real_owner_write',exists(select 1 from public.app_records where collection_name='student_profiles' and record_id=student::text and data->>'careerVision'='Saved research goal' and data->>'availableHoursPerWeek'='14'));
  insert into public.konexa_ai_assessments(id,requested_by,entity_type,entity_id,assessment_type,model,prompt_version,input_hash,result,status)
    values(assessment,student,'roadmap',student::text,'student_career_roadmap','pending','qa','qa','{}','pending');
  update public.konexa_ai_assessments set status='completed',model='qa-not-a-real-provider',result='{"summary":"Rollback fixture"}' where id=assessment;
  perform pg_temp.qa_assert('assessment_attempt_complete_persistence',exists(select 1 from public.konexa_ai_assessments where id=assessment and status='completed' and result->>'summary'='Rollback fixture'));
  perform pg_temp.qa_assert('automation_health_service_only',not has_function_privilege('authenticated','public.konexa_automation_health()','execute') and public.konexa_automation_health() ? 'delayedNotifications');
end $$;
select name,passed from qa_results order by name;
rollback;
