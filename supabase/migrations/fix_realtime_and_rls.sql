-- 1. On s'assure que RLS est activé
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. On supprime les anciennes policies potentiellement erronées pour repartir au propre
DROP POLICY IF EXISTS "Participants can view their contract messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages to their contracts" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status of received messages" ON public.messages;

-- 3. Policy de LECTURE : on peut lire si on est participant du contrat (parent ou répétiteur)
CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = messages.contract_id
      AND (contracts.parent_id = auth.uid() OR contracts.repetiteur_id = auth.uid())
    )
  );

-- 4. Policy de SUPPRESSION : optionnelle (ici on bloque pour le moment, c'est plus sûr)

-- 5. Policy d'INSERTION : on peut insérer si on participe au contrat ET qu'on est l'expéditeur déclaré
CREATE POLICY "Participants can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = messages.contract_id
      AND (contracts.parent_id = auth.uid() OR contracts.repetiteur_id = auth.uid())
    )
  );

-- 6. Policy de MISE A JOUR : on peut marquer les messages qu'on a *reçus* comme "lus"
CREATE POLICY "Users can update read status of received messages"
  ON public.messages FOR UPDATE
  USING (
    sender_id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = messages.contract_id
      AND (contracts.parent_id = auth.uid() OR contracts.repetiteur_id = auth.uid())
    )
  )
  WITH CHECK (
    sender_id != auth.uid()
  );

-- 7. LE PLUS IMPORTANT POUR LE CHAT EN DIRECT : Activer Supabase Realtime !
DO $$
BEGIN
  -- Ajoute la table 'messages' au channel realtime par défaut si elle n'y est pas
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END
$$;
