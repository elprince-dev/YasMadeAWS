-- Create gallery_images table
CREATE TABLE gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Gallery images are viewable by everyone" ON gallery_images
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert gallery images" ON gallery_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update gallery images" ON gallery_images
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete gallery images" ON gallery_images
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket policy for gallery folder (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for gallery folder
CREATE POLICY "Gallery images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'images' AND (storage.foldername(name))[1] = 'gallery');

CREATE POLICY "Authenticated users can upload gallery images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' 
    AND (storage.foldername(name))[1] = 'gallery'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete gallery images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' 
    AND (storage.foldername(name))[1] = 'gallery'
    AND auth.role() = 'authenticated'
  );