-- AI operations, prompts, metrics, and policies are internal records.
-- Keep any legacy rows from being readable merely because they were marked public.
update public.app_records
set is_public = false
where collection_name in (
  'ai_agents', 'ai_memories', 'ai_tasks', 'prompt_versions',
  'ai_reports', 'ai_metrics', 'model_registry', 'ai_logs',
  'ai_feedback', 'rbac_policies'
)
and is_public = true;
