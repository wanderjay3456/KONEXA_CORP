-- The API's service_role executes invoker-mode commands. It needs only these
-- internal helpers; browser roles receive no additional grants or table access.
grant usage on schema private to service_role;
grant execute on function private.konexa_role(uuid), private.konexa_is_admin(uuid),
  private.konexa_company_verified(uuid), private.konexa_reserve_command(uuid,text,text,jsonb),
  private.konexa_complete_command(uuid,text,text,jsonb), private.konexa_append_audit(uuid,text,text,text,jsonb,jsonb,text),
  private.konexa_enqueue_notification(uuid,text,jsonb,text) to service_role;
