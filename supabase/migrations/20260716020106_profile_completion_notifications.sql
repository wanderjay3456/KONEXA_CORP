-- Prevent incomplete profiles from being marked ready and create durable notifications.

create or replace function private.validate_konexa_profile_completion()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  d jsonb := new.data;
  missing text[] := array[]::text[];
begin
  if new.collection_name not in ('student_profiles', 'company_profiles')
    or not coalesce((d->>'onboardingCompleted')::boolean, false) then
    return new;
  end if;

  if new.owner_id is null or new.record_id <> new.owner_id::text then
    raise exception using message = 'KONEXA_PROFILE_OWNER_MISMATCH';
  end if;

  if new.collection_name = 'student_profiles' then
    if nullif(btrim(d->>'name'), '') is null then missing := array_append(missing, 'name'); end if;
    if nullif(btrim(d->>'nationality'), '') is null then missing := array_append(missing, 'nationality'); end if;
    if nullif(btrim(d->>'currentCountry'), '') is null then missing := array_append(missing, 'currentCountry'); end if;
    if nullif(btrim(d->>'timezone'), '') is null then missing := array_append(missing, 'timezone'); end if;
    if nullif(btrim(d->>'university'), '') is null then missing := array_append(missing, 'university'); end if;
    if nullif(btrim(d->>'degree'), '') is null then missing := array_append(missing, 'degree'); end if;
    if nullif(btrim(d->>'major'), '') is null then missing := array_append(missing, 'major'); end if;
    if nullif(btrim(d->>'graduationYear'), '') is null then missing := array_append(missing, 'graduationYear'); end if;
    if nullif(btrim(d->>'englishLevel'), '') is null then missing := array_append(missing, 'englishLevel'); end if;
    if jsonb_typeof(d->'skills') <> 'array' or jsonb_array_length(d->'skills') = 0 then missing := array_append(missing, 'skills'); end if;
    if nullif(btrim(d->>'github'), '') is null and nullif(btrim(d->>'portfolio'), '') is null then missing := array_append(missing, 'github_or_portfolio'); end if;
    if nullif(btrim(d->>'preferredJob'), '') is null then missing := array_append(missing, 'preferredJob'); end if;
    if nullif(btrim(d->>'availability'), '') is null then missing := array_append(missing, 'availability'); end if;
    if coalesce(d->>'preferredWeeklyPayKrw', '') !~ '^[0-9]+([.][0-9]+)?$'
      or coalesce((d->>'preferredWeeklyPayKrw')::numeric, 0) <= 0 then missing := array_append(missing, 'preferredWeeklyPayKrw'); end if;
    if nullif(btrim(d->>'bio'), '') is null then missing := array_append(missing, 'bio'); end if;
    if nullif(btrim(d->>'identityDocumentPath'), '') is null then missing := array_append(missing, 'identityDocumentPath'); end if;
    if nullif(btrim(d->>'resumeUrl'), '') is null then missing := array_append(missing, 'resumeUrl'); end if;
  else
    if nullif(btrim(d->>'companyName'), '') is null then missing := array_append(missing, 'companyName'); end if;
    if nullif(btrim(d->>'businessRegistrationNumber'), '') is null then missing := array_append(missing, 'businessRegistrationNumber'); end if;
    if nullif(btrim(d->>'country'), '') is null then missing := array_append(missing, 'country'); end if;
    if nullif(btrim(d->>'industry'), '') is null then missing := array_append(missing, 'industry'); end if;
    if nullif(btrim(d->>'companySize'), '') is null then missing := array_append(missing, 'companySize'); end if;
    if nullif(btrim(d->>'website'), '') is null then missing := array_append(missing, 'website'); end if;
    if nullif(btrim(d->>'officeLocation'), '') is null then missing := array_append(missing, 'officeLocation'); end if;
    if nullif(btrim(d->>'contactPerson'), '') is null then missing := array_append(missing, 'contactPerson'); end if;
    if nullif(btrim(d->>'position'), '') is null then missing := array_append(missing, 'position'); end if;
    if nullif(btrim(d->>'corporateEmail'), '') is null then missing := array_append(missing, 'corporateEmail'); end if;
    if nullif(btrim(d->>'phoneNumber'), '') is null then missing := array_append(missing, 'phoneNumber'); end if;
    if nullif(btrim(d->>'companyIntroduction'), '') is null then missing := array_append(missing, 'companyIntroduction'); end if;
    if jsonb_typeof(d->'requiredSkills') <> 'array' or jsonb_array_length(d->'requiredSkills') = 0 then missing := array_append(missing, 'requiredSkills'); end if;
    if nullif(btrim(d->>'businessRegistrationDocumentPath'), '') is null then missing := array_append(missing, 'businessRegistrationDocumentPath'); end if;
  end if;

  if cardinality(missing) > 0 then
    raise exception using message = 'KONEXA_PROFILE_INCOMPLETE:' || array_to_string(missing, ',');
  end if;
  return new;
end;
$$;

drop trigger if exists app_records_validate_profile_completion on public.app_records;
create trigger app_records_validate_profile_completion
before insert or update on public.app_records
for each row execute function private.validate_konexa_profile_completion();

