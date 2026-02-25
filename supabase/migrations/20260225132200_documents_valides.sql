-- Ajouter le champ documents_valides à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS documents_valides boolean DEFAULT false;

-- Commentaire explicatif
COMMENT ON COLUMN public.profiles.documents_valides IS 'True si l admin a validé les documents (CNI + diplômes) du répétiteur';
