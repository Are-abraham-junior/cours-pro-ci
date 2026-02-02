-- Enums pour les statuts
CREATE TYPE public.offer_status AS ENUM ('ouverte', 'en_cours', 'fermee');
CREATE TYPE public.application_status AS ENUM ('en_attente', 'acceptee', 'refusee');

-- Table des offres de cours
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  matiere TEXT NOT NULL,
  niveau TEXT NOT NULL,
  description TEXT NOT NULL,
  adresse TEXT NOT NULL,
  frequence TEXT NOT NULL,
  budget_min INTEGER NOT NULL DEFAULT 5000,
  budget_max INTEGER NOT NULL DEFAULT 50000,
  statut public.offer_status NOT NULL DEFAULT 'ouverte',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des candidatures
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  repetiteur_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  statut public.application_status NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(offer_id, repetiteur_id)
);

-- Triggers pour updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour vérifier si un user est client (parent)
CREATE OR REPLACE FUNCTION public.is_client(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'client'
  )
$$;

-- Fonction helper pour vérifier si un user est prestataire (répétiteur)
CREATE OR REPLACE FUNCTION public.is_prestataire(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'prestataire'
  )
$$;

-- ========== RLS POLICIES FOR OFFERS ==========

-- Parents peuvent créer des offres
CREATE POLICY "Parents can create offers"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = parent_id 
  AND is_client(auth.uid())
);

-- Parents peuvent voir leurs propres offres
CREATE POLICY "Parents can view own offers"
ON public.offers
FOR SELECT
TO authenticated
USING (auth.uid() = parent_id);

-- Répétiteurs peuvent voir les offres ouvertes
CREATE POLICY "Repetiteurs can view open offers"
ON public.offers
FOR SELECT
TO authenticated
USING (
  statut = 'ouverte' 
  AND is_prestataire(auth.uid())
);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all offers"
ON public.offers
FOR SELECT
TO authenticated
USING (is_admin_or_super(auth.uid()));

-- Parents peuvent modifier leurs offres
CREATE POLICY "Parents can update own offers"
ON public.offers
FOR UPDATE
TO authenticated
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

-- Admins peuvent modifier toutes les offres
CREATE POLICY "Admins can update all offers"
ON public.offers
FOR UPDATE
TO authenticated
USING (is_admin_or_super(auth.uid()));

-- Parents peuvent supprimer leurs offres
CREATE POLICY "Parents can delete own offers"
ON public.offers
FOR DELETE
TO authenticated
USING (auth.uid() = parent_id);

-- Admins peuvent supprimer toutes les offres
CREATE POLICY "Admins can delete all offers"
ON public.offers
FOR DELETE
TO authenticated
USING (is_admin_or_super(auth.uid()));

-- ========== RLS POLICIES FOR APPLICATIONS ==========

-- Répétiteurs peuvent créer des candidatures
CREATE POLICY "Repetiteurs can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = repetiteur_id 
  AND is_prestataire(auth.uid())
);

-- Répétiteurs peuvent voir leurs candidatures
CREATE POLICY "Repetiteurs can view own applications"
ON public.applications
FOR SELECT
TO authenticated
USING (auth.uid() = repetiteur_id);

-- Parents peuvent voir les candidatures sur leurs offres
CREATE POLICY "Parents can view applications on own offers"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.offers 
    WHERE offers.id = applications.offer_id 
    AND offers.parent_id = auth.uid()
  )
);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all applications"
ON public.applications
FOR SELECT
TO authenticated
USING (is_admin_or_super(auth.uid()));

-- Parents peuvent modifier les candidatures sur leurs offres (accepter/refuser)
CREATE POLICY "Parents can update applications on own offers"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.offers 
    WHERE offers.id = applications.offer_id 
    AND offers.parent_id = auth.uid()
  )
);

-- Répétiteurs peuvent supprimer leurs candidatures en attente
CREATE POLICY "Repetiteurs can delete pending applications"
ON public.applications
FOR DELETE
TO authenticated
USING (
  auth.uid() = repetiteur_id 
  AND statut = 'en_attente'
);

-- Admins peuvent tout modifier/supprimer
CREATE POLICY "Admins can update all applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (is_admin_or_super(auth.uid()));

CREATE POLICY "Admins can delete all applications"
ON public.applications
FOR DELETE
TO authenticated
USING (is_admin_or_super(auth.uid()));