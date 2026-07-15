insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'identity-documents',
  'identity-documents',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "konexa_identity_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'identity-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "konexa_identity_select_own_or_admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'identity-documents'
  and (owner_id = (select auth.uid()::text) or private.konexa_role() = 'admin')
);

create policy "konexa_identity_update_own"
on storage.objects for update to authenticated
using (bucket_id = 'identity-documents' and owner_id = (select auth.uid()::text))
with check (
  bucket_id = 'identity-documents'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "konexa_identity_delete_own"
on storage.objects for delete to authenticated
using (bucket_id = 'identity-documents' and owner_id = (select auth.uid()::text));
