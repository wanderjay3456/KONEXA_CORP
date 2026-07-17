-- RLS policies execute these SECURITY DEFINER helpers as the calling role.
-- Keep the functions in the non-exposed private schema, but allow authenticated
-- users to execute only the helpers required by INSERT and UPDATE policies.

grant execute on function private.can_insert_app_record(text, jsonb, uuid)
  to authenticated;

grant execute on function private.can_update_app_record(text, jsonb, uuid)
  to authenticated;