create or replace function private.create_konexa_notification(
  recipient_text text,
  notification_kind text,
  notification_title text,
  notification_message text,
  source_type text,
  source_id text,
  destination_tab text default null
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  recipient uuid;
  created_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000);
begin
  if recipient_text is null or recipient_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then return; end if;
  recipient := recipient_text::uuid;
  if not exists (select 1 from auth.users where id = recipient) then return; end if;

  insert into public.app_records(collection_name, record_id, owner_id, data, is_public)
  values (
    'notifications', gen_random_uuid()::text, recipient,
    jsonb_strip_nulls(jsonb_build_object(
      'recipientId', recipient::text,
      'kind', notification_kind,
      'title', notification_title,
      'message', notification_message,
      'entityType', source_type,
      'entityId', source_id,
      'actionTab', destination_tab,
      'createdAt', created_ms,
      'readAt', null
    )), false
  );
end;
$$;

create or replace function private.notify_konexa_record_event()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  d jsonb := new.data;
  old_d jsonb := case when tg_op = 'UPDATE' then old.data else '{}'::jsonb end;
  status_text text := coalesce(d->>'status', 'updated');
begin
  if new.collection_name = 'notifications' then return new; end if;

  if new.collection_name in ('student_profiles', 'company_profiles')
    and coalesce((d->>'onboardingCompleted')::boolean, false)
    and not coalesce((old_d->>'onboardingCompleted')::boolean, false) then
    perform private.create_konexa_notification(
      new.owner_id::text, 'verification', '필수정보 등록 완료',
      case when new.collection_name = 'student_profiles'
        then '학적 증빙과 이력서가 안전하게 등록되었습니다. 검증 상태가 변경되면 알려드립니다.'
        else '사업자등록증과 기업 정보가 안전하게 등록되었습니다. 검증 상태가 변경되면 알려드립니다.' end,
      new.collection_name, new.record_id, 'profile'
    );
  end if;

  if new.collection_name = 'projects' and tg_op = 'INSERT' then
    perform private.create_konexa_notification(d->>'companyId', 'project', '프로젝트 등록 완료', coalesce(d->>'title', '프로젝트') || ' 프로젝트가 등록되었습니다.', 'projects', new.record_id, 'create-challenge');
  elsif new.collection_name = 'applications' then
    if tg_op = 'INSERT' then
      perform private.create_konexa_notification(d->>'companyId', 'application', '새 지원자가 도착했습니다', coalesce(d->>'studentName', '지원자') || '님이 ' || coalesce(d->>'projectTitle', '프로젝트') || '에 지원했습니다.', 'applications', new.record_id, 'company-applications');
      perform private.create_konexa_notification(d->>'studentId', 'application', '지원서 제출 완료', coalesce(d->>'projectTitle', '프로젝트') || ' 지원서가 안전하게 접수되었습니다.', 'applications', new.record_id, 'project-marketplace');
    elsif coalesce(old_d->>'status', '') is distinct from status_text then
      perform private.create_konexa_notification(d->>'studentId', 'application', '지원 상태가 변경되었습니다', coalesce(d->>'projectTitle', '프로젝트') || ' 지원 상태: ' || status_text, 'applications', new.record_id, 'project-marketplace');
    end if;
  elsif new.collection_name in ('contracts', 'hiring_offers') and tg_op = 'INSERT' then
    perform private.create_konexa_notification(d->>'companyId', 'contract', '계약 절차가 시작되었습니다', '계약 내용을 확인하고 필요한 서명을 진행해 주세요.', new.collection_name, new.record_id, 'trust-operations');
    perform private.create_konexa_notification(coalesce(d->>'talentId', d->>'studentId'), 'contract', '새 계약 요청이 도착했습니다', '계약 내용을 확인하고 필요한 서명을 진행해 주세요.', new.collection_name, new.record_id, 'trust-operations');
  elsif new.collection_name = 'payment_records'
    and (tg_op = 'INSERT' or coalesce(old_d->>'status', '') is distinct from status_text) then
    perform private.create_konexa_notification(d->>'companyId', 'payment', '결제 상태가 변경되었습니다', '결제 상태: ' || status_text, 'payment_records', new.record_id, 'trust-operations');
    perform private.create_konexa_notification(coalesce(d->>'talentId', d->>'studentId'), 'payment', '정산 상태가 변경되었습니다', '정산 상태: ' || status_text, 'payment_records', new.record_id, 'trust-operations');
  elsif new.collection_name = 'reviews' and coalesce(d->>'status', '') = 'published'
    and coalesce(old_d->>'status', '') is distinct from 'published' then
    perform private.create_konexa_notification(d->>'revieweeId', 'review', '거래 리뷰가 공개되었습니다', '검증된 거래 리뷰가 프로필에 반영되었습니다.', 'reviews', new.record_id, 'trust-operations');
  end if;
  return new;
end;
$$;

drop trigger if exists app_records_create_notifications on public.app_records;
create trigger app_records_create_notifications
after insert or update on public.app_records
for each row execute function private.notify_konexa_record_event();

revoke all on function private.validate_konexa_profile_completion() from public, anon, authenticated;
revoke all on function private.create_konexa_notification(text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function private.notify_konexa_record_event() from public, anon, authenticated;
