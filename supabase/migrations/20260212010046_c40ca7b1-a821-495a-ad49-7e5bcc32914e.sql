
-- Create storage bucket for diplomas
INSERT INTO storage.buckets (id, name, public)
VALUES ('diplomas', 'diplomas', true);

-- Allow authenticated users to upload their own diplomas
CREATE POLICY "Users can upload their own diplomas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'diplomas'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own diplomas
CREATE POLICY "Users can update their own diplomas"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'diplomas'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own diplomas
CREATE POLICY "Users can delete their own diplomas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'diplomas'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to diplomas
CREATE POLICY "Diplomas are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'diplomas');
