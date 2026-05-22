-- Configuration RLS pour la table direct_conversations
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : seuls les participants (parent ou répétiteur) peuvent voir la conversation
CREATE POLICY "Les participants peuvent voir leurs conversations directes"
ON public.direct_conversations
FOR SELECT
USING (auth.uid() = parent_id OR auth.uid() = repetiteur_id);

-- Politique d'insertion : les parents peuvent créer de nouvelles conversations
CREATE POLICY "Les parents peuvent initier des conversations directes"
ON public.direct_conversations
FOR INSERT
WITH CHECK (auth.uid() = parent_id);

-- Politique de mise à jour : les participants peuvent mettre à jour (ex: updated_at)
CREATE POLICY "Les participants peuvent mettre à jour leurs conversations directes"
ON public.direct_conversations
FOR UPDATE
USING (auth.uid() = parent_id OR auth.uid() = repetiteur_id);

-- Mise à jour des politiques de la table messages pour inclure conversation_id
-- Lecture des messages
CREATE POLICY "Lecture des messages pour les participants de conversation directe"
ON public.messages
FOR SELECT
USING (
  conversation_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.direct_conversations 
    WHERE id = messages.conversation_id 
    AND (parent_id = auth.uid() OR repetiteur_id = auth.uid())
  )
);

-- Insertion de messages
CREATE POLICY "Insertion de messages pour les participants de conversation directe"
ON public.messages
FOR INSERT
WITH CHECK (
  conversation_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.direct_conversations 
    WHERE id = messages.conversation_id 
    AND (parent_id = auth.uid() OR repetiteur_id = auth.uid())
  )
);

-- Note: Ces politiques s'ajoutent à celles déjà existantes pour contract_id
