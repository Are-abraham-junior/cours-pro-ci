-- 1. Ajouter la colonne audio_url à la table messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 2. Créer le bucket 'chat_audios' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_audios', 'chat_audios', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Sécuriser le bucket (Policies)
-- Les utilisateurs authentifiés peuvent uploader des fichiers dans ce bucket
CREATE POLICY "Authenticated users can upload audio files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat_audios');

-- Tout le monde peut lire les fichiers de ce bucket public (ou limiter aux authentifiés)
CREATE POLICY "Authenticated users can read audio files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat_audios');

-- Les utilisateurs peuvent supprimer leurs propres fichiers (optionnel)
CREATE POLICY "Users can delete their own audio files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'chat_audios' AND auth.uid() = owner);
