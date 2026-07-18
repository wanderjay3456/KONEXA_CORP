insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-intro-videos',
  'student-intro-videos',
  false,
  104857600,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.konexa_can_view_intro_video(
  video_student_id text,
  target_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select
    target_user is not null
    and (
      target_user::text = video_student_id
      or private.konexa_role(target_user) = 'admin'
      or exists (
        select 1
        from public.app_records application
        where application.collection_name = 'applications'
          and application.data->>'studentId' = video_student_id
          and application.data->>'companyId' = target_user::text
          and application.data->>'status' = 'approved'
      )
    );
$$;

revoke all on function private.konexa_can_view_intro_video(text, uuid) from public;
grant execute on function private.konexa_can_view_intro_video(text, uuid) to authenticated;

drop policy if exists konexa_intro_video_insert_own on storage.objects;
create policy konexa_intro_video_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-intro-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists konexa_intro_video_update_own on storage.objects;
create policy konexa_intro_video_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-intro-videos'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'student-intro-videos'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists konexa_intro_video_delete_own on storage.objects;
create policy konexa_intro_video_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'student-intro-videos'
  and owner_id = (select auth.uid())::text
);

drop policy if exists konexa_intro_video_select_authorized on storage.objects;
create policy konexa_intro_video_select_authorized
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-intro-videos'
  and private.konexa_can_view_intro_video(
    (storage.foldername(name))[1],
    (select auth.uid())
  )
);
