-- Migration sécurisée pour le chat en ligne
-- La table messages peut déjà exister, on ajoute seulement ce qui manque

-- 1. Créer la table si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Activer RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Policies (DROP si elles existent déjà pour éviter les conflits)
DROP POLICY IF EXISTS "Contract participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Contract participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

-- Seuls les participants au contrat peuvent lire les messages
CREATE POLICY "Contract participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
        AND (c.parent_id = auth.uid() OR c.repetiteur_id = auth.uid())
    )
  );

-- Seuls les participants au contrat peuvent envoyer des messages
CREATE POLICY "Contract participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
        AND (c.parent_id = auth.uid() OR c.repetiteur_id = auth.uid())
    )
  );

-- Les destinataires peuvent marquer les messages comme lus
CREATE POLICY "Recipients can mark messages as read"
  ON public.messages FOR UPDATE TO authenticated
  USING (sender_id <> auth.uid())
  WITH CHECK (sender_id <> auth.uid());

-- 4. Activer la réplication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
