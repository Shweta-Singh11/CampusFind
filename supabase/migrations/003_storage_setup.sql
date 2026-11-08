-- ============================================================
-- Migration: 003_storage_setup.sql
-- Creates Supabase Storage buckets and sets RLS policies for uploads
-- ============================================================

-- 1. Create the storage buckets if they do not exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('item-photos-public', 'item-photos-public', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('restricted-files', 'restricted-files', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Drop any prior existing storage policies to ensure clean state
drop policy if exists "Public read item-photos-public" on storage.objects;
drop policy if exists "Anyone can upload to item-photos-public" on storage.objects;
drop policy if exists "Admin upload to item-photos-public" on storage.objects;
drop policy if exists "Anon upload claim proofs" on storage.objects;
drop policy if exists "Anon upload restricted files" on storage.objects;
drop policy if exists "Anyone can upload to restricted-files" on storage.objects;
drop policy if exists "Admin full access restricted-files" on storage.objects;
drop policy if exists "Admin manage restricted-files" on storage.objects;
drop policy if exists "Admin read restricted-files" on storage.objects;
drop policy if exists "Admin manage item-photos-public" on storage.objects;

-- 3. Policy: Public read for item-photos-public (anyone can view normal item photos)
create policy "Public read item-photos-public"
  on storage.objects for select
  using (bucket_id = 'item-photos-public');

-- 4. Policy: Anyone (students and admins) can upload photos to item-photos-public
create policy "Anyone can upload to item-photos-public"
  on storage.objects for insert
  with check (bucket_id = 'item-photos-public');

-- 5. Policy: Allow uploads to restricted-files (claim proofs, high-value item photos, return evidence)
create policy "Anyone can upload to restricted-files"
  on storage.objects for insert
  with check (bucket_id = 'restricted-files');

-- 6. Policy: Allow authenticated administrators to read files in restricted-files
create policy "Admin read restricted-files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'restricted-files' and is_admin());

-- 7. Policy: Allow authenticated administrators to manage (update/delete) files in restricted-files
create policy "Admin manage restricted-files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'restricted-files' and is_admin())
  with check (bucket_id = 'restricted-files' and is_admin());

-- 8. Policy: Allow authenticated administrators to manage item-photos-public
create policy "Admin manage item-photos-public"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'item-photos-public' and is_admin())
  with check (bucket_id = 'item-photos-public' and is_admin());

