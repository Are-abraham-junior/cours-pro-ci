-- Ajouter les coordonnées GPS pour la recherche sur carte
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Les parents (clients) peuvent lister tous les profils des répétiteurs (prestataires) qui sont complets,
-- afin de pouvoir les afficher sur la carte de recherche
CREATE POLICY "Clients can view complete prestataire profiles"
ON public.profiles
FOR SELECT
USING (
  public.is_client(auth.uid()) 
  AND public.is_prestataire(id) 
  AND profil_complet = true
);
