-- KONEXA backend v2 hardening
--
-- The v2 tables are intentionally server-only. Explicit deny policies make
-- that posture visible to database tooling while service_role continues to
-- bypass RLS. Covering indexes keep participant and operations queries stable
-- as transaction volume grows.

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'konexa_projects', 'konexa_applications', 'konexa_relationships',
    'konexa_contracts', 'konexa_contract_signatures', 'konexa_milestones',
    'konexa_milestone_submissions', 'konexa_payment_orders',
    'konexa_ledger_transactions', 'konexa_ledger_entries', 'konexa_reviews',
    'konexa_disputes', 'konexa_work_passport_entries',
    'konexa_ai_assessments', 'konexa_notification_outbox',
    'konexa_webhook_events', 'konexa_audit_events',
    'konexa_command_idempotency'
  ]
  loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table
        and policyname = 'konexa_server_only'
    ) then
      execute format(
        'create policy konexa_server_only on public.%I for all to anon, authenticated using (false) with check (false)',
        target_table
      );
    end if;
  end loop;
end;
$$;

create index if not exists konexa_projects_company_idx
on public.konexa_projects(company_id, created_at desc);

create index if not exists konexa_applications_company_idx
on public.konexa_applications(company_id, created_at desc);
create index if not exists konexa_applications_student_idx
on public.konexa_applications(student_id, created_at desc);

create index if not exists konexa_relationships_company_idx
on public.konexa_relationships(company_id, created_at desc);
create index if not exists konexa_relationships_student_idx
on public.konexa_relationships(student_id, created_at desc);
create index if not exists konexa_relationships_project_idx
on public.konexa_relationships(project_id);
create index if not exists konexa_relationships_application_idx
on public.konexa_relationships(application_id);

create index if not exists konexa_contracts_relationship_idx
on public.konexa_contracts(relationship_id);
create index if not exists konexa_contracts_company_idx
on public.konexa_contracts(company_id, created_at desc);
create index if not exists konexa_contracts_student_idx
on public.konexa_contracts(student_id, created_at desc);
create index if not exists konexa_contracts_project_idx
on public.konexa_contracts(project_id);

create index if not exists konexa_contract_signatures_relationship_idx
on public.konexa_contract_signatures(relationship_id);
create index if not exists konexa_contract_signatures_signer_idx
on public.konexa_contract_signatures(signer_id, created_at desc);
create index if not exists konexa_contract_signatures_provider_document_idx
on public.konexa_contract_signatures(provider, provider_document_id);

create index if not exists konexa_milestones_relationship_idx
on public.konexa_milestones(relationship_id);
create index if not exists konexa_milestones_contract_idx
on public.konexa_milestones(contract_id);
create index if not exists konexa_milestones_company_idx
on public.konexa_milestones(company_id, created_at desc);
create index if not exists konexa_milestones_student_idx
on public.konexa_milestones(student_id, created_at desc);

create index if not exists konexa_milestone_submissions_submitter_idx
on public.konexa_milestone_submissions(submitted_by, created_at desc);

create index if not exists konexa_payment_orders_relationship_idx
on public.konexa_payment_orders(relationship_id);
create index if not exists konexa_payment_orders_contract_idx
on public.konexa_payment_orders(contract_id);
create index if not exists konexa_payment_orders_milestone_idx
on public.konexa_payment_orders(milestone_id);
create index if not exists konexa_payment_orders_payer_idx
on public.konexa_payment_orders(payer_company_id, created_at desc);
create index if not exists konexa_payment_orders_payee_idx
on public.konexa_payment_orders(payee_student_id, created_at desc);

create index if not exists konexa_ledger_transactions_payment_idx
on public.konexa_ledger_transactions(payment_order_id);

create index if not exists konexa_reviews_contract_idx
on public.konexa_reviews(contract_id);
create index if not exists konexa_reviews_reviewer_idx
on public.konexa_reviews(reviewer_id, created_at desc);
create index if not exists konexa_reviews_reviewee_idx
on public.konexa_reviews(reviewee_id, created_at desc);

create index if not exists konexa_disputes_relationship_idx
on public.konexa_disputes(relationship_id);
create index if not exists konexa_disputes_contract_idx
on public.konexa_disputes(contract_id);
create index if not exists konexa_disputes_milestone_idx
on public.konexa_disputes(milestone_id);
create index if not exists konexa_disputes_creator_idx
on public.konexa_disputes(created_by);
create index if not exists konexa_disputes_company_idx
on public.konexa_disputes(company_id, created_at desc);
create index if not exists konexa_disputes_student_idx
on public.konexa_disputes(student_id, created_at desc);
create index if not exists konexa_disputes_admin_idx
on public.konexa_disputes(assigned_admin_id);

create index if not exists konexa_work_passport_relationship_idx
on public.konexa_work_passport_entries(relationship_id);
create index if not exists konexa_work_passport_contract_idx
on public.konexa_work_passport_entries(contract_id);
create index if not exists konexa_work_passport_milestone_idx
on public.konexa_work_passport_entries(milestone_id);

create index if not exists konexa_ai_assessments_requester_idx
on public.konexa_ai_assessments(requested_by, created_at desc);
create index if not exists konexa_ai_assessments_subject_idx
on public.konexa_ai_assessments(subject_user_id, created_at desc);

create index if not exists konexa_notification_outbox_recipient_idx
on public.konexa_notification_outbox(recipient_id, created_at desc);

create index if not exists konexa_audit_events_actor_idx
on public.konexa_audit_events(actor_id, created_at desc);

create index if not exists konexa_command_idempotency_actor_idx
on public.konexa_command_idempotency(actor_id, created_at desc);
