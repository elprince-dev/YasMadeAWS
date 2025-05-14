/*
  # Create storage bucket for images

  1. Storage
    - Create 'images' bucket for storing uploaded images if it doesn't exist
    - Create 'email-images' folder for newsletter images
  
  2. Security
    - Enable public access to read images
    - Allow authenticated users to upload images
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'images'
  ) THEN
    insert into storage.buckets (id, name, public)
    values ('images', 'images', true);
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload session images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update session images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete session images" ON storage.objects;

-- Policy to allow public access to read images
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'images' );

-- Policy to allow authenticated users to upload session images
create policy "Allow authenticated users to upload session images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] IN ('sessions', 'email-images')
);

-- Policy to allow authenticated users to update their uploaded images
create policy "Allow authenticated users to update session images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] IN ('sessions', 'email-images')
) 
with check (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] IN ('sessions', 'email-images')
);

-- Policy to allow authenticated users to delete their uploaded images
create policy "Allow authenticated users to delete session images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] IN ('sessions', 'email-images')
);