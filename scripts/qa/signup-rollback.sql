-- Run against the linked project after migrations. Synthetic identities only;
-- the outer transaction always rolls back. This is NOT a real Google OAuth test.
-- Critically, completion runs as the actual service_role, not as postgres with
-- a changed JWT claim (which previously concealed a production ACL failure).
begin;
set local statement_timeout = '30s';
do $$
declare
  u uuid;
  intent uuid;
  result_role text;
  selected_role text;
  profile_collection text;
  payload jsonb;
  account_data jsonb;
  profile_data jsonb;
  results jsonb := '[]';
  consents jsonb := '{"terms":true,"nonCircumvention":true,"messageAnalysis":true,"crossBorderPrivacy":true,"marketing":false,"documentVersion":"qa-rollback"}';
  consent_count integer;
  denied boolean;
begin
  if has_table_privilege('service_role', 'auth.users', 'SELECT') then
    raise exception 'Regression: service_role must not gain auth.users access';
  end if;
  if has_function_privilege('authenticated', 'public.konexa_complete_google_registration_v2(uuid,uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.konexa_complete_google_registration_v2(uuid,uuid)', 'EXECUTE') then
    raise exception 'Regression: caller-id wrapper must remain service-only';
  end if;
  results := results || jsonb_build_array('service_only_acl', 'auth_users_remains_private');

  foreach selected_role in array array['student', 'company'] loop
    reset role;
    u := gen_random_uuid();
    profile_collection := selected_role || '_profiles';
    insert into auth.users(id,email,aud,role,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
    values(u,u||'@example.invalid','authenticated','authenticated',now(),
      '{"provider":"google","providers":["google"]}',
      '{"full_name":"KONEXA transaction-only signup QA"}');
    insert into auth.identities(provider_id,user_id,identity_data,provider)
    values(u::text,u,jsonb_build_object('sub',u,'email',u||'@example.invalid'),'google');

    payload := jsonb_build_object('name','QA Student','companyName','QA Company',
      'onboardingCompleted',false,'verified',true,'verifiedStatus','Approved','trustScore',100);
    set local role service_role;
    intent := public.begin_google_registration(selected_role,consents,payload);
    result_role := public.konexa_complete_google_registration_v2(intent,u);
    if result_role is distinct from selected_role then raise exception 'Wrong signup role'; end if;
    reset role;
    select data into account_data from public.app_records where collection_name='users' and record_id=u::text;
    select data into profile_data from public.app_records where collection_name=profile_collection and record_id=u::text;
    if account_data->>'onboardingStatus' is distinct from 'complete' or account_data->>'role' is distinct from selected_role
      or profile_data is null or profile_data->>'onboardingCompleted' is distinct from 'false' then
      raise exception 'Signup or initial profile failed';
    end if;
    if profile_data->>'verified'='true' or profile_data->>'verifiedStatus'='Approved' then
      raise exception 'Signup must not auto-approve documents';
    end if;
    select count(*) into consent_count from public.app_records where collection_name='consents' and owner_id=u
      and data->>'stage'='signup' and data->>'role'=selected_role and data->>'marketing'='false';
    if consent_count<>1 then raise exception 'Missing or duplicate consent receipt'; end if;
    results := results || jsonb_build_array(selected_role||'_service_role_completion', selected_role||'_account_active_without_review',
      selected_role||'_profile_created', selected_role||'_verification_separate', selected_role||'_consent_saved');

    -- An ordinary member can save and reload an incomplete profile, even before
    -- supplying documents or receiving any administrative review.
    perform set_config('request.jwt.claim.sub',u::text,true);
    perform set_config('request.jwt.claim.role','authenticated',true);
    set local role authenticated;
    update public.app_records set data=data||'{"bio":"Saved partial draft","companyIntroduction":"Saved partial draft","onboardingCompleted":false}'
      where collection_name=profile_collection and record_id=u::text;
    select data into profile_data from public.app_records where collection_name=profile_collection and record_id=u::text;
    if profile_data->>'bio' is distinct from 'Saved partial draft' then raise exception 'Profile draft did not persist'; end if;
    if selected_role='student' then
      insert into public.app_records(collection_name,record_id,owner_id,data,is_public)
      values('protected_contacts',u::text,u,jsonb_build_object('userId',u,'talentId',u,'email',u||'@example.invalid'),false)
      on conflict(collection_name,record_id) do update set data=excluded.data;
      results := results || jsonb_build_array('student_private_contact_draft_saved');
    end if;
    reset role;
    results := results || jsonb_build_array(selected_role||'_unapproved_member_saves_draft');

    -- A fresh retry intent for an already-created account must not overwrite
    -- the draft or duplicate the signup consent.
    set local role service_role;
    intent := public.begin_google_registration(selected_role,consents,'{}');
    result_role := public.konexa_complete_google_registration_v2(intent,u);
    reset role;
    select data into profile_data from public.app_records where collection_name=profile_collection and record_id=u::text;
    select count(*) into consent_count from public.app_records where collection_name='consents' and owner_id=u and data->>'stage'='signup';
    if result_role is distinct from selected_role or profile_data->>'bio' is distinct from 'Saved partial draft' or consent_count<>1 then
      raise exception 'Signup retry changed saved account data';
    end if;
    results := results || jsonb_build_array(selected_role||'_retry_preserves_profile_and_consent');

    set local role service_role;
    denied := false;
    begin perform public.konexa_complete_google_registration_v2(intent,u);
    exception when others then denied := sqlerrm like '%expired or was already used%'; end;
    if not denied then raise exception 'Consumed intent accepted'; end if;
    denied := false;
    begin perform public.begin_google_registration(selected_role,'{}','{}');
    exception when others then denied := sqlerrm like '%agreements were not accepted%'; end;
    if not denied then raise exception 'Missing consents accepted'; end if;
    intent := public.begin_google_registration(case when selected_role='student' then 'company' else 'student' end,consents,'{}');
    denied := false;
    begin perform public.konexa_complete_google_registration_v2(intent,u);
    exception when others then denied := sqlerrm like '%KONEXA_ROLE_CONFLICT%'; end;
    if not denied then raise exception 'Role-switch bypass accepted'; end if;
    reset role;
    results := results || jsonb_build_array(selected_role||'_single_use_intent',selected_role||'_requires_consent',selected_role||'_role_conflict_rejected');

    -- Storage metadata exists only inside this rollback transaction. No public
    -- document or fabricated member remains after the test.
    insert into storage.objects(bucket_id,name,owner_id)
    select bucket,u::text||'/qa-proof.pdf',u::text from unnest(
      case when selected_role='student' then array['identity-documents','resumes'] else array['business-documents'] end
    ) bucket;
    payload := profile_data || jsonb_build_object(
      'uid',u,'onboardingCompleted',true,'name','QA Talent','nationality','Vietnam','currentCountry','Vietnam',
      'timezone','Asia/Ho_Chi_Minh','university','QA University','degree','Bachelor','major','Marketing',
      'graduationYear','2027','englishLevel','Advanced','preferredJob','Market Research','skills',jsonb_build_array('Research'),
      'availability','Immediately','preferredWeeklyPayKrw',100000,'bio','QA evidence for a rollback test',
      'identityDocumentPath',u::text||'/qa-proof.pdf','resumeUrl',u::text||'/qa-proof.pdf',
      'companyName','QA Company','businessRegistrationNumber','QA-NOT-A-REAL-BUSINESS','country','South Korea',
      'industry','Research','companySize','1-10','website','https://example.invalid','officeLocation','QA location',
      'contactPerson','QA Contact','position','Founder','corporateEmail','qa@example.invalid','phoneNumber','QA',
      'companyIntroduction','QA rollback company','requiredSkills',jsonb_build_array('Research'),
      'businessRegistrationDocumentPath',u::text||'/qa-proof.pdf');
    perform set_config('request.jwt.claim.sub',u::text,true);
    set local role authenticated;
    insert into public.app_records(collection_name,record_id,owner_id,data,is_public) values
      (profile_collection,u::text,u,payload,false),
      ('verification_requests',u::text||'-qa-review',u,jsonb_build_object('userId',u,'role',selected_role,'status','Pending',
        'verificationType',case when selected_role='student' then 'identity' else 'business_registration' end,
        'documentUrl',u::text||'/qa-proof.pdf'),false)
    on conflict(collection_name,record_id) do update set data=excluded.data;
    select data into profile_data from public.app_records where collection_name=profile_collection and record_id=u::text;
    if profile_data->>'onboardingCompleted' is distinct from 'true' or profile_data->>'verified'='true'
      or profile_data->>'verifiedStatus'='Approved' then raise exception 'Profile completion incorrectly depends on approval'; end if;
    reset role;
    if not exists(select 1 from public.app_records where collection_name='verification_requests' and owner_id=u and data->>'status'='Pending') then
      raise exception 'Independent review request missing';
    end if;
    results := results || jsonb_build_array(selected_role||'_complete_profile_before_admin_review',selected_role||'_review_queue_separate');

    update public.app_records set data=data||'{"accountStatus":"Suspended"}' where collection_name='users' and record_id=u::text;
    set local role service_role;
    denied := false;
    begin perform public.konexa_complete_google_registration_v2(intent,u);
    exception when others then denied := sqlerrm='account_suspended'; end;
    if not denied then raise exception 'Suspended account bypass accepted'; end if;
    reset role;
    results := results || jsonb_build_array(selected_role||'_suspension_preserved');
  end loop;
  perform set_config('qa.signup_results',results::text,true);
end;
$$;
select jsonb_array_elements_text(current_setting('qa.signup_results')::jsonb) as passed_check;
rollback;
