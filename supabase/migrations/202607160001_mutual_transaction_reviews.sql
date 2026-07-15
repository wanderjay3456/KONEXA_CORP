-- Verified, double-blind reviews for paid KONEXA relationships.

create unique index if not exists app_records_review_once_per_relationship
  on public.app_records ((data->>'relationshipId'), (data->>'reviewerId'))
  where collection_name = 'reviews';

create index if not exists app_records_review_relationship_status
  on public.app_records ((data->>'relationshipId'), (data->>'status'))
  where collection_name = 'reviews';

create or replace function private.validate_transaction_review()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor uuid := auth.uid();
  relationship jsonb;
  expected_reviewee text;
  rating_key text;
  rating_value integer;
begin
  if new.collection_name <> 'reviews' then return new; end if;
  if actor is null or new.owner_id <> actor or new.data->>'reviewerId' <> actor::text then
    raise exception 'reviewer_identity_mismatch';
  end if;

  select data into relationship
  from public.app_records
  where collection_name = 'introductions' and record_id = new.data->>'relationshipId';

  if relationship is null then raise exception 'relationship_not_found'; end if;
  if relationship->>'companyId' = actor::text then
    expected_reviewee := relationship->>'talentId';
    if new.data->>'reviewerRole' <> 'company' then raise exception 'reviewer_role_mismatch'; end if;
  elsif relationship->>'talentId' = actor::text then
    expected_reviewee := relationship->>'companyId';
    if new.data->>'reviewerRole' <> 'student' then raise exception 'reviewer_role_mismatch'; end if;
  else
    raise exception 'not_a_relationship_party';
  end if;
  if expected_reviewee is null or new.data->>'revieweeId' <> expected_reviewee then raise exception 'reviewee_mismatch'; end if;

  if not exists (
    select 1 from public.app_records
    where collection_name = 'payment_records'
      and data->>'relationshipId' = new.data->>'relationshipId'
      and data->>'status' in ('paid', 'funds_secured')
      and coalesce((data->>'amountMatches')::boolean, true)
  ) then raise exception 'verified_payment_required'; end if;

  foreach rating_key in array array['overallRating','qualityRating','communicationRating','reliabilityRating','scopeClarityRating'] loop
    begin rating_value := (new.data->>rating_key)::integer;
    exception when others then raise exception 'invalid_rating'; end;
    if rating_value < 1 or rating_value > 5 then raise exception 'invalid_rating'; end if;
  end loop;
  if char_length(trim(coalesce(new.data->>'comment', ''))) not between 20 and 1000 then raise exception 'invalid_review_length'; end if;

  new.data := new.data || jsonb_build_object(
    'userId', actor::text, 'reviewerId', actor::text, 'revieweeId', expected_reviewee,
    'status', 'sealed', 'moderationStatus', 'pending', 'appealStatus', 'none'
  );
  return new;
end;
$$;

create or replace function private.publish_mutual_transaction_reviews()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.collection_name = 'reviews' and (
    select count(distinct data->>'reviewerId') >= 2
    from public.app_records
    where collection_name = 'reviews' and data->>'relationshipId' = new.data->>'relationshipId'
  ) then
    update public.app_records
    set data = data || jsonb_build_object('status', 'published', 'publishedAt', (extract(epoch from clock_timestamp()) * 1000)::bigint),
        updated_at = clock_timestamp()
    where collection_name = 'reviews' and data->>'relationshipId' = new.data->>'relationshipId';
  end if;
  return new;
end;
$$;

drop trigger if exists app_records_validate_transaction_review on public.app_records;
create trigger app_records_validate_transaction_review
before insert on public.app_records
for each row execute function private.validate_transaction_review();

drop trigger if exists app_records_publish_mutual_reviews on public.app_records;
create trigger app_records_publish_mutual_reviews
after insert on public.app_records
for each row execute function private.publish_mutual_transaction_reviews();

create or replace function private.can_update_app_record(c text, d jsonb, record_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select (select auth.uid()) is not null and (
    private.konexa_is_admin((select auth.uid()))
    or (
      c not in ('users','student_profiles','company_profiles','projects','applications','consents','introductions','contracts','contract_signatures','payment_records','contact_unlocks','risk_events','reviews','work_passport_entries')
      and record_owner = (select auth.uid())
    )
    or (
      c = 'applications'
      and d->>'companyId' = (select auth.uid())::text
      and private.konexa_role((select auth.uid())) = 'company'
    )
  );
$$;

revoke all on function private.validate_transaction_review() from public, anon, authenticated;
revoke all on function private.publish_mutual_transaction_reviews() from public, anon, authenticated;
