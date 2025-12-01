-- Create storage bucket for ads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ads-storage',
  'ads-storage',
  true, -- Bucket público para os anúncios
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Allow authenticated users to upload ads" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ads-storage');

CREATE POLICY "Allow public to view ads" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ads-storage');

