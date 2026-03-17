-- Politique pour permettre aux répétiteurs de voir le profil des parents qui ont publié des offres ouvertes
CREATE POLICY "Prestataires can view profile of open offer publishers"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.parent_id = profiles.id
    AND o.statut = 'ouverte'
  )
);

-- Politique pour s'assurer que les participants d'un contrat peuvent toujours voir le profil de l'autre
CREATE POLICY "Contract participants can view each other profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE (c.parent_id = auth.uid() AND c.repetiteur_id = profiles.id)
       OR (c.repetiteur_id = auth.uid() AND c.parent_id = profiles.id)
  )
);
