-- Real, participant-scoped coordination. Business acknowledgements never forge
-- signatures, change funded amounts, release payments, or approve a visa/hire.
create table public.konexa_coordination_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('meeting','change','support')),
  relationship_id uuid not null references public.konexa_relationships(id),
  contract_id uuid references public.konexa_contracts(id),
  company_id uuid not null references auth.users(id), student_id uuid not null references auth.users(id),
  created_by uuid not null references auth.users(id), title text not null check (length(title) between 3 and 160),
  status text not null, version integer not null default 1 check(version>0),
  details jsonb not null default '{}' check(jsonb_typeof(details)='object'),
  slots timestamptz[] not null default '{}', duration_minutes integer,
  starts_at timestamptz, ends_at timestamptz, due_at timestamptz,
  supersedes_id uuid references public.konexa_coordination_items(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (company_id<>student_id),
  check ((kind='meeting' and status in ('proposed','confirmed','declined','cancelled','rescheduled','completed') and cardinality(slots) between 1 and 5 and duration_minutes between 15 and 120)
    or (kind='change' and status in ('proposed','agreed','rejected','withdrawn') and contract_id is not null)
    or (kind='support' and status in ('open','in_review','matching','proposal_sent','resolved','rejected','closed'))),
  check ((starts_at is null and ends_at is null) or (starts_at is not null and ends_at>starts_at))
);
create index konexa_coordination_company_idx on public.konexa_coordination_items(company_id,kind,created_at desc,id);
create index konexa_coordination_student_idx on public.konexa_coordination_items(student_id,kind,created_at desc,id);
create index konexa_coordination_relationship_idx on public.konexa_coordination_items(relationship_id);
create index konexa_coordination_contract_idx on public.konexa_coordination_items(contract_id);
create index konexa_coordination_creator_idx on public.konexa_coordination_items(created_by);
create index konexa_coordination_supersedes_idx on public.konexa_coordination_items(supersedes_id);
create index konexa_coordination_due_idx on public.konexa_coordination_items(due_at) where status in ('open','in_review','matching','proposal_sent','confirmed');
create unique index konexa_one_pending_change_idx on public.konexa_coordination_items(contract_id) where kind='change' and status='proposed';
create unique index konexa_one_reschedule_idx on public.konexa_coordination_items(supersedes_id) where kind='meeting' and status='proposed' and supersedes_id is not null;

create table public.konexa_coordination_events (
  id uuid primary key default gen_random_uuid(), item_id uuid not null references public.konexa_coordination_items(id),
  actor_id uuid not null references auth.users(id), action text not null, note text not null default '',
  version integer not null, created_at timestamptz not null default now(), unique(item_id,version)
);
create index konexa_coordination_events_actor_idx on public.konexa_coordination_events(actor_id);
alter table public.konexa_coordination_items enable row level security;
alter table public.konexa_coordination_events enable row level security;
revoke all on public.konexa_coordination_items,public.konexa_coordination_events from anon,authenticated;
grant select on public.konexa_coordination_items,public.konexa_coordination_events to authenticated;
grant all on public.konexa_coordination_items,public.konexa_coordination_events to service_role;
create policy coordination_participant_read on public.konexa_coordination_items for select to authenticated
  using (company_id=(select auth.uid()) or student_id=(select auth.uid()) or private.konexa_is_admin((select auth.uid())));
create policy coordination_event_read on public.konexa_coordination_events for select to authenticated
  using (exists(select 1 from public.konexa_coordination_items i where i.id=item_id));

create or replace function private.konexa_coordination_event(p_item public.konexa_coordination_items,p_actor uuid,p_action text,p_note text)
returns void language plpgsql security invoker set search_path='' as $$
declare recipient uuid;
begin
  insert into public.konexa_coordination_events(item_id,actor_id,action,note,version) values(p_item.id,p_actor,p_action,left(coalesce(p_note,''),4000),p_item.version);
  perform private.konexa_append_audit(p_actor,'coordination.'||p_action,'coordination',p_item.id::text,null,
    jsonb_build_object('kind',p_item.kind,'status',p_item.status,'version',p_item.version),p_item.id::text||':'||p_item.version);
  for recipient in select distinct x from unnest(array[p_item.company_id,p_item.student_id]) x where x<>p_actor loop
    perform private.konexa_enqueue_notification(recipient,'coordination_action',jsonb_build_object('itemId',p_item.id,'kind',p_item.kind,'status',p_item.status),
      'coordination:'||p_item.id||':'||p_item.version||':'||recipient);
  end loop;
  -- A newly filed support request reaches all current operations administrators.
  if p_item.kind='support' and p_action='created' then
    for recipient in select distinct owner_id from public.app_records where collection_name='users' and owner_id is not null and private.konexa_is_admin(owner_id) loop
      perform private.konexa_enqueue_notification(recipient,'coordination_action',jsonb_build_object('itemId',p_item.id,'kind',p_item.kind,'status','open'),
        'coordination:'||p_item.id||':'||p_item.version||':'||recipient);
    end loop;
  end if;
