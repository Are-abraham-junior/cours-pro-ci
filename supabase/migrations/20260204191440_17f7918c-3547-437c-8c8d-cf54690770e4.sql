-- Ajout des champs pour le profil enrichi des répétiteurs
-- Ces champs sont nullable car seuls les répétiteurs les rempliront

-- Biographie du répétiteur
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Matières enseignées (tableau)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS matieres TEXT[] DEFAULT '{}';

-- Niveaux scolaires (tableau)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS niveaux TEXT[] DEFAULT '{}';

-- Disponibilités (tableau de jours/créneaux)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS disponibilites TEXT[] DEFAULT '{}';

-- Localisation / quartier
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS localisation TEXT;

-- Tarif horaire indicatif (en FCFA)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tarif_horaire INTEGER;

-- Années d'expérience
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience_annees INTEGER DEFAULT 0;

-- Indique si le profil répétiteur est complet et visible
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profil_complet BOOLEAN DEFAULT false;

-- Politique RLS pour permettre aux parents de voir le profil des répétiteurs qui ont postulé à leurs offres
CREATE POLICY "Parents can view applicant profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN offers o ON o.id = a.offer_id
    WHERE a.repetiteur_id = profiles.id
    AND o.parent_id = auth.uid()
  )
);

-- Politique pour permettre aux répétiteurs de voir les profils publics d'autres répétiteurs (optionnel, pour le réseau)
-- CREATE POLICY "Repetiteurs can view other repetiteur profiles" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (
--   is_prestataire(auth.uid()) 
--   AND is_prestataire(id) 
--   AND profil_complet = true
-- );