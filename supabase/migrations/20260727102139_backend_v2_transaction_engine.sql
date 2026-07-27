-- KONEXA backend v2
--
-- This migration introduces server-owned relational workflow tables alongside
-- the legacy app_records compatibility layer. Browser clients keep reading the
-- compatibility records during the transition, but business-critical writes
-- are committed atomically through service-role-only RPC functions.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.konexa_projects (
  id uuid primary key default gen_random_uuid(),
  legacy_record_id text unique,
  company_id uuid not null references auth.users(id) on delete restrict,
  company_name text not null check (char_length(company_name) between 1 and 160),
  title text not null check (char_length(title) between 5 and 180),
  description text not null check (char_length(description) between 20 and 10000),
  requirements text[] not null default '{}',
  tags text[] not null default '{}',
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  reward_text text not null default '',
  weekly_pay_krw bigint check (weekly_pay_krw is null or weekly_pay_krw between 1000 and 100000000),
  currency text not null default 'KRW' check (currency ~ '^[A-Z]{3}$'),
  work_type text check (work_type is null or work_type in ('Remote', 'Hybrid', 'Onsite')),
  duration_weeks smallint check (duration_weeks is null or duration_weeks between 1 and 52),
  hours_per_week numeric(5,2) check (hours_per_week is null or hours_per_week > 0 and hours_per_week <= 80),
  required_language text,
  application_deadline timestamptz,
  hiring_opportunity boolean not null default false,
  contact_policy_version text,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'open', 'filled', 'completed', 'cancelled')),
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.konexa_applications (
  id uuid primary key default gen_random_uuid(),
  legacy_record_id text unique,
  project_id uuid not null references public.konexa_projects(id) on delete restrict,
  company_id uuid not null references auth.users(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  student_name text not null check (char_length(student_name) between 1 and 160),
  submission_text text not null default '' check (char_length(submission_text) <= 50000),
  status text not null default 'submitted'
    check (status in ('submitted', 'reviewed', 'shortlisted', 'approved', 'rejected', 'withdrawn', 'contracted')),
  reviewer_feedback text not null default '' check (char_length(reviewer_feedback) <= 10000),
  reviewer_score smallint check (reviewer_score is null or reviewer_score between 0 and 100),
  ai_score smallint check (ai_score is null or ai_score between 0 and 100),
  ai_feedback text check (ai_feedback is null or char_length(ai_feedback) <= 20000),
  ai_model text,
  ai_prompt_version text,
  ai_reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  early_pioneer boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (project_id, student_id)
);

create table if not exists public.konexa_relationships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  project_id uuid references public.konexa_projects(id) on delete set null,
  application_id uuid references public.konexa_applications(id) on delete set null,
  purpose text not null check (purpose in ('interview', 'project', 'hire')),
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'active', 'completed', 'cancelled', 'disputed')),
  contact_status text not null default 'locked' check (contact_status in ('locked', 'unlocked')),
  existing_relationship_claimed boolean not null default false,
  conversion_window_ends_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create unique index if not exists konexa_relationships_active_unique
on public.konexa_relationships (
  company_id,
  student_id,
  coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
where status not in ('cancelled', 'completed');

create table if not exists public.konexa_contracts (
  id uuid primary key default gen_random_uuid(),
  legacy_record_id text unique,
  relationship_id uuid not null references public.konexa_relationships(id) on delete restrict,
  company_id uuid not null references auth.users(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  project_id uuid references public.konexa_projects(id) on delete set null,
  title text not null check (char_length(title) between 3 and 200),
  contract_type text not null default 'company_project'
    check (contract_type in ('company_project', 'hiring_conversion')),
  document_version text not null,
  scope jsonb not null default '{}'::jsonb,
  monthly_amount_krw bigint not null check (monthly_amount_krw between 10000 and 1000000000),
  currency text not null default 'KRW' check (currency ~ '^[A-Z]{3}$'),
  payment_provider_type text not null default 'domestic_pg_escrow',
  status text not null default 'issued'
    check (status in (
      'draft', 'issued', 'awaiting_signature', 'signed', 'funding_pending',
      'funded', 'active', 'completed', 'cancelled', 'disputed'
    )),
  issued_at timestamptz not null default clock_timestamp(),
  activated_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.konexa_contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.konexa_contracts(id) on delete cascade,
  relationship_id uuid not null references public.konexa_relationships(id) on delete restrict,
  signer_id uuid not null references auth.users(id) on delete restrict,
  signer_role text not null check (signer_role in ('company', 'student')),
  provider text not null,
  provider_document_id text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'declined', 'revoked', 'failed')),
  signed_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  unique (contract_id, signer_role)
);