end $$;
revoke all on function private.konexa_coordination_event(public.konexa_coordination_items,uuid,text,text) from public,anon,authenticated;
grant execute on function private.konexa_coordination_event(public.konexa_coordination_items,uuid,text,text) to service_role;

create or replace function public.konexa_create_coordination_v4(p_actor uuid,p_key text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior jsonb; rel public.konexa_relationships; c public.konexa_contracts; old public.konexa_coordination_items;
  r public.konexa_coordination_items; k text:=p_payload->>'kind'; d jsonb:=p_payload->'details'; v_slots timestamptz[]:='{}'; slot timestamptz;
begin
  prior:=private.konexa_reserve_command(p_actor,'coordination.create',p_key,p_payload); if prior is not null then return prior; end if;
  select * into rel from public.konexa_relationships where id=(p_payload->>'relationshipId')::uuid for update;
  if rel.id is null then raise exception 'not_found'; end if;
  if p_actor not in (rel.company_id,rel.student_id) or coalesce(private.konexa_role(p_actor),'') not in ('company','student') then raise exception 'forbidden'; end if;
  if k not in ('meeting','change','support') or k is null or jsonb_typeof(d) is distinct from 'object' or length(trim(coalesce(p_payload->>'title',''))) not between 3 and 160 then raise exception 'invalid_payload'; end if;
  if k<>'support' and rel.status in ('cancelled','completed') then raise exception 'relationship_closed'; end if;
  if nullif(p_payload->>'contractId','') is not null then
    select * into c from public.konexa_contracts where id=(p_payload->>'contractId')::uuid;
    if c.id is null or c.relationship_id<>rel.id then raise exception 'not_found'; end if;
  end if;
  if k='meeting' then
    if jsonb_typeof(d->'slots') is distinct from 'array' or jsonb_array_length(d->'slots') not between 1 and 5
      or coalesce((d->>'durationMinutes')::integer,0) not between 15 and 120 then raise exception 'invalid_slots'; end if;
    select array_agg(distinct x::timestamptz order by x::timestamptz) into v_slots from jsonb_array_elements_text(d->'slots') x;
    foreach slot in array v_slots loop
      if slot is null or slot<clock_timestamp()+interval '5 minutes' or slot>clock_timestamp()+interval '180 days' then raise exception 'invalid_slots'; end if;
    end loop;
    if not exists(select 1 from pg_catalog.pg_timezone_names where name=d->>'timeZone') then raise exception 'invalid_timezone'; end if;
    if coalesce(d->>'meetingUrl','')<>'' and (rel.contact_status<>'unlocked' or (d->>'meetingUrl') !~ '^https://[^[:space:]<>]+$') then raise exception 'contact_locked'; end if;
    if rel.contact_status<>'unlocked' and (coalesce(d->>'note','')||' '||(p_payload->>'title')) ~* '(https?://|www\.|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|[0-9][0-9 ()+.-]{7,}[0-9])' then raise exception 'contact_locked'; end if;
    if length(coalesce(d->>'note',''))>2000 then raise exception 'invalid_payload'; end if;
    if nullif(d->>'supersedesId','') is not null then
      select * into old from public.konexa_coordination_items where id=(d->>'supersedesId')::uuid for update;
      if old.kind is distinct from 'meeting' or old.relationship_id<>rel.id or old.status<>'confirmed' or old.starts_at<=clock_timestamp() then raise exception 'invalid_reschedule'; end if;
    end if;
    -- Whitelist stored fields; the client cannot set accepted slots or actors.
    d:=jsonb_build_object('note',coalesce(d->>'note',''),'timeZone',d->>'timeZone','meetingUrl',coalesce(d->>'meetingUrl',''));
  elsif k='change' then
    if c.id is null or c.status in ('completed','cancelled','disputed') then raise exception 'contract_not_ready'; end if;
    if length(trim(coalesce(d->>'reason',''))) not between 10 and 2000 or length(trim(coalesce(d->>'deliverables',''))) not between 10 and 6000
      or length(trim(coalesce(d->>'schedule',''))) not between 5 and 2000 or (d->>'additionalAmountKrw') is null
      or (d->>'additionalAmountKrw') !~ '^[0-9]{1,10}$' or (d->>'additionalAmountKrw')::bigint>1000000000 then raise exception 'invalid_change'; end if;
    d:=jsonb_build_object('reason',trim(d->>'reason'),'deliverables',trim(d->>'deliverables'),'schedule',trim(d->>'schedule'),
      'additionalAmountKrw',(d->>'additionalAmountKrw')::bigint,'beforeScope',c.scope,'beforeAmountKrw',c.monthly_amount_krw,
      'baselineHash',md5(jsonb_build_object('scope',c.scope,'amount',c.monthly_amount_krw)::text),
      'requestedAt',clock_timestamp(),'requiresFormalAgreement',true);
  else
    if coalesce(d->>'caseType','') not in ('replacement','guarantee') or length(trim(coalesce(d->>'reason',''))) not between 20 and 4000 then raise exception 'invalid_support_case'; end if;
    d:=jsonb_build_object('caseType',d->>'caseType','reason',trim(d->>'reason'),'eligibility','manual_review_required');
  end if;
  insert into public.konexa_coordination_items(kind,relationship_id,contract_id,company_id,student_id,created_by,title,status,details,slots,duration_minutes,supersedes_id,due_at)
    values(k,rel.id,c.id,rel.company_id,rel.student_id,p_actor,trim(p_payload->>'title'),case when k='support' then 'open' else 'proposed' end,d,v_slots,
      case when k='meeting' then (p_payload->'details'->>'durationMinutes')::integer end,old.id,
      case when k='support' then clock_timestamp()+interval '7 days' end) returning * into r;
  perform private.konexa_coordination_event(r,p_actor,'created','');
  prior:=to_jsonb(r); perform private.konexa_complete_command(p_actor,'coordination.create',p_key,prior); return prior;
end $$;
revoke all on function public.konexa_create_coordination_v4(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.konexa_create_coordination_v4(uuid,text,jsonb) to service_role;

create or replace function public.konexa_update_coordination_v4(p_actor uuid,p_key text,p_id uuid,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior jsonb; r public.konexa_coordination_items; old public.konexa_coordination_items; c public.konexa_contracts;
  rel public.konexa_relationships; replacement public.konexa_relationships; a text:=p_payload->>'action'; note text:=trim(coalesce(p_payload->>'note',''));
  is_admin boolean:=coalesce(private.konexa_is_admin(p_actor),false); chosen timestamptz; lock_user uuid;
begin
  prior:=private.konexa_reserve_command(p_actor,'coordination.update',p_key,jsonb_build_object('id',p_id,'payload',p_payload)); if prior is not null then return prior; end if;
  select * into r from public.konexa_coordination_items where id=p_id for update;
  if r.id is null then raise exception 'not_found'; end if;
  if p_actor not in (r.company_id,r.student_id) and not is_admin then raise exception 'not_found'; end if;
  if coalesce((p_payload->>'version')::integer,0)<>r.version then raise exception 'stale_version'; end if;
  if length(note)>4000 then raise exception 'invalid_note'; end if;
  select * into rel from public.konexa_relationships where id=r.relationship_id;
  if r.kind='meeting' then
    if is_admin then raise exception 'participant_action_required'; end if;
    if a='confirm' then
      if r.status<>'proposed' or p_actor=r.created_by or rel.status in ('cancelled','completed') then raise exception 'invalid_transition'; end if;
      chosen:=(p_payload->>'slot')::timestamptz;
      if chosen is null or not (chosen=any(r.slots)) or chosen<=clock_timestamp() then raise exception 'invalid_slots'; end if;
      -- Serialize all acceptances involving either participant, in a stable order.
      for lock_user in select x from unnest(array[r.company_id,r.student_id]) x order by x loop
        perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lock_user::text,7401));
      end loop;
      if exists(select 1 from public.konexa_coordination_items i where i.kind='meeting' and i.status='confirmed'
        and i.id<>r.id and (r.supersedes_id is null or i.id<>r.supersedes_id)
        and (i.company_id in (r.company_id,r.student_id) or i.student_id in (r.company_id,r.student_id))
        and i.starts_at<chosen+make_interval(mins=>r.duration_minutes) and i.ends_at>chosen) then raise exception 'meeting_conflict'; end if;
      if r.supersedes_id is not null then
        select * into old from public.konexa_coordination_items where id=r.supersedes_id for update;
        if old.status<>'confirmed' or old.starts_at<=clock_timestamp() then raise exception 'invalid_reschedule'; end if;
        update public.konexa_coordination_items set status='rescheduled',version=version+1,updated_at=clock_timestamp() where id=old.id returning * into old;
        perform private.konexa_coordination_event(old,p_actor,'rescheduled','');
      end if;
      r.status:='confirmed'; r.starts_at:=chosen; r.ends_at:=chosen+make_interval(mins=>r.duration_minutes); r.due_at:=chosen;
    elsif a='decline' then
      if r.status<>'proposed' or p_actor=r.created_by or length(note)<5 then raise exception 'invalid_transition'; end if;
      r.status:='declined';
    elsif a='cancel' then
      if r.status not in ('proposed','confirmed') or (r.status='proposed' and p_actor<>r.created_by) or length(note)<5 then raise exception 'invalid_transition'; end if;
      r.status:='cancelled';
    elsif a='complete' then
      if r.status<>'confirmed' or r.ends_at>clock_timestamp() then raise exception 'invalid_transition'; end if;
      r.status:='completed';
    else raise exception 'invalid_transition'; end if;
  elsif r.kind='change' then
    if is_admin then raise exception 'participant_action_required'; end if;
    if r.status<>'proposed' then raise exception 'invalid_transition'; end if;
    if a='agree' then
      if p_actor=r.created_by or (p_payload->>'acknowledged') is distinct from 'true' then raise exception 'acknowledgement_required'; end if;
      select * into c from public.konexa_contracts where id=r.contract_id for update;
      if c.status in ('completed','cancelled','disputed') then raise exception 'contract_not_ready'; end if;
      if md5(jsonb_build_object('scope',c.scope,'amount',c.monthly_amount_krw)::text)<>r.details->>'baselineHash' then raise exception 'stale_contract'; end if;
      r.status:='agreed'; r.details:=r.details||jsonb_build_object('agreedBy',p_actor,'agreedAt',clock_timestamp());
    elsif a='reject' and p_actor<>r.created_by and length(note)>=5 then r.status:='rejected';
    elsif a='withdraw' and p_actor=r.created_by and length(note)>=5 then r.status:='withdrawn';
    else raise exception 'invalid_transition'; end if;
  else
    if a='close' and p_actor=r.created_by and r.status in ('open','resolved','rejected') and length(note)>=5 then r.status:='closed';
    elsif is_admin and a in ('in_review','matching','proposal_sent','resolved','rejected') then
      if r.status='closed' or (r.status in ('resolved','rejected') and a<>'in_review') or length(note)<20 then raise exception 'invalid_transition'; end if;
      if a='proposal_sent' then
        select * into replacement from public.konexa_relationships where id=nullif(p_payload->>'replacementRelationshipId','')::uuid;
        if replacement.id is null or replacement.company_id<>r.company_id or replacement.student_id=r.student_id or replacement.status in ('cancelled','completed') then raise exception 'invalid_replacement'; end if;
        r.details:=r.details||jsonb_build_object('replacementRelationshipId',replacement.id);
      end if;
      r.status:=a; r.details:=r.details||jsonb_build_object('assignedAdminId',p_actor,'resolution',note);
      if nullif(p_payload->>'dueAt','') is not null then
        r.due_at:=(p_payload->>'dueAt')::timestamptz;
        if r.due_at<=clock_timestamp() or r.due_at>clock_timestamp()+interval '180 days' then raise exception 'invalid_deadline'; end if;
      end if;
    else raise exception 'forbidden'; end if;
  end if;
  update public.konexa_coordination_items set status=r.status,details=r.details,starts_at=r.starts_at,ends_at=r.ends_at,due_at=r.due_at,version=version+1,updated_at=clock_timestamp() where id=r.id returning * into r;
  perform private.konexa_coordination_event(r,p_actor,a,note);
  prior:=to_jsonb(r); perform private.konexa_complete_command(p_actor,'coordination.update',p_key,prior); return prior;
end $$;
revoke all on function public.konexa_update_coordination_v4(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.konexa_update_coordination_v4(uuid,text,uuid,jsonb) to service_role;

create or replace function public.konexa_queue_coordination_reminders_v4()
returns integer language plpgsql security invoker set search_path='' as $$
declare r record; recipient uuid; n integer:=0;
begin
  for r in select * from public.konexa_coordination_items where
    (kind='meeting' and status='confirmed' and starts_at>clock_timestamp() and starts_at<clock_timestamp()+interval '25 hours') or
    (kind='support' and status in ('open','in_review','matching','proposal_sent') and due_at<clock_timestamp()+interval '24 hours')
    order by due_at limit 200 loop
    for recipient in select distinct x from unnest(array[r.company_id,r.student_id]) x loop
      perform private.konexa_enqueue_notification(recipient,'coordination_action',jsonb_build_object('itemId',r.id,'kind',r.kind,'status',case when r.kind='meeting' then 'reminder' else 'follow_up_due' end),
        'coordination-reminder:'||r.id||':'||r.version||':'||recipient||':'||to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD'));
      n:=n+1;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function public.konexa_queue_coordination_reminders_v4() from public,anon,authenticated;
grant execute on function public.konexa_queue_coordination_reminders_v4() to service_role;
