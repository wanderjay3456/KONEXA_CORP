-- Public help stores only approved article identifiers, never visitors' questions.
-- Private coaching records are server-written and readable only by their owner.
create table public.konexa_ai_generations (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('help_route', 'coach_chat')),
  context_key text not null check (char_length(context_key) between 1 and 180),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  locale text not null check (locale in ('ko', 'en', 'vi')),
  model text,
  knowledge_version text,
  result jsonb not null default '{}'::jsonb,
  token_usage jsonb,
  estimated_cost_usd numeric,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((kind = 'help_route' and user_id is null) or (kind = 'coach_chat' and user_id is not null)),
  check (octet_length(result::text) <= 100000)
);
alter table public.konexa_ai_generations enable row level security;
revoke all on public.konexa_ai_generations from anon, authenticated;
grant select on public.konexa_ai_generations to authenticated;
grant all on public.konexa_ai_generations to service_role;
create policy ai_generations_owner_read on public.konexa_ai_generations
  for select to authenticated using (user_id = (select auth.uid()));
create index ai_generations_owner_context on public.konexa_ai_generations(user_id, context_key, created_at desc);
create index ai_generations_help_budget on public.konexa_ai_generations(created_at) where kind = 'help_route';