create table if not exists public.konexa_milestones (
  id uuid primary key default gen_random_uuid(),
  legacy_record_id text unique,
  relationship_id uuid not null references public.konexa_relationships(id) on delete restrict,
  contract_id uuid not null references public.konexa_contracts(id) on delete restrict,
  company_id uuid not null references auth.users(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 200),
  deliverable text not null check (char_length(deliverable) between 10 and 10000),
  due_at timestamptz not null,
  amount_krw bigint not null check (amount_krw between 1000 and 1000000000),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'submitted', 'approved', 'rejected', 'payout_ready', 'paid', 'disputed', 'cancelled')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.konexa_milestone_submissions (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.konexa_milestones(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  version integer not null check (version between 1 and 100),
  notes text not null default '' check (char_length(notes) <= 10000),
  storage_paths text[] not null default '{}',
  created_at timestamptz not null default clock_timestamp(),
  unique (milestone_id, version)
);

create table if not exists public.konexa_payment_orders (
  id uuid primary key default gen_random_uuid(),
  legacy_record_id text unique,
  relationship_id uuid references public.konexa_relationships(id) on delete set null,
  contract_id uuid references public.konexa_contracts(id) on delete set null,
  milestone_id uuid references public.konexa_milestones(id) on delete set null,
  legacy_contract_id text,
  payer_company_id uuid not null references auth.users(id) on delete restrict,
  payee_student_id uuid references auth.users(id) on delete restrict,
  provider text not null,
  provider_payment_id text,
  idempotency_key text not null unique,
  amount_krw bigint not null check (amount_krw between 1000 and 1000000000),
  currency text not null default 'KRW' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'prepared'
    check (status in (
      'prepared', 'ready', 'pending', 'awaiting_transfer', 'awaiting_deposit', 'authorized',
      'funds_secured', 'paid', 'partially_refunded', 'refunded',
      'cancelled', 'failed', 'amount_mismatch', 'provider_unknown'
    )),
  reference text,
  provider_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create unique index if not exists konexa_payment_orders_provider_id_unique
on public.konexa_payment_orders(provider, provider_payment_id)
where provider_payment_id is not null;

create table if not exists public.konexa_ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid references public.konexa_payment_orders(id) on delete restrict,
  transaction_type text not null
    check (transaction_type in ('funds_secured', 'platform_fee', 'payout', 'refund', 'adjustment')),
  external_reference text,
  idempotency_key text not null unique,
  amount_krw bigint not null check (amount_krw > 0),
  currency text not null default 'KRW' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'posted' check (status = 'posted'),
  metadata jsonb not null default '{}'::jsonb,
  posted_at timestamptz not null default clock_timestamp()
);

create table if not exists public.konexa_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.konexa_ledger_transactions(id) on delete restrict,
  account_code text not null check (account_code ~ '^[a-z0-9_:-]{3,100}$'),
  owner_id uuid references auth.users(id) on delete restrict,
  direction text not null check (direction in ('debit', 'credit')),
  amount_krw bigint not null check (amount_krw > 0),
  currency text not null default 'KRW' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists konexa_ledger_entries_transaction_idx
on public.konexa_ledger_entries(transaction_id);

create index if not exists konexa_ledger_entries_owner_idx
on public.konexa_ledger_entries(owner_id, created_at desc);

create table if not exists public.konexa_reviews (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.konexa_relationships(id) on delete restrict,
  contract_id uuid references public.konexa_contracts(id) on delete set null,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  reviewee_id uuid not null references auth.users(id) on delete restrict,
  reviewer_role text not null check (reviewer_role in ('company', 'student')),
  overall_rating smallint not null check (overall_rating between 1 and 5),
  quality_rating smallint not null check (quality_rating between 1 and 5),
  communication_rating smallint not null check (communication_rating between 1 and 5),
  reliability_rating smallint not null check (reliability_rating between 1 and 5),
  scope_clarity_rating smallint not null check (scope_clarity_rating between 1 and 5),
  comment text not null check (char_length(comment) between 20 and 1000),
  status text not null default 'sealed' check (status in ('sealed', 'published', 'moderation_hold', 'removed')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  published_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  unique (relationship_id, reviewer_id)
);

create table if not exists public.konexa_disputes (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.konexa_relationships(id) on delete restrict,
  contract_id uuid references public.konexa_contracts(id) on delete set null,
  milestone_id uuid references public.konexa_milestones(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  company_id uuid not null references auth.users(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  category text not null check (char_length(category) between 2 and 100),
  summary text not null check (char_length(summary) between 20 and 5000),
  status text not null default 'open'
    check (status in ('open', 'evidence_requested', 'under_review', 'resolved', 'closed')),
  resolution jsonb,
  assigned_admin_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.konexa_work_passport_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete restrict,
  relationship_id uuid not null references public.konexa_relationships(id) on delete restrict,
  contract_id uuid references public.konexa_contracts(id) on delete set null,
  milestone_id uuid references public.konexa_milestones(id) on delete set null,
  evidence_type text not null
    check (evidence_type in ('project_completed', 'milestone_approved', 'verified_review', 'verified_skill')),
  evidence jsonb not null,
  source_hash text not null,
  verified_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default clock_timestamp(),
  unique (student_id, source_hash)
);

create table if not exists public.konexa_ai_assessments (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete restrict,
  subject_user_id uuid references auth.users(id) on delete restrict,
  entity_type text not null check (entity_type in ('application', 'project', 'student_profile', 'company_profile', 'matching', 'resume', 'roadmap')),
  entity_id text not null,
  assessment_type text not null,
  model text not null,
  prompt_version text not null,
  input_hash text not null,
  result jsonb not null,
  confidence smallint check (confidence is null or confidence between 0 and 100),
  estimated_cost_usd numeric(12,6) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  human_override jsonb,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists konexa_ai_assessments_entity_idx
on public.konexa_ai_assessments(entity_type, entity_id, created_at desc);

create table if not exists public.konexa_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  template text not null,
  channel text not null default 'email' check (channel in ('email', 'system')),
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'dead_letter')),
  attempts smallint not null default 0 check (attempts between 0 and 20),
  next_attempt_at timestamptz not null default clock_timestamp(),
  locked_by text,
  locked_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default clock_timestamp(),
  sent_at timestamptz,
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists konexa_notification_outbox_pending_idx
on public.konexa_notification_outbox(next_attempt_at, created_at)
where status in ('pending', 'failed');

create table if not exists public.konexa_webhook_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload_hash text not null,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  attempts smallint not null default 0,
  last_error text,
  received_at timestamptz not null default clock_timestamp(),
  processed_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (provider, event_id)
);

create table if not exists public.konexa_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null check (char_length(action) between 3 and 120),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text not null,
  before_state jsonb,
  after_state jsonb,
  request_id text,
  ip_hash text,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists konexa_audit_events_entity_idx
on public.konexa_audit_events(entity_type, entity_id, created_at desc);

create table if not exists public.konexa_command_idempotency (
  scope_key text primary key,
  actor_id uuid not null references auth.users(id) on delete cascade,
  command_name text not null,
  request_hash text not null,
  response jsonb,
  created_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz
);

create or replace function private.konexa_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'konexa_projects', 'konexa_applications', 'konexa_relationships',
    'konexa_contracts', 'konexa_milestones', 'konexa_payment_orders',
    'konexa_disputes', 'konexa_notification_outbox', 'konexa_webhook_events'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', target_table || '_touch', target_table);
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.konexa_touch_updated_at()',
      target_table || '_touch',
      target_table
    );
  end loop;
end;
$$;

create or replace function private.konexa_append_audit(
  p_actor uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_before jsonb,
  p_after jsonb,
  p_request_id text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.konexa_audit_events(
    actor_id, actor_role, action, entity_type, entity_id,
    before_state, after_state, request_id
  )
  values (
    p_actor,
    private.konexa_role(p_actor),
    left(p_action, 120),
    left(p_entity_type, 80),
    p_entity_id,
    p_before,
    p_after,
    p_request_id
  );
end;
$$;

create or replace function private.konexa_enqueue_notification(
  p_recipient uuid,
  p_template text,
  p_payload jsonb,
  p_idempotency_key text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.konexa_notification_outbox(
    recipient_id, template, payload, idempotency_key
  )
  values (
    p_recipient,
    left(p_template, 100),
    coalesce(p_payload, '{}'::jsonb),
    left(p_idempotency_key, 240)
  )
  on conflict (idempotency_key) do nothing;
$$;

create or replace function private.konexa_reserve_command(
  p_actor uuid,
  p_command text,
  p_key text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  scope_value text := p_actor::text || ':' || p_command || ':' || left(p_key, 160);
  inserted_scope text;
  prior public.konexa_command_idempotency%rowtype;
begin
  if p_actor is null or nullif(btrim(p_key), '') is null then
    raise exception using message = 'invalid_idempotency_key';
  end if;

  insert into public.konexa_command_idempotency(
    scope_key, actor_id, command_name, request_hash
  )
  values (scope_value, p_actor, p_command, md5(coalesce(p_payload, '{}'::jsonb)::text))
  on conflict (scope_key) do nothing
  returning scope_key into inserted_scope;

  if inserted_scope is not null then
    return null;
  end if;

  select * into prior
  from public.konexa_command_idempotency
  where scope_key = scope_value;

  if prior.request_hash is distinct from md5(coalesce(p_payload, '{}'::jsonb)::text) then
    raise exception using message = 'idempotency_key_reused_with_different_payload';
  end if;
  if prior.response is null then
    raise exception using message = 'command_in_progress';
  end if;
  return prior.response;
end;
$$;

create or replace function private.konexa_complete_command(
  p_actor uuid,
  p_command text,
  p_key text,
  p_response jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.konexa_command_idempotency
  set response = p_response, completed_at = clock_timestamp()
  where scope_key = p_actor::text || ':' || p_command || ':' || left(p_key, 160)
    and actor_id = p_actor;
$$;

create or replace function public.konexa_create_project_v2(
  p_actor uuid,
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  project_id uuid := gen_random_uuid();
  company_profile jsonb;
  company_name_value text;
  requirements_value text[];
  tags_value text[];
  created_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000);
  result jsonb;
begin
  prior := private.konexa_reserve_command(p_actor, 'create_project', p_idempotency_key, p_payload);
  if prior is not null then return prior; end if;

  if private.konexa_role(p_actor) <> 'company' then
    raise exception using message = 'company_role_required';
  end if;
  if not private.konexa_company_verified(p_actor) then
    raise exception using message = 'verified_company_required';
  end if;
  if not coalesce((p_payload->>'contactPolicyAccepted')::boolean, false) then
    raise exception using message = 'contact_policy_acceptance_required';
  end if;

  select data into company_profile
  from public.app_records
  where collection_name = 'company_profiles' and record_id = p_actor::text;
  company_name_value := coalesce(nullif(btrim(company_profile->>'companyName'), ''), 'Verified company');

  if char_length(btrim(coalesce(p_payload->>'title', ''))) not between 5 and 180
     or char_length(btrim(coalesce(p_payload->>'description', ''))) not between 20 and 10000 then
    raise exception using message = 'invalid_project_content';
  end if;
  if coalesce(p_payload->>'difficulty', '') not in ('Easy', 'Medium', 'Hard') then
    raise exception using message = 'invalid_project_difficulty';
  end if;
  if jsonb_typeof(p_payload->'requirements') <> 'array'
     or jsonb_array_length(p_payload->'requirements') = 0
     or jsonb_array_length(p_payload->'requirements') > 30 then
    raise exception using message = 'invalid_project_requirements';
  end if;

  select coalesce(array_agg(left(btrim(value), 100)), '{}')
  into requirements_value
  from jsonb_array_elements_text(p_payload->'requirements')
  where nullif(btrim(value), '') is not null;

  if jsonb_typeof(p_payload->'tags') = 'array' then
    select coalesce(array_agg(left(btrim(value), 100)), '{}')
    into tags_value
    from (
      select value
      from jsonb_array_elements_text(p_payload->'tags')
      where nullif(btrim(value), '') is not null
      limit 30
    ) tags;
  else
    tags_value := '{}';
  end if;

  insert into public.konexa_projects(
    id, legacy_record_id, company_id, company_name, title, description,
    requirements, tags, difficulty, reward_text, weekly_pay_krw,
    work_type, duration_weeks, hours_per_week, required_language,
    application_deadline, hiring_opportunity, contact_policy_version,
    status, published_at
  )
  values (
    project_id,
    project_id::text,
    p_actor,
    company_name_value,
    btrim(p_payload->>'title'),
    btrim(p_payload->>'description'),
    requirements_value,
    tags_value,
    p_payload->>'difficulty',
    left(coalesce(p_payload->>'reward', ''), 200),
    nullif(p_payload->>'weeklyPayKrw', '')::bigint,
    nullif(p_payload->>'workType', ''),
    nullif(p_payload->>'durationWeeks', '')::smallint,
    nullif(p_payload->>'hoursPerWeek', '')::numeric,
    nullif(left(coalesce(p_payload->>'requiredLanguage', ''), 100), ''),
    nullif(p_payload->>'applicationDeadline', '')::timestamptz,
    coalesce((p_payload->>'hiringOpportunity')::boolean, false),
    left(coalesce(p_payload->>'contactPolicyVersion', 'signup-v1'), 100),
    'open',
    clock_timestamp()
  );

  insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
  values (
    'projects',
    project_id::text,
    p_actor,
    jsonb_strip_nulls(jsonb_build_object(
      'id', project_id::text,
      'title', btrim(p_payload->>'title'),
      'description', btrim(p_payload->>'description'),
      'requirements', to_jsonb(requirements_value),
      'companyId', p_actor::text,
      'companyName', company_name_value,
      'difficulty', p_payload->>'difficulty',
      'reward', left(coalesce(p_payload->>'reward', ''), 200),
      'status', 'open',
      'tags', to_jsonb(tags_value),
      'createdAt', created_ms,
      'workType', nullif(p_payload->>'workType', ''),
      'durationWeeks', nullif(p_payload->>'durationWeeks', '')::smallint,
      'hoursPerWeek', nullif(p_payload->>'hoursPerWeek', '')::numeric,
      'weeklyPayKrw', nullif(p_payload->>'weeklyPayKrw', '')::bigint,
      'requiredLanguage', nullif(p_payload->>'requiredLanguage', ''),
      'applicationDeadline', nullif(p_payload->>'applicationDeadline', ''),
      'hiringOpportunity', coalesce((p_payload->>'hiringOpportunity')::boolean, false),
      'contactPolicyAccepted', true,
      'backendVersion', 2
    )),
    true
  );

  result := jsonb_build_object(
    'id', project_id::text,
    'status', 'open',
    'createdAt', created_ms
  );
  perform private.konexa_append_audit(
    p_actor, 'PROJECT_CREATED', 'project', project_id::text,
    null, result, p_idempotency_key
  );
  perform private.konexa_enqueue_notification(
    p_actor,
    'project_published',
    jsonb_build_object('projectId', project_id::text, 'project', btrim(p_payload->>'title')),
    'project-published:' || project_id::text
  );
  perform private.konexa_complete_command(p_actor, 'create_project', p_idempotency_key, result);
  return result;
end;
$$;

create or replace function public.konexa_apply_to_project_v2(
  p_actor uuid,
  p_project_id uuid,
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  project_row public.konexa_projects%rowtype;
  profile jsonb;
  application_id uuid;
  created_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000);
  result jsonb;
begin
  prior := private.konexa_reserve_command(p_actor, 'apply_project', p_idempotency_key, p_payload || jsonb_build_object('projectId', p_project_id));
  if prior is not null then return prior; end if;

  if private.konexa_role(p_actor) <> 'student' then
    raise exception using message = 'student_role_required';
  end if;
  select * into project_row
  from public.konexa_projects
  where id = p_project_id
  for update;
  if project_row.id is null then raise exception using message = 'project_not_found'; end if;
  if project_row.status <> 'open' then raise exception using message = 'project_not_open'; end if;
  if project_row.application_deadline is not null and project_row.application_deadline < clock_timestamp() then
    raise exception using message = 'application_deadline_passed';
  end if;

  select data into profile
  from public.app_records
  where collection_name = 'student_profiles' and record_id = p_actor::text;
  if profile is null or not coalesce((profile->>'onboardingCompleted')::boolean, false) then
    raise exception using message = 'completed_student_profile_required';
  end if;

  insert into public.konexa_applications(
    project_id, company_id, student_id, student_name,
    submission_text, early_pioneer
  )
  values (
    project_row.id,
    project_row.company_id,
    p_actor,
    left(coalesce(nullif(btrim(profile->>'name'), ''), 'KONEXA talent'), 160),
    left(coalesce(p_payload->>'submission', ''), 50000),
    coalesce((profile->>'earlyPioneerEligible')::boolean, false)
  )
  on conflict (project_id, student_id) do nothing
  returning id into application_id;

  if application_id is null then
    select id into application_id
    from public.konexa_applications
    where project_id = p_project_id and student_id = p_actor;
  end if;

  update public.konexa_applications
  set legacy_record_id = coalesce(legacy_record_id, application_id::text)
  where id = application_id;

  insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
  values (
    'applications',
    application_id::text,
    p_actor,
    jsonb_build_object(
      'id', application_id::text,
      'projectId', project_row.id::text,
      'projectTitle', project_row.title,
      'companyId', project_row.company_id::text,
      'studentId', p_actor::text,
      'studentName', left(coalesce(nullif(btrim(profile->>'name'), ''), 'KONEXA talent'), 160),
      'codeSubmission', left(coalesce(p_payload->>'submission', ''), 50000),
      'feedback', 'AI review pending',
      'status', 'submitted',
      'score', 0,
      'createdAt', created_ms,
      'earlyPioneer', coalesce((profile->>'earlyPioneerEligible')::boolean, false),
      'backendVersion', 2
    ),
    false
  )
  on conflict (collection_name, record_id) do nothing;

  result := jsonb_build_object(
    'id', application_id::text,
    'projectId', project_row.id::text,
    'status', 'submitted',
    'createdAt', created_ms
  );
  perform private.konexa_append_audit(
    p_actor, 'APPLICATION_SUBMITTED', 'application', application_id::text,
    null, result, p_idempotency_key
  );
  perform private.konexa_enqueue_notification(
    p_actor,
    'application_received',
    jsonb_build_object('applicationId', application_id::text, 'project', project_row.title),
    'application-received:' || application_id::text
  );
  perform private.konexa_enqueue_notification(
    project_row.company_id,
    'new_application',
    jsonb_build_object('applicationId', application_id::text, 'project', project_row.title),
    'company-new-application:' || application_id::text
  );
  perform private.konexa_complete_command(p_actor, 'apply_project', p_idempotency_key, result);
  return result;
end;
$$;

create or replace function public.konexa_review_application_v2(
  p_actor uuid,
  p_application_id uuid,
  p_status text,
  p_feedback text,
  p_score integer,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  application_row public.konexa_applications%rowtype;
  before_value jsonb;
  result jsonb;
  allowed boolean := false;
begin
  prior := private.konexa_reserve_command(
    p_actor,
    'review_application',
    p_idempotency_key,
    jsonb_build_object('applicationId', p_application_id, 'status', p_status, 'feedback', p_feedback, 'score', p_score)
  );
  if prior is not null then return prior; end if;

  select * into application_row
  from public.konexa_applications
  where id = p_application_id
  for update;
  if application_row.id is null then raise exception using message = 'application_not_found'; end if;
  if not private.konexa_is_admin(p_actor) and (
    private.konexa_role(p_actor) <> 'company' or application_row.company_id <> p_actor
  ) then
    raise exception using message = 'application_review_forbidden';
  end if;
  if p_status not in ('reviewed', 'shortlisted', 'approved', 'rejected') then
    raise exception using message = 'invalid_application_status';
  end if;
  if p_score < 0 or p_score > 100 or char_length(coalesce(p_feedback, '')) > 10000 then
    raise exception using message = 'invalid_application_review';
  end if;

  allowed := private.konexa_is_admin(p_actor)
    or (application_row.status = 'submitted' and p_status in ('reviewed', 'shortlisted', 'approved', 'rejected'))
    or (application_row.status = 'reviewed' and p_status in ('shortlisted', 'approved', 'rejected'))
    or (application_row.status = 'shortlisted' and p_status in ('approved', 'rejected'));
  if not allowed then raise exception using message = 'invalid_application_transition'; end if;

  before_value := to_jsonb(application_row);
  update public.konexa_applications
  set status = p_status,
      reviewer_feedback = coalesce(p_feedback, ''),
      reviewer_score = p_score,
      reviewed_by = p_actor,
      reviewed_at = clock_timestamp()
  where id = p_application_id;

  update public.app_records
  set data = data || jsonb_build_object(
    'status', p_status,
    'feedback', coalesce(p_feedback, ''),
    'score', p_score,
    'reviewedBy', p_actor::text,
    'reviewedAt', floor(extract(epoch from clock_timestamp()) * 1000),
    'backendVersion', 2
  )
  where collection_name = 'applications'
    and record_id = coalesce(application_row.legacy_record_id, application_row.id::text);

  result := jsonb_build_object(
    'id', application_row.id::text,
    'status', p_status,
    'score', p_score
  );
  perform private.konexa_append_audit(
    p_actor, 'APPLICATION_REVIEWED', 'application', application_row.id::text,
    before_value, result, p_idempotency_key
  );
  perform private.konexa_enqueue_notification(
    application_row.student_id,
    'application_status',
    jsonb_build_object(
      'applicationId', application_row.id::text,
      'status', p_status,
      'projectId', application_row.project_id::text
    ),
    'application-status:' || application_row.id::text || ':' || p_status
  );
  perform private.konexa_complete_command(p_actor, 'review_application', p_idempotency_key, result);
  return result;
end;
$$;

create or replace function public.konexa_record_ai_evaluation_v2(
  p_actor uuid,
  p_application_id uuid,
  p_model text,
  p_prompt_version text,
  p_input_hash text,
  p_result jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  application_row public.konexa_applications%rowtype;
  score_value integer;
  feedback_value text;
  assessment_id uuid;
  result jsonb;
begin
  select * into application_row
  from public.konexa_applications
  where id = p_application_id
  for update;
  if application_row.id is null then raise exception using message = 'application_not_found'; end if;
  if application_row.student_id <> p_actor and not private.konexa_is_admin(p_actor) then
    raise exception using message = 'ai_evaluation_forbidden';
  end if;
  if nullif(btrim(p_model), '') is null or nullif(btrim(p_prompt_version), '') is null then
    raise exception using message = 'ai_provenance_required';
  end if;

  score_value := greatest(0, least(100, coalesce((p_result->>'score')::integer, 0)));
  feedback_value := left(coalesce(p_result->>'feedback', ''), 20000);

  insert into public.konexa_ai_assessments(
    requested_by, subject_user_id, entity_type, entity_id, assessment_type,
    model, prompt_version, input_hash, result, confidence
  )
  values (
    p_actor, application_row.student_id, 'application', application_row.id::text,
    'code_submission', left(p_model, 160), left(p_prompt_version, 100),
    left(p_input_hash, 128), p_result,
    case when p_result ? 'confidence' then greatest(0, least(100, (p_result->>'confidence')::integer)) else null end
  )
  returning id into assessment_id;

  update public.konexa_applications
  set status = case when status = 'submitted' then 'reviewed' else status end,
      ai_score = score_value,
      ai_feedback = feedback_value,
      ai_model = left(p_model, 160),
      ai_prompt_version = left(p_prompt_version, 100),
      ai_reviewed_at = clock_timestamp()
  where id = p_application_id;

  update public.app_records
  set data = data || jsonb_build_object(
    'status', case when application_row.status = 'submitted' then 'reviewed' else application_row.status end,
    'score', score_value,
    'feedback', feedback_value,
    'aiModel', left(p_model, 160),
    'aiPromptVersion', left(p_prompt_version, 100),
    'aiReviewedAt', floor(extract(epoch from clock_timestamp()) * 1000),
    'backendVersion', 2
  )
  where collection_name = 'applications'
    and record_id = coalesce(application_row.legacy_record_id, application_row.id::text);

  result := jsonb_build_object(
    'assessmentId', assessment_id::text,
    'applicationId', application_row.id::text,
    'score', score_value,
    'model', p_model
  );
  perform private.konexa_append_audit(
    p_actor, 'AI_APPLICATION_EVALUATED', 'application', application_row.id::text,
    null, result, assessment_id::text
  );
  return result;
end;
$$;

create or replace function public.konexa_create_relationship_v2(
  p_actor uuid,
  p_student_id uuid,
  p_project_id uuid,
  p_purpose text,
  p_existing_relationship boolean,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  project_row public.konexa_projects%rowtype;
  relationship_id uuid;
  result jsonb;
begin
  prior := private.konexa_reserve_command(
    p_actor,
    'create_relationship',
    p_idempotency_key,
    jsonb_build_object('studentId', p_student_id, 'projectId', p_project_id, 'purpose', p_purpose)
  );
  if prior is not null then return prior; end if;

  if private.konexa_role(p_actor) <> 'company' or not private.konexa_company_verified(p_actor) then
    raise exception using message = 'verified_company_required';
  end if;
  if private.konexa_role(p_student_id) <> 'student' then
    raise exception using message = 'student_not_found';
  end if;
  if p_purpose not in ('interview', 'project', 'hire') then
    raise exception using message = 'invalid_relationship_purpose';
  end if;
  if p_project_id is not null then
    select * into project_row from public.konexa_projects where id = p_project_id;
    if project_row.id is null or project_row.company_id <> p_actor then
      raise exception using message = 'project_relationship_forbidden';
    end if;
  end if;

  insert into public.konexa_relationships(
    company_id, student_id, project_id, purpose,
    existing_relationship_claimed, conversion_window_ends_at
  )
  values (
    p_actor, p_student_id, p_project_id, p_purpose,
    coalesce(p_existing_relationship, false),
    clock_timestamp() + interval '12 months'
  )
  on conflict do nothing
  returning id into relationship_id;

  if relationship_id is null then
    select id into relationship_id
    from public.konexa_relationships
    where company_id = p_actor
      and student_id = p_student_id
      and project_id is not distinct from p_project_id
      and status not in ('cancelled', 'completed')
    order by created_at desc
    limit 1;
  end if;

  result := jsonb_build_object('id', relationship_id::text, 'status', 'requested');
  perform private.konexa_append_audit(
    p_actor, 'RELATIONSHIP_REQUESTED', 'relationship', relationship_id::text,
    null, result, p_idempotency_key
  );
  perform private.konexa_enqueue_notification(
    p_student_id,
    'introduction_requested',
    jsonb_build_object('relationshipId', relationship_id::text, 'purpose', p_purpose),
    'relationship-requested:' || relationship_id::text
  );
  perform private.konexa_complete_command(p_actor, 'create_relationship', p_idempotency_key, result);
  return result;
end;
$$;

create or replace function public.konexa_create_contract_v2(
  p_actor uuid,
  p_relationship_id uuid,
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  relationship_row public.konexa_relationships%rowtype;
  contract_id uuid := gen_random_uuid();
  amount_value bigint;
  result jsonb;
begin
  prior := private.konexa_reserve_command(p_actor, 'create_contract', p_idempotency_key, p_payload || jsonb_build_object('relationshipId', p_relationship_id));
  if prior is not null then return prior; end if;

  select * into relationship_row
  from public.konexa_relationships
  where id = p_relationship_id
  for update;
  if relationship_row.id is null then raise exception using message = 'relationship_not_found'; end if;
  if relationship_row.company_id <> p_actor or private.konexa_role(p_actor) <> 'company' then
    raise exception using message = 'contract_creation_forbidden';
  end if;
  if relationship_row.status not in ('requested', 'accepted', 'active') then
    raise exception using message = 'invalid_relationship_state';
  end if;
  if char_length(btrim(coalesce(p_payload->>'title', ''))) not between 3 and 200
     or jsonb_typeof(p_payload->'scope') <> 'object' then
    raise exception using message = 'invalid_contract_content';
  end if;
  amount_value := nullif(p_payload->>'monthlyAmountKrw', '')::bigint;
  if amount_value not between 10000 and 1000000000 then
    raise exception using message = 'invalid_contract_amount';
  end if;

  insert into public.konexa_contracts(
    id, legacy_record_id, relationship_id, company_id, student_id, project_id,
    title, contract_type, document_version, scope, monthly_amount_krw,
    payment_provider_type, status
  )
  values (
    contract_id, contract_id::text, relationship_row.id,
    relationship_row.company_id, relationship_row.student_id, relationship_row.project_id,
    btrim(p_payload->>'title'),
    coalesce(nullif(p_payload->>'contractType', ''), 'company_project'),
    coalesce(nullif(p_payload->>'documentVersion', ''), 'konexa-contract-v1'),
    p_payload->'scope',
    amount_value,
    coalesce(nullif(p_payload->>'paymentProviderType', ''), 'domestic_pg_escrow'),
    'issued'
  );

  update public.konexa_relationships set status = 'accepted' where id = relationship_row.id and status = 'requested';
  result := jsonb_build_object('id', contract_id::text, 'status', 'issued');
  perform private.konexa_append_audit(
    p_actor, 'CONTRACT_ISSUED', 'contract', contract_id::text,
    null, result, p_idempotency_key
  );
  perform private.konexa_enqueue_notification(
    relationship_row.student_id,
    'contract_action',
    jsonb_build_object('contractId', contract_id::text, 'relationshipId', relationship_row.id::text, 'status', 'issued'),
    'contract-issued:' || contract_id::text
  );
  perform private.konexa_complete_command(p_actor, 'create_contract', p_idempotency_key, result);
  return result;
end;
$$;

create or replace function public.konexa_create_milestone_v2(
  p_actor uuid,
  p_contract_id uuid,
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  contract_row public.konexa_contracts%rowtype;
  milestone_id uuid := gen_random_uuid();
  amount_value bigint;
  result jsonb;
begin
  prior := private.konexa_reserve_command(p_actor, 'create_milestone', p_idempotency_key, p_payload || jsonb_build_object('contractId', p_contract_id));
  if prior is not null then return prior; end if;
  select * into contract_row from public.konexa_contracts where id = p_contract_id for update;
  if contract_row.id is null then raise exception using message = 'contract_not_found'; end if;
  if contract_row.company_id <> p_actor or private.konexa_role(p_actor) <> 'company' then
    raise exception using message = 'milestone_creation_forbidden';
  end if;
  if contract_row.status not in ('signed', 'funded', 'active') then
    raise exception using message = 'contract_not_ready_for_milestones';
  end if;
  amount_value := nullif(p_payload->>'amountKrw', '')::bigint;
  if amount_value not between 1000 and 1000000000
     or char_length(btrim(coalesce(p_payload->>'title', ''))) not between 3 and 200
     or char_length(btrim(coalesce(p_payload->>'deliverable', ''))) not between 10 and 10000 then
    raise exception using message = 'invalid_milestone_content';
  end if;

  insert into public.konexa_milestones(
    id, legacy_record_id, relationship_id, contract_id, company_id, student_id,
    title, deliverable, due_at, amount_krw
  )
  values (
    milestone_id, milestone_id::text, contract_row.relationship_id,
    contract_row.id, contract_row.company_id, contract_row.student_id,
    btrim(p_payload->>'title'), btrim(p_payload->>'deliverable'),
    (p_payload->>'dueAt')::timestamptz, amount_value
  );
  result := jsonb_build_object('id', milestone_id::text, 'status', 'scheduled');
  perform private.konexa_append_audit(
    p_actor, 'MILESTONE_CREATED', 'milestone', milestone_id::text,
    null, result, p_idempotency_key
  );
  perform private.konexa_enqueue_notification(
    contract_row.student_id,
    'milestone_action',
    jsonb_build_object('milestoneId', milestone_id::text, 'contractId', contract_row.id::text, 'status', 'scheduled'),
    'milestone-created:' || milestone_id::text
  );
  perform private.konexa_complete_command(p_actor, 'create_milestone', p_idempotency_key, result);
  return result;
end;
$$;

create or replace function public.konexa_submit_milestone_v2(
  p_actor uuid,
  p_milestone_id uuid,
  p_notes text,
  p_storage_paths text[],
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  milestone_row public.konexa_milestones%rowtype;
  next_version integer;
  submission_id uuid;
  before_value jsonb;
  result jsonb;
begin
  prior := private.konexa_reserve_command(
    p_actor, 'submit_milestone', p_idempotency_key,
    jsonb_build_object('milestoneId', p_milestone_id, 'notes', p_notes, 'storagePaths', to_jsonb(coalesce(p_storage_paths, '{}')))
  );
  if prior is not null then return prior; end if;
  select * into milestone_row from public.konexa_milestones where id = p_milestone_id for update;
  if milestone_row.id is null then raise exception using message = 'milestone_not_found'; end if;
  if milestone_row.student_id <> p_actor or private.konexa_role(p_actor) <> 'student' then
    raise exception using message = 'milestone_submission_forbidden';
  end if;
  if milestone_row.status not in ('scheduled', 'in_progress', 'rejected') then
    raise exception using message = 'invalid_milestone_submission_transition';
  end if;
  if char_length(coalesce(p_notes, '')) > 10000 or cardinality(coalesce(p_storage_paths, '{}')) > 20 then
    raise exception using message = 'invalid_milestone_submission';
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.konexa_milestone_submissions
  where milestone_id = p_milestone_id;
  insert into public.konexa_milestone_submissions(
    milestone_id, submitted_by, version, notes, storage_paths
  )
  values (
    p_milestone_id, p_actor, next_version, coalesce(p_notes, ''), coalesce(p_storage_paths, '{}')
  )
  returning id into submission_id;

  before_value := to_jsonb(milestone_row);
  update public.konexa_milestones
  set status = 'submitted', submitted_at = clock_timestamp()
  where id = p_milestone_id;
  result := jsonb_build_object('id', p_milestone_id::text, 'submissionId', submission_id::text, 'status', 'submitted', 'version', next_version);
  perform private.konexa_append_audit(
    p_actor, 'MILESTONE_SUBMITTED', 'milestone', p_milestone_id::text,
    before_value, result, p_idempotency_key
  );
  perform private.konexa_enqueue_notification(
    milestone_row.company_id,
    'milestone_action',
    jsonb_build_object('milestoneId', p_milestone_id::text, 'status', 'submitted'),
    'milestone-submitted:' || submission_id::text
  );
  perform private.konexa_complete_command(p_actor, 'submit_milestone', p_idempotency_key, result);
  return result;
end;
$$;

create or replace function public.konexa_review_milestone_v2(
  p_actor uuid,
  p_milestone_id uuid,
  p_decision text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  milestone_row public.konexa_milestones%rowtype;
  next_status text;
  result jsonb;
begin
  prior := private.konexa_reserve_command(
    p_actor, 'review_milestone', p_idempotency_key,
    jsonb_build_object('milestoneId', p_milestone_id, 'decision', p_decision)
  );
  if prior is not null then return prior; end if;
  select * into milestone_row from public.konexa_milestones where id = p_milestone_id for update;
  if milestone_row.id is null then raise exception using message = 'milestone_not_found'; end if;
  if milestone_row.company_id <> p_actor or private.konexa_role(p_actor) <> 'company' then
    raise exception using message = 'milestone_review_forbidden';
  end if;
  if milestone_row.status <> 'submitted' or p_decision not in ('approved', 'rejected') then
    raise exception using message = 'invalid_milestone_review_transition';
  end if;
  next_status := p_decision;
  update public.konexa_milestones
  set status = next_status,
      reviewed_at = clock_timestamp(),
      completed_at = case when next_status = 'approved' then clock_timestamp() else completed_at end
  where id = p_milestone_id;
  result := jsonb_build_object('id', p_milestone_id::text, 'status', next_status);
  perform private.konexa_append_audit(
    p_actor, 'MILESTONE_REVIEWED', 'milestone', p_milestone_id::text,
    to_jsonb(milestone_row), result, p_idempotency_key
  );
  perform private.konexa_enqueue_notification(
    milestone_row.student_id,
    'milestone_action',
    jsonb_build_object('milestoneId', p_milestone_id::text, 'status', next_status),
    'milestone-reviewed:' || p_milestone_id::text || ':' || next_status
  );
  perform private.konexa_complete_command(p_actor, 'review_milestone', p_idempotency_key, result);
  return result;
end;
$$;

create or replace function public.konexa_create_dispute_v2(
  p_actor uuid,
  p_relationship_id uuid,
  p_contract_id uuid,
  p_milestone_id uuid,
  p_category text,
  p_summary text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  relationship_row public.konexa_relationships%rowtype;
  dispute_id uuid := gen_random_uuid();
  result jsonb;
begin
  prior := private.konexa_reserve_command(
    p_actor, 'create_dispute', p_idempotency_key,
    jsonb_build_object('relationshipId', p_relationship_id, 'contractId', p_contract_id, 'milestoneId', p_milestone_id, 'category', p_category, 'summary', p_summary)
  );
  if prior is not null then return prior; end if;
  select * into relationship_row from public.konexa_relationships where id = p_relationship_id for update;
  if relationship_row.id is null then raise exception using message = 'relationship_not_found'; end if;
  if p_actor not in (relationship_row.company_id, relationship_row.student_id) then
    raise exception using message = 'dispute_creation_forbidden';
  end if;
  if char_length(btrim(coalesce(p_category, ''))) not between 2 and 100
     or char_length(btrim(coalesce(p_summary, ''))) not between 20 and 5000 then
    raise exception using message = 'invalid_dispute_content';
  end if;

  insert into public.konexa_disputes(
    id, relationship_id, contract_id, milestone_id, created_by,
    company_id, student_id, category, summary
  )
  values (
    dispute_id, relationship_row.id, p_contract_id, p_milestone_id,
    p_actor, relationship_row.company_id, relationship_row.student_id,
    btrim(p_category), btrim(p_summary)
  );
  update public.konexa_relationships set status = 'disputed' where id = relationship_row.id;
  update public.konexa_contracts set status = 'disputed' where id = p_contract_id;
  update public.konexa_milestones set status = 'disputed' where id = p_milestone_id;
  result := jsonb_build_object('id', dispute_id::text, 'status', 'open');
  perform private.konexa_append_audit(
    p_actor, 'DISPUTE_OPENED', 'dispute', dispute_id::text,
    null, result, p_idempotency_key
  );
  perform private.konexa_complete_command(p_actor, 'create_dispute', p_idempotency_key, result);
  return result;
end;
$$;

create or replace function public.konexa_create_review_v2(
  p_actor uuid,
  p_relationship_id uuid,
  p_contract_id uuid,
  p_overall_rating integer,
  p_quality_rating integer,
  p_communication_rating integer,
  p_reliability_rating integer,
  p_scope_clarity_rating integer,
  p_comment text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  relationship_row public.konexa_relationships%rowtype;
  reviewer_role_value text;
  reviewee_id_value uuid;
  review_id uuid := gen_random_uuid();
  result jsonb;
begin
  prior := private.konexa_reserve_command(
    p_actor,
    'create_review',
    p_idempotency_key,
    jsonb_build_object(
      'relationshipId', p_relationship_id,
      'contractId', p_contract_id,
      'overallRating', p_overall_rating,
      'qualityRating', p_quality_rating,
      'communicationRating', p_communication_rating,
      'reliabilityRating', p_reliability_rating,
      'scopeClarityRating', p_scope_clarity_rating,
      'comment', p_comment
    )
  );
  if prior is not null then return prior; end if;

  select * into relationship_row
  from public.konexa_relationships
  where id = p_relationship_id;
  if relationship_row.id is null then raise exception using message = 'relationship_not_found'; end if;
  if p_actor = relationship_row.company_id then
    reviewer_role_value := 'company';
    reviewee_id_value := relationship_row.student_id;
  elsif p_actor = relationship_row.student_id then
    reviewer_role_value := 'student';
    reviewee_id_value := relationship_row.company_id;
  else
    raise exception using message = 'review_creation_forbidden';
  end if;
  if p_contract_id is not null and not exists (
    select 1
    from public.konexa_contracts
    where id = p_contract_id
      and relationship_id = p_relationship_id
  ) then
    raise exception using message = 'contract_relationship_mismatch';
  end if;
  if not exists (
    select 1
    from public.konexa_payment_orders
    where relationship_id = p_relationship_id
      and status in ('funds_secured', 'paid', 'partially_refunded', 'refunded')
  ) then
    raise exception using message = 'verified_payment_required_for_review';
  end if;
  if p_overall_rating not between 1 and 5
     or p_quality_rating not between 1 and 5
     or p_communication_rating not between 1 and 5
     or p_reliability_rating not between 1 and 5
     or p_scope_clarity_rating not between 1 and 5
     or char_length(btrim(coalesce(p_comment, ''))) not between 20 and 1000 then
    raise exception using message = 'invalid_review_content';
  end if;

  insert into public.konexa_reviews(
    id, relationship_id, contract_id, reviewer_id, reviewee_id,
    reviewer_role, overall_rating, quality_rating, communication_rating,
    reliability_rating, scope_clarity_rating, comment
  )
  values (
    review_id, p_relationship_id, p_contract_id, p_actor, reviewee_id_value,
    reviewer_role_value, p_overall_rating, p_quality_rating,
    p_communication_rating, p_reliability_rating, p_scope_clarity_rating,
    btrim(p_comment)
  );
  result := jsonb_build_object('id', review_id::text, 'status', 'sealed');
  perform private.konexa_append_audit(
    p_actor, 'REVIEW_SUBMITTED', 'review', review_id::text,
    null, result, p_idempotency_key
  );
  perform private.konexa_complete_command(
    p_actor, 'create_review', p_idempotency_key, result
  );
  return result;
end;
$$;

create or replace function public.konexa_moderate_review_v2(
  p_actor uuid,
  p_review_id uuid,
  p_decision text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  review_row public.konexa_reviews%rowtype;
  result jsonb;
begin
  prior := private.konexa_reserve_command(
    p_actor, 'moderate_review', p_idempotency_key,
    jsonb_build_object('reviewId', p_review_id, 'decision', p_decision)
  );
  if prior is not null then return prior; end if;
  if private.konexa_role(p_actor) <> 'admin' then
    raise exception using message = 'admin_role_required';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception using message = 'invalid_review_moderation_decision';
  end if;
  select * into review_row
  from public.konexa_reviews
  where id = p_review_id
  for update;
  if review_row.id is null then raise exception using message = 'review_not_found'; end if;

  update public.konexa_reviews
  set moderation_status = p_decision,
      status = case when p_decision = 'rejected' then 'removed' else 'sealed' end
  where id = p_review_id;

  if p_decision = 'approved' and exists (
    select 1
    from public.konexa_reviews
    where relationship_id = review_row.relationship_id
      and id <> p_review_id
      and moderation_status = 'approved'
  ) then
    update public.konexa_reviews
    set status = 'published',
        published_at = coalesce(published_at, clock_timestamp())
    where relationship_id = review_row.relationship_id
      and moderation_status = 'approved';
  end if;

  result := jsonb_build_object(
    'id', p_review_id::text,
    'moderationStatus', p_decision,
    'status', case when p_decision = 'rejected' then 'removed' else 'sealed' end
  );
  perform private.konexa_append_audit(
    p_actor, 'REVIEW_MODERATED', 'review', p_review_id::text,
    to_jsonb(review_row), result, p_idempotency_key
  );
  perform private.konexa_complete_command(
    p_actor, 'moderate_review', p_idempotency_key, result
  );
  return result;
end;
$$;

create or replace function public.konexa_register_signature_document_v2(
  p_actor uuid,
  p_contract_id uuid,
  p_provider text,
  p_provider_document_id text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior jsonb;
  contract_row public.konexa_contracts%rowtype;
  result jsonb;
begin
  prior := private.konexa_reserve_command(
    p_actor, 'register_signature_document', p_idempotency_key,
    jsonb_build_object(
      'contractId', p_contract_id,
      'provider', p_provider,
      'providerDocumentId', p_provider_document_id
    )
  );
  if prior is not null then return prior; end if;
  select * into contract_row
  from public.konexa_contracts
  where id = p_contract_id
  for update;
  if contract_row.id is null then raise exception using message = 'contract_not_found'; end if;
  if contract_row.company_id <> p_actor or private.konexa_role(p_actor) <> 'company' then
    raise exception using message = 'signature_request_forbidden';
  end if;
  if contract_row.status not in ('issued', 'awaiting_signature') then
    raise exception using message = 'invalid_signature_request_state';
  end if;
  if p_provider <> 'modusign'
     or char_length(btrim(coalesce(p_provider_document_id, ''))) not between 3 and 200 then
    raise exception using message = 'invalid_signature_provider_document';
  end if;

  insert into public.konexa_contract_signatures(
    contract_id, relationship_id, signer_id, signer_role,
    provider, provider_document_id, verification_status
  )
  values
    (
      contract_row.id, contract_row.relationship_id, contract_row.company_id,
      'company', p_provider, btrim(p_provider_document_id), 'pending'
    ),
    (
      contract_row.id, contract_row.relationship_id, contract_row.student_id,
      'student', p_provider, btrim(p_provider_document_id), 'pending'
    )
  on conflict (contract_id, signer_role) do update
  set provider = excluded.provider,
      provider_document_id = excluded.provider_document_id,
      verification_status = 'pending',
      signed_at = null,
      verified_at = null;

  update public.konexa_contracts
  set status = 'awaiting_signature'
  where id = contract_row.id;
  result := jsonb_build_object(
    'id', contract_row.id::text,
    'status', 'awaiting_signature',
    'providerDocumentId', btrim(p_provider_document_id)
  );
  perform private.konexa_append_audit(
    p_actor, 'SIGNATURE_DOCUMENT_REGISTERED', 'contract', contract_row.id::text,
    to_jsonb(contract_row), result, p_idempotency_key
  );
  perform private.konexa_complete_command(
    p_actor, 'register_signature_document', p_idempotency_key, result
  );
  return result;
end;
$$;

create or replace function public.konexa_record_signature_document_status_v2(
  p_provider text,
  p_provider_document_id text,
  p_event_type text,
  p_verified_status text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  contract_row public.konexa_contracts%rowtype;
  next_signature_status text;
  next_contract_status text;
  result jsonb;
begin
  select contract.*
  into contract_row
  from public.konexa_contracts contract
  join public.konexa_contract_signatures signature
    on signature.contract_id = contract.id
  where signature.provider = p_provider
    and signature.provider_document_id = p_provider_document_id
  limit 1
  for update of contract;
  if contract_row.id is null then
    raise exception using message = 'signature_document_not_found';
  end if;
  if p_verified_status = 'COMPLETED' then
    next_signature_status := 'verified';
    next_contract_status := 'signed';
  elsif p_verified_status = 'ABORTED' or p_event_type in (
    'document_rejected', 'document_request_canceled', 'document_signing_canceled'
  ) then
    next_signature_status := 'declined';
    next_contract_status := 'cancelled';
  elsif p_verified_status = 'PROCESSING_FAILED' then
    next_signature_status := 'failed';
    next_contract_status := 'cancelled';
  else
    return jsonb_build_object(
      'id', contract_row.id::text,
      'status', contract_row.status,
      'ignored', true
    );
  end if;

  update public.konexa_contract_signatures
  set verification_status = next_signature_status,
      signed_at = case when next_signature_status = 'verified' then clock_timestamp() else signed_at end,
      verified_at = case when next_signature_status = 'verified' then clock_timestamp() else verified_at end
  where provider = p_provider
    and provider_document_id = p_provider_document_id;
  update public.konexa_contracts
  set status = next_contract_status
  where id = contract_row.id;
  if next_contract_status = 'signed' then
    update public.konexa_relationships
    set status = 'active'
    where id = contract_row.relationship_id
      and status in ('requested', 'accepted');
  end if;
  result := jsonb_build_object(
    'id', contract_row.id::text,
    'status', next_contract_status,
    'signatureStatus', next_signature_status
  );
  perform private.konexa_append_audit(
    null, 'SIGNATURE_STATUS_VERIFIED', 'contract', contract_row.id::text,
    to_jsonb(contract_row), result, p_provider_document_id
  );
  return result;
end;
$$;

create or replace function public.konexa_upsert_payment_order_v2(
  p_legacy_record_id text,
  p_relationship_id uuid,
  p_contract_id uuid,
  p_legacy_contract_id text,
  p_company_id uuid,
  p_student_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_idempotency_key text,
  p_amount_krw bigint,
  p_status text,
  p_reference text,
  p_payload jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  payment_order_id uuid;
begin
  if p_amount_krw not between 1000 and 1000000000 then
    raise exception using message = 'invalid_payment_amount';
  end if;
  if p_status not in (
    'prepared', 'ready', 'pending', 'awaiting_transfer', 'awaiting_deposit', 'authorized',
    'funds_secured', 'paid', 'partially_refunded', 'refunded',
    'cancelled', 'failed', 'amount_mismatch', 'provider_unknown'
  ) then
    raise exception using message = 'invalid_payment_status';
  end if;

  insert into public.konexa_payment_orders(
    legacy_record_id, relationship_id, contract_id, legacy_contract_id,
    payer_company_id, payee_student_id, provider, provider_payment_id,
    idempotency_key, amount_krw, status, reference, provider_payload,
    paid_at
  )
  values (
    p_legacy_record_id, p_relationship_id, p_contract_id, p_legacy_contract_id,
    p_company_id, p_student_id, p_provider, p_provider_payment_id,
    p_idempotency_key, p_amount_krw, p_status, p_reference, coalesce(p_payload, '{}'::jsonb),
    case when p_status in ('funds_secured', 'paid') then clock_timestamp() else null end
  )
  on conflict (idempotency_key) do update
  set status = excluded.status,
      provider_payment_id = coalesce(excluded.provider_payment_id, public.konexa_payment_orders.provider_payment_id),
      provider_payload = public.konexa_payment_orders.provider_payload || excluded.provider_payload,
      reference = coalesce(excluded.reference, public.konexa_payment_orders.reference),
      paid_at = coalesce(public.konexa_payment_orders.paid_at, excluded.paid_at)
  returning id into payment_order_id;

  return payment_order_id;
end;
$$;

create or replace function public.konexa_record_payment_event_v2(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_provider_payment_id text,
  p_status text,
  p_payload_hash text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_status text;
  payment_row public.konexa_payment_orders%rowtype;
  ledger_id uuid;
  result jsonb;
begin
  select status into existing_status
  from public.konexa_webhook_events
  where provider = p_provider and event_id = p_event_id;
  if existing_status = 'processed' then
    return jsonb_build_object('duplicate', true, 'eventId', p_event_id);
  end if;

  insert into public.konexa_webhook_events(
    provider, event_id, event_type, payload_hash, status, attempts
  )
  values (p_provider, p_event_id, p_event_type, p_payload_hash, 'processing', 1)
  on conflict (provider, event_id) do update
  set attempts = public.konexa_webhook_events.attempts + 1,
      status = 'processing',
      last_error = null;

  select * into payment_row
  from public.konexa_payment_orders
  where provider = p_provider and provider_payment_id = p_provider_payment_id
  for update;
  if payment_row.id is null then
    update public.konexa_webhook_events
    set status = 'ignored', processed_at = clock_timestamp()
    where provider = p_provider and event_id = p_event_id;
    return jsonb_build_object('ignored', true, 'eventId', p_event_id);
  end if;

  update public.konexa_payment_orders
  set status = p_status,
      provider_payload = provider_payload || coalesce(p_payload, '{}'::jsonb),
      paid_at = case when p_status in ('funds_secured', 'paid') then coalesce(paid_at, clock_timestamp()) else paid_at end
  where id = payment_row.id;

  if p_status in ('funds_secured', 'paid') then
    insert into public.konexa_ledger_transactions(
      payment_order_id, transaction_type, external_reference,
      idempotency_key, amount_krw, metadata
    )
    values (
      payment_row.id, 'funds_secured', p_provider_payment_id,
      p_provider || ':funds_secured:' || p_provider_payment_id,
      payment_row.amount_krw,
      jsonb_build_object('provider', p_provider, 'eventId', p_event_id)
    )
    on conflict (idempotency_key) do nothing
    returning id into ledger_id;

    if ledger_id is not null then
      insert into public.konexa_ledger_entries(
        transaction_id, account_code, owner_id, direction, amount_krw
      )
      values
        (ledger_id, 'cash:provider_clearing', payment_row.payer_company_id, 'debit', payment_row.amount_krw),
        (ledger_id, 'liability:student_payable', payment_row.payee_student_id, 'credit', payment_row.amount_krw);
    end if;
  end if;

  update public.konexa_webhook_events
  set status = 'processed', processed_at = clock_timestamp()
  where provider = p_provider and event_id = p_event_id;
  result := jsonb_build_object('paymentOrderId', payment_row.id::text, 'status', p_status, 'duplicate', false);
  return result;
exception
  when others then
    update public.konexa_webhook_events
    set status = 'failed', last_error = left(sqlerrm, 1000)
    where provider = p_provider and event_id = p_event_id;
    raise;
end;
$$;

create or replace function public.konexa_claim_notification_outbox_v2(
  p_worker_id text,
  p_limit integer default 20
)
returns setof public.konexa_notification_outbox
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  with claimable as (
    select id
    from public.konexa_notification_outbox
    where (
      status in ('pending', 'failed')
      or (status = 'processing' and locked_at < clock_timestamp() - interval '15 minutes')
    )
      and next_attempt_at <= clock_timestamp()
      and attempts < 5
    order by created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 100))
  )
  update public.konexa_notification_outbox outbox
  set status = 'processing',
      locked_by = left(p_worker_id, 160),
      locked_at = clock_timestamp(),
      attempts = attempts + 1
  from claimable
  where outbox.id = claimable.id
  returning outbox.*;
end;
$$;

create or replace function public.konexa_complete_notification_outbox_v2(
  p_id uuid,
  p_worker_id text,
  p_success boolean,
  p_provider_message_id text default null,
  p_error text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.konexa_notification_outbox
  set status = case
        when p_success then 'sent'
        when attempts >= 5 then 'dead_letter'
        else 'failed'
      end,
      provider_message_id = case when p_success then left(p_provider_message_id, 300) else provider_message_id end,
      last_error = case when p_success then null else left(coalesce(p_error, 'delivery_failed'), 1000) end,
      sent_at = case when p_success then clock_timestamp() else sent_at end,
      next_attempt_at = case
        when p_success then next_attempt_at
        else clock_timestamp() + make_interval(secs => least(3600, (power(2, greatest(1, attempts)) * 30)::integer))
      end,
      locked_by = null,
      locked_at = null
  where id = p_id and locked_by = left(p_worker_id, 160);
end;
$$;

-- Backfill the currently active project and application compatibility records.
insert into public.konexa_projects(
  id, legacy_record_id, company_id, company_name, title, description,
  requirements, tags, difficulty, reward_text, weekly_pay_krw,
  work_type, duration_weeks, hours_per_week, required_language,
  application_deadline, hiring_opportunity, contact_policy_version,
  status, published_at, created_at, updated_at
)
select
  record_id::uuid,
  record_id,
  (data->>'companyId')::uuid,
  left(coalesce(nullif(data->>'companyName', ''), 'Company'), 160),
  left(case
    when char_length(btrim(coalesce(data->>'title', ''))) >= 5 then btrim(data->>'title')
    else 'Legacy project ' || left(record_id, 8)
  end, 180),
  left(case
    when char_length(btrim(coalesce(data->>'description', ''))) >= 20 then btrim(data->>'description')
    else 'Legacy project imported into the KONEXA backend v2 transaction engine.'
  end, 10000),
  case when jsonb_typeof(data->'requirements') = 'array'
    then array(select left(value, 100) from jsonb_array_elements_text(data->'requirements') limit 30)
    else '{}'::text[] end,
  case when jsonb_typeof(data->'tags') = 'array'
    then array(select left(value, 100) from jsonb_array_elements_text(data->'tags') limit 30)
    else '{}'::text[] end,
  case when data->>'difficulty' in ('Easy', 'Medium', 'Hard') then data->>'difficulty' else 'Medium' end,
  left(coalesce(data->>'reward', ''), 200),
  case when coalesce(data->>'weeklyPayKrw', '') ~ '^[0-9]+$' then (data->>'weeklyPayKrw')::bigint else null end,
  case when data->>'workType' in ('Remote', 'Hybrid', 'Onsite') then data->>'workType' else null end,
  case when coalesce(data->>'durationWeeks', '') ~ '^[0-9]+$' then least(52, greatest(1, (data->>'durationWeeks')::int))::smallint else null end,
  case when coalesce(data->>'hoursPerWeek', '') ~ '^[0-9]+([.][0-9]+)?$' then least(80, greatest(1, (data->>'hoursPerWeek')::numeric)) else null end,
  nullif(left(coalesce(data->>'requiredLanguage', ''), 100), ''),
  case when coalesce(data->>'applicationDeadline', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' then (data->>'applicationDeadline')::timestamptz else null end,
  case when lower(coalesce(data->>'hiringOpportunity', '')) in ('true', 'false')
    then (data->>'hiringOpportunity')::boolean else false end,
  'legacy-import',
  case when data->>'status' in ('open', 'filled', 'completed', 'cancelled') then data->>'status' else 'open' end,
  case when coalesce(data->>'status', 'open') = 'open' then to_timestamp(
    case when coalesce(data->>'createdAt', '') ~ '^[0-9]+([.][0-9]+)?$'
      then (data->>'createdAt')::double precision / 1000
      else extract(epoch from created_at)
    end
  ) else null end,
  to_timestamp(
    case when coalesce(data->>'createdAt', '') ~ '^[0-9]+([.][0-9]+)?$'
      then (data->>'createdAt')::double precision / 1000
      else extract(epoch from created_at)
    end
  ),
  updated_at
from public.app_records
where collection_name = 'projects'
  and record_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and coalesce(data->>'companyId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
on conflict (id) do nothing;

insert into public.konexa_applications(
  id, legacy_record_id, project_id, company_id, student_id,
  student_name, submission_text, status, reviewer_feedback,
  reviewer_score, ai_score, ai_feedback, early_pioneer,
  created_at, updated_at
)
select
  application.record_id::uuid,
  application.record_id,
  (application.data->>'projectId')::uuid,
  project.company_id,
  (application.data->>'studentId')::uuid,
  left(coalesce(nullif(application.data->>'studentName', ''), 'KONEXA talent'), 160),
  left(coalesce(application.data->>'codeSubmission', ''), 50000),
  case when application.data->>'status' in ('submitted', 'reviewed', 'shortlisted', 'approved', 'rejected', 'withdrawn', 'contracted')
    then application.data->>'status' else 'submitted' end,
  left(coalesce(application.data->>'feedback', ''), 10000),
  case when coalesce(application.data->>'score', '') ~ '^[0-9]+$' then least(100, greatest(0, (application.data->>'score')::int)) else null end,
  case when coalesce(application.data->>'score', '') ~ '^[0-9]+$' then least(100, greatest(0, (application.data->>'score')::int)) else null end,
  left(coalesce(application.data->>'feedback', ''), 20000),
  case when lower(coalesce(application.data->>'earlyPioneer', '')) in ('true', 'false')
    then (application.data->>'earlyPioneer')::boolean else false end,
  to_timestamp(
    case when coalesce(application.data->>'createdAt', '') ~ '^[0-9]+([.][0-9]+)?$'
      then (application.data->>'createdAt')::double precision / 1000
      else extract(epoch from application.created_at)
    end
  ),
  application.updated_at
from public.app_records application
join public.konexa_projects project on project.id = case
  when coalesce(application.data->>'projectId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then (application.data->>'projectId')::uuid
  else null
end
where application.collection_name = 'applications'
  and application.record_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and coalesce(application.data->>'projectId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and coalesce(application.data->>'studentId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
on conflict (id) do nothing;

-- Browser clients no longer write projects or applications directly.
create or replace function private.can_insert_app_record(c text, d jsonb, record_owner uuid)
returns boolean
language sql
stable security definer
set search_path to 'public', 'private'
as $$
  select (select auth.uid()) is not null
    and record_owner = (select auth.uid())
    and (
      private.konexa_is_admin((select auth.uid()))
      or (
        c in ('users','student_profiles','company_profiles')
        and d->>'uid' = (select auth.uid())::text
      )
      or c in ('logs','sessions','verification_requests','security_logs')
      or (
        c = 'messages'
        and d->>'senderId' = (select auth.uid())::text
        and private.konexa_match_member(d->>'matchId', (select auth.uid()))
      )
      or (
        c = 'consents'
        and d->>'userId' = (select auth.uid())::text
        and d->>'documentVersion' is not null
      )
      or (
        c = 'introductions'
        and private.konexa_role((select auth.uid())) = 'company'
        and private.konexa_company_verified((select auth.uid()))
        and d->>'companyId' = (select auth.uid())::text
        and d->>'talentId' is not null
      )
      or (
        c in ('contracts','milestones','hiring_offers')
        and private.konexa_role((select auth.uid())) = 'company'
        and private.konexa_company_verified((select auth.uid()))
        and d->>'companyId' = (select auth.uid())::text
        and private.konexa_relationship_party(d->>'relationshipId', (select auth.uid()))
      )
      or (
        c in ('contract_signatures','milestone_submissions')
        and d->>'userId' = (select auth.uid())::text
        and private.konexa_relationship_party(d->>'relationshipId', (select auth.uid()))
      )
      or (
        c = 'reviews'
        and d->>'reviewerId' = (select auth.uid())::text
        and d->>'status' = 'sealed'
      )
      or (
        c = 'disputes'
        and d->>'createdBy' = (select auth.uid())::text
        and private.konexa_relationship_party(d->>'relationshipId', (select auth.uid()))
      )
      or (
        c = 'risk_events'
        and d->>'actorId' = (select auth.uid())::text
        and d->>'status' = 'open'
      )
      or (
        c = 'activity_checkins'
        and d->>'userId' = (select auth.uid())::text
      )
      or (
        c = 'protected_contacts'
        and private.konexa_role((select auth.uid())) = 'student'
        and d->>'userId' = (select auth.uid())::text
        and d->>'talentId' = (select auth.uid())::text
      )
    );
$$;

create or replace function private.can_update_app_record(c text, d jsonb, record_owner uuid)
returns boolean
language sql
stable security definer
set search_path to 'public', 'private'
as $$
  select (select auth.uid()) is not null and (
    private.konexa_is_admin((select auth.uid()))
    or (
      c in ('users','student_profiles','company_profiles')
      and record_owner = (select auth.uid())
      and d->>'uid' = (select auth.uid())::text
    )
    or (
      c not in (
        'users','student_profiles','company_profiles','projects','applications',
        'consents','introductions','contracts','contract_signatures',
        'payment_records','contact_unlocks','risk_events','reviews',
        'work_passport_entries'
      )
      and record_owner = (select auth.uid())
    )
  );
$$;

-- The public project preview now goes through a sanitized server endpoint.
revoke select on public.app_records from anon;

-- Google registration intents are created and consumed only through the
-- rate-limited server API. The browser no longer executes privileged RPCs.
revoke all on function public.begin_google_registration(text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.begin_google_registration(text, jsonb, jsonb) to service_role;
revoke all on function public.complete_google_registration(uuid) from public, anon, authenticated;
grant execute on function public.complete_google_registration(uuid) to service_role;

create or replace function public.konexa_complete_google_registration_v2(
  p_registration_id uuid,
  p_caller_id uuid
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_caller_id is null or not exists (
    select 1 from auth.users where id = p_caller_id
  ) then
    raise exception using message = 'authenticated_user_not_found';
  end if;
  perform set_config('request.jwt.claim.sub', p_caller_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  return public.complete_google_registration(p_registration_id);
end;
$$;

-- Lock every v2 table behind the server's secret key. RLS remains enabled as
-- defense in depth even though browser roles receive no table privileges.
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
    execute format('alter table public.%I enable row level security', target_table);
    execute format('revoke all on table public.%I from public, anon, authenticated', target_table);
    execute format('grant select, insert, update, delete on table public.%I to service_role', target_table);
  end loop;
end;
$$;

revoke update, delete, truncate on public.konexa_audit_events from service_role;
revoke update, delete, truncate on public.konexa_ledger_transactions from service_role;
revoke update, delete, truncate on public.konexa_ledger_entries from service_role;
grant usage, select on sequence public.konexa_audit_events_id_seq to service_role;

revoke all on function private.konexa_touch_updated_at() from public, anon, authenticated;
revoke all on function private.konexa_append_audit(uuid,text,text,text,jsonb,jsonb,text) from public, anon, authenticated;
revoke all on function private.konexa_enqueue_notification(uuid,text,jsonb,text) from public, anon, authenticated;
revoke all on function private.konexa_reserve_command(uuid,text,text,jsonb) from public, anon, authenticated;
revoke all on function private.konexa_complete_command(uuid,text,text,jsonb) from public, anon, authenticated;

revoke all on function public.konexa_create_project_v2(uuid,jsonb,text) from public, anon, authenticated;
revoke all on function public.konexa_apply_to_project_v2(uuid,uuid,jsonb,text) from public, anon, authenticated;
revoke all on function public.konexa_review_application_v2(uuid,uuid,text,text,integer,text) from public, anon, authenticated;
revoke all on function public.konexa_record_ai_evaluation_v2(uuid,uuid,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.konexa_create_relationship_v2(uuid,uuid,uuid,text,boolean,text) from public, anon, authenticated;
revoke all on function public.konexa_create_contract_v2(uuid,uuid,jsonb,text) from public, anon, authenticated;
revoke all on function public.konexa_create_milestone_v2(uuid,uuid,jsonb,text) from public, anon, authenticated;
revoke all on function public.konexa_submit_milestone_v2(uuid,uuid,text,text[],text) from public, anon, authenticated;
revoke all on function public.konexa_review_milestone_v2(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.konexa_create_dispute_v2(uuid,uuid,uuid,uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.konexa_create_review_v2(uuid,uuid,uuid,integer,integer,integer,integer,integer,text,text) from public, anon, authenticated;
revoke all on function public.konexa_moderate_review_v2(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.konexa_register_signature_document_v2(uuid,uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.konexa_record_signature_document_status_v2(text,text,text,text) from public, anon, authenticated;
revoke all on function public.konexa_upsert_payment_order_v2(text,uuid,uuid,text,uuid,uuid,text,text,text,bigint,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.konexa_record_payment_event_v2(text,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.konexa_claim_notification_outbox_v2(text,integer) from public, anon, authenticated;
revoke all on function public.konexa_complete_notification_outbox_v2(uuid,text,boolean,text,text) from public, anon, authenticated;
revoke all on function public.konexa_complete_google_registration_v2(uuid,uuid) from public, anon, authenticated;

grant execute on function public.konexa_create_project_v2(uuid,jsonb,text) to service_role;
grant execute on function public.konexa_apply_to_project_v2(uuid,uuid,jsonb,text) to service_role;
grant execute on function public.konexa_review_application_v2(uuid,uuid,text,text,integer,text) to service_role;
grant execute on function public.konexa_record_ai_evaluation_v2(uuid,uuid,text,text,text,jsonb) to service_role;
grant execute on function public.konexa_create_relationship_v2(uuid,uuid,uuid,text,boolean,text) to service_role;
grant execute on function public.konexa_create_contract_v2(uuid,uuid,jsonb,text) to service_role;
grant execute on function public.konexa_create_milestone_v2(uuid,uuid,jsonb,text) to service_role;
grant execute on function public.konexa_submit_milestone_v2(uuid,uuid,text,text[],text) to service_role;
grant execute on function public.konexa_review_milestone_v2(uuid,uuid,text,text) to service_role;
grant execute on function public.konexa_create_dispute_v2(uuid,uuid,uuid,uuid,text,text,text) to service_role;
grant execute on function public.konexa_create_review_v2(uuid,uuid,uuid,integer,integer,integer,integer,integer,text,text) to service_role;
grant execute on function public.konexa_moderate_review_v2(uuid,uuid,text,text) to service_role;
grant execute on function public.konexa_register_signature_document_v2(uuid,uuid,text,text,text) to service_role;
grant execute on function public.konexa_record_signature_document_status_v2(text,text,text,text) to service_role;
grant execute on function public.konexa_upsert_payment_order_v2(text,uuid,uuid,text,uuid,uuid,text,text,text,bigint,text,text,jsonb) to service_role;
grant execute on function public.konexa_record_payment_event_v2(text,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.konexa_claim_notification_outbox_v2(text,integer) to service_role;
grant execute on function public.konexa_complete_notification_outbox_v2(uuid,text,boolean,text,text) to service_role;
grant execute on function public.konexa_complete_google_registration_v2(uuid,uuid) to service_role;
