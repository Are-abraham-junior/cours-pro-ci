
-- Create storage bucket for CNI (Carte Nationale d'Identité)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cni', 'cni', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own CNI
CREATE POLICY "Users can upload their own CNI"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cni'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own CNI
CREATE POLICY "Users can update their own CNI"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cni'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own CNI
CREATE POLICY "Users can delete their own CNI"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cni'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to CNI files
CREATE POLICY "CNI files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'cni');
