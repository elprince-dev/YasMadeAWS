/*
  # Create storage bucket for images

  1. Storage
    - Create 'images' bucket for storing uploaded images
  
  2. Security
    - Enable public access to read images
    - Allow authenticated users to upload images to the 'sessions' folder
*/

-- Create the storage bucket
insert into storage.buckets (id, name, public)
values ('images', 'images', true);

-- Policy to allow public access to read images
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'images' );

-- Policy to allow authenticated users to upload images to the sessions folder
create policy "Allow authenticated users to upload session images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'sessions'
);

-- Policy to allow authenticated users to update their uploaded images
create policy "Allow authenticated users to update session images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'sessions'
) 
with check (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'sessions'
);

-- Policy to allow authenticated users to delete their uploaded images
create policy "Allow authenticated users to delete session images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'sessions'
);