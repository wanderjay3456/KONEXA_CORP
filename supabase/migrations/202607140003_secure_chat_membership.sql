
create or replace function private.konexa_match_member(match_id text, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public, private
as $$
  select target_user is not null and exists (
    select 1 from public.app_records
    where collection_name = 'applications'
      and record_id = match_id
      and (data->>'studentId' = target_user::text or data->>'companyId' = target_user::text)
  );
$$;

create or replace function private.can_read_app_record(c text, d jsonb, record_owner uuid, public_record boolean)
returns boolean language sql stable security definer set search_path = public, private
as $$
  select public_record
    or (auth.uid() is not null and record_owner = auth.uid())
    or private.konexa_is_admin(auth.uid())
    or (
      auth.uid() is not null and c = 'applications'
      and (d->>'studentId' = auth.uid()::text or d->>'companyId' = auth.uid()::text)
    )
    or (
      auth.uid() is not null and c = 'messages'
      and private.konexa_match_member(d->>'matchId', auth.uid())
    );
$$;

create or replace function private.can_insert_app_record(c text, d jsonb, record_owner uuid)
returns boolean language sql stable security definer set search_path = public, private
as $$
  select auth.uid() is not null
    and record_owner = auth.uid()
    and (
      private.konexa_is_admin(auth.uid())
      or c in ('logs','sessions','verification_requests','security_logs')
      or (c = 'messages' and d->>'senderId' = auth.uid()::text and private.konexa_match_member(d->>'matchId', auth.uid()))
      or (c = 'projects' and private.konexa_role(auth.uid()) = 'company' and d->>'companyId' = auth.uid()::text)
      or (c = 'applications' and private.konexa_role(auth.uid()) = 'student' and d->>'studentId' = auth.uid()::text)
    );
$$;

revoke all on function private.konexa_match_member(text,uuid) from public;
grant execute on function private.konexa_match_member(text,uuid) to authenticated;
