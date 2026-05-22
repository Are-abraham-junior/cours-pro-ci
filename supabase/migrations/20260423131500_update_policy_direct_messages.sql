-- Politique d'UPDATE explicite pour les messages des conversations directes
-- Cela garantit que les participants peuvent marquer les messages comme lus
DROP POLICY IF EXISTS "Les participants peuvent mettre a jour les messages directs" ON public.messages;

CREATE POLICY "Les participants peuvent mettre a jour les messages directs"
ON public.messages
FOR UPDATE
USING (
  conversation_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.direct_conversations 
    WHERE id = messages.conversation_id 
    AND (parent_id = auth.uid() OR repetiteur_id = auth.uid())
  )
)
WITH CHECK (
  conversation_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.direct_conversations 
    WHERE id = messages.conversation_id 
    AND (parent_id = auth.uid() OR repetiteur_id = auth.uid())
  )
);
