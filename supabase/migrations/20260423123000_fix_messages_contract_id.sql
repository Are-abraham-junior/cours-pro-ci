-- Rendre contract_id optionnel pour permettre l'insertion de messages directs
ALTER TABLE public.messages ALTER COLUMN contract_id DROP NOT NULL;

-- S'assurer que le parent ou le répétiteur spécifie TOUJOURS le sender_id
-- (Cette contrainte est déjà gérée par le NOT NULL sur sender_id)

-- Optionnel: S'assurer qu'un message appartient soit à un contrat, soit à une conversation directe
-- ALTER TABLE public.messages ADD CONSTRAINT chk_message_parent 
-- CHECK (
--   (contract_id IS NOT NULL AND conversation_id IS NULL) OR 
--   (contract_id IS NULL AND conversation_id IS NOT NULL)
-- );
