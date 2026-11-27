-- Haydovchi hujjatlari uchun YOPIQ bucket: 5 MB, faqat rasm formatlari.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'driver-documents',
  'driver-documents',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Faqat o'z papkasiga ('{user_id}/...') yuklash.
create policy "driver_documents_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'driver-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Faqat o'z fayllarini o'qish.
create policy "driver_documents_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'driver-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Boshqa hamma amallar (update/delete) va anon uchun siyosat yo'q, ya'ni yopiq.