-- Supprimer la colonne genius_pay_reference de la table payments
ALTER TABLE public.payments DROP COLUMN IF EXISTS genius_pay_reference;
