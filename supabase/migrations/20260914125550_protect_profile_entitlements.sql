-- Generated assessments and commercial entitlements are never browser input.
create or replace function private.konexa_profile_server_keys()
returns text[] language sql immutable set search_path = '' as $$
  select array['uid','createdAt','trustScore','completedProjects','verified','verifiedStatus',
    'identityVerified','identityVerificationStatus','verificationReviewedAt','verifiedAt','verifiedBy',
    'badges','workPassport','accountStatus','isAdmin','subscriptionStatus','subscriptionTier',
    'earlyPioneer','earlyPioneerPriority','earlyPioneerEligible','earlyPioneerQualifiedAt',
    'earlyBirdEligible','earlyBirdQualifiedAt','subscriptionDiscountPercent','subscriptionDiscountMonths',
    'premiumTalentViewCredits','resumeConsultingCredits','withdrawalFeePaybackWeeks',
    'aiAnalysis','aiAnalysisStatus','aiCareerReadiness','aiEmployabilityScore','aiAnalyzedAt','aiAssessmentId'];
$$;
revoke all on function private.konexa_profile_server_keys() from public, anon;
grant execute on function private.konexa_profile_server_keys() to authenticated, service_role;

do $$
declare definition text;
begin
  definition := pg_get_functiondef('private.konexa_protect_profile_facts()'::regprocedure);
  definition := replace(definition, 'protected := array[', 'protected := private.konexa_profile_server_keys() || array[');
  execute definition;

  definition := pg_get_functiondef('private.handle_konexa_user()'::regprocedure);
  definition := replace(definition,
    'coalesce(new.raw_user_meta_data->''company_profile'', ''{}''::jsonb)',
    '(coalesce(new.raw_user_meta_data->''company_profile'', ''{}''::jsonb) - private.konexa_profile_server_keys())');
  definition := replace(definition,
    'coalesce(new.raw_user_meta_data->''student_profile'', ''{}''::jsonb)',
    '(coalesce(new.raw_user_meta_data->''student_profile'', ''{}''::jsonb) - private.konexa_profile_server_keys())');
  execute definition;

  definition := pg_get_functiondef('public.complete_google_onboarding(text,jsonb,jsonb)'::regprocedure);
  definition := replace(definition,
    'safe_profile := coalesce(profile_payload, ''{}''::jsonb)',
    'safe_profile := coalesce(profile_payload, ''{}''::jsonb) - private.konexa_profile_server_keys()');
  execute definition;
end;
$$;

-- Atomic JSON merge avoids overwriting a concurrent profile edit after AI work.
create or replace function public.konexa_save_profile_analysis(p_user_id uuid, p_collection text, p_analysis jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare patch jsonb;
begin
  if p_collection not in ('student_profiles','company_profiles') then
    raise invalid_parameter_value using message = 'KONEXA_INVALID_PROFILE_COLLECTION';
  end if;
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into patch
    from jsonb_each(p_analysis) where key = any(array['aiAnalysis','aiAnalysisStatus',
      'aiCareerReadiness','aiEmployabilityScore','aiAnalyzedAt','aiAssessmentId']);
  update public.app_records set data = data || patch, updated_at = now()
    where collection_name = p_collection and record_id = p_user_id::text and owner_id = p_user_id;
  if not found then raise no_data_found using message = 'KONEXA_PROFILE_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.konexa_save_profile_analysis(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.konexa_save_profile_analysis(uuid,text,jsonb) to service_role;
