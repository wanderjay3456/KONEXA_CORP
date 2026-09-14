-- Trigger functions and server-only application helpers must never be callable
-- directly by browser database roles. The trigger itself continues to run with
-- its owning table operation, and the service role retains controlled access.
do $$
begin
  if to_regprocedure('public.konexa_talent_audit_status_change()') is not null then
    revoke all on function public.konexa_talent_audit_status_change() from public, anon, authenticated;
  end if;

  if to_regprocedure('public.submit_konexa_talent_application(jsonb)') is not null then
    revoke all on function public.submit_konexa_talent_application(jsonb) from public, anon, authenticated;
    grant execute on function public.submit_konexa_talent_application(jsonb) to service_role;
  end if;
end;
$$;
