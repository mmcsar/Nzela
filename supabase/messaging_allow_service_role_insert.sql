-- ══════════════════════════════════════════════════════════════
-- NZELA - Autoriser les INSERT pour le rôle service_role (backend)
-- À exécuter dans Supabase → SQL Editor (une fois).
-- Corrige "new row violates row-level security policy" quand l'API
-- crée une conversation via la clé service_role ou via une RPC.
-- ══════════════════════════════════════════════════════════════

-- Conversations : permettre INSERT au rôle service_role (utilisé par l'API backend)
DROP POLICY IF EXISTS "conversations_insert_service_role" ON public.conversations;
CREATE POLICY "conversations_insert_service_role" ON public.conversations
  FOR INSERT TO service_role WITH CHECK (true);

-- Participants : idem
DROP POLICY IF EXISTS "participants_insert_service_role" ON public.conversation_participants;
CREATE POLICY "participants_insert_service_role" ON public.conversation_participants
  FOR INSERT TO service_role WITH CHECK (true);

-- Messages : idem
DROP POLICY IF EXISTS "messages_insert_service_role" ON public.messages;
CREATE POLICY "messages_insert_service_role" ON public.messages
  FOR INSERT TO service_role WITH CHECK (true);

-- ══════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE 'Policies INSERT pour service_role ajoutées (conversations, participants, messages).';
END $$;
