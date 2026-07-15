-- Private buckets for identity documents and project artifacts.
-- Every object path starts with the authenticated user's UUID.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-media', 'profile-media', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('resumes', 'resumes', false, 5242880, array['application/pdf']),
  ('business-documents', 'business-documents', false, 10485760, array['application/pdf','image/jpeg','image/png']),
  ('project-deliverables', 'project-deliverables', false, 52428800, array['application/pdf','application/zip','text/plain','image/jpeg','image/png','application/json'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "konexa_storage_insert_own" on storage.objects;
create policy "konexa_storage_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('profile-media','resumes','business-documents','project-deliverables')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "konexa_storage_select_authorized" on storage.objects;
create policy "konexa_storage_select_authorized"
on storage.objects for select to authenticated
using (
  bucket_id in ('profile-media','resumes','business-documents','project-deliverables')
  and (
    owner_id = (select auth.uid()::text)
    or private.konexa_role() = 'admin'
    or (
      bucket_id = 'resumes'
      and exists (
        select 1 from public.app_records unlock
        where unlock.collection_name = 'contact_unlocks'
          and unlock.data->>'companyId' = (select auth.uid()::text)
          and unlock.data->>'talentId' = (storage.foldername(storage.objects.name))[1]
          and unlock.data->>'status' = 'unlocked'
      )
    )
  )
);

drop policy if exists "konexa_storage_update_own" on storage.objects;
create policy "konexa_storage_update_own"
on storage.objects for update to authenticated
using (owner_id = (select auth.uid()::text))
with check (
  owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "konexa_storage_delete_own" on storage.objects;
create policy "konexa_storage_delete_own"
on storage.objects for delete to authenticated
using (owner_id = (select auth.uid()::text));
