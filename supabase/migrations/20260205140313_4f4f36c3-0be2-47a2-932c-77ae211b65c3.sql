-- Create contract status enum
CREATE TYPE public.contract_status AS ENUM ('actif', 'termine', 'annule');

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id),
  repetiteur_id UUID NOT NULL REFERENCES public.profiles(id),
  matiere TEXT NOT NULL,
  niveau TEXT NOT NULL,
  frequence TEXT NOT NULL,
  adresse TEXT NOT NULL,
  tarif_convenu INTEGER,
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin DATE,
  statut contract_status NOT NULL DEFAULT 'actif',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id)
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own contracts"
ON public.contracts FOR SELECT
USING (auth.uid() = parent_id);

CREATE POLICY "Repetiteurs can view own contracts"
ON public.contracts FOR SELECT
USING (auth.uid() = repetiteur_id);

CREATE POLICY "Parents can update own contracts"
ON public.contracts FOR UPDATE
USING (auth.uid() = parent_id);

CREATE POLICY "Admins can view all contracts"
ON public.contracts FOR SELECT
USING (is_admin_or_super(auth.uid()));

CREATE POLICY "Admins can update all contracts"
ON public.contracts FOR UPDATE
USING (is_admin_or_super(auth.uid()));

CREATE POLICY "System can insert contracts"
ON public.contracts FOR INSERT
WITH CHECK (auth.uid() = parent_id);

-- Trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create contract when application is accepted
CREATE OR REPLACE FUNCTION public.create_contract_on_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _offer RECORD;
BEGIN
  -- Only trigger when status changes to 'acceptee'
  IF NEW.statut = 'acceptee' AND (OLD.statut IS NULL OR OLD.statut != 'acceptee') THEN
    -- Get offer details
    SELECT * INTO _offer FROM public.offers WHERE id = NEW.offer_id;
    
    -- Create the contract
    INSERT INTO public.contracts (
      offer_id,
      application_id,
      parent_id,
      repetiteur_id,
      matiere,
      niveau,
      frequence,
      adresse
    ) VALUES (
      NEW.offer_id,
      NEW.id,
      _offer.parent_id,
      NEW.repetiteur_id,
      _offer.matiere,
      _offer.niveau,
      _offer.frequence,
      _offer.adresse
    );
    
    -- Update offer status to 'en_cours'
    UPDATE public.offers SET statut = 'en_cours' WHERE id = NEW.offer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on applications table
CREATE TRIGGER trigger_create_contract_on_acceptance
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.create_contract_on_acceptance();