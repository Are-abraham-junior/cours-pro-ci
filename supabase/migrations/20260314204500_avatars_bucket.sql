-- 1. Créer le bucket 'avatars' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Sécuriser le bucket (Policies)

-- Autoriser la lecture publique (tout le monde peut voir les avatars)
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Autoriser l'upload pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Les utilisateurs peuvent mettre à jour leurs propres avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (regexp_match(name, '^([^/]+)'))[1]);

-- Les utilisateurs peuvent supprimer leurs propres avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (regexp_match(name, '^([^/]+)'))[1]);
