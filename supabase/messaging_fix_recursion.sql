-- ══════════════════════════════════════════════════════════════
-- Correctif : récursion infinie sur conversation_participants
-- À exécuter dans Supabase → SQL Editor si vous avez déjà exécuté
-- messaging_install.sql et voyez "infinite recursion detected in policy".
-- Ne supprime pas les tables ni les données.
-- ══════════════════════════════════════════════════════════════

-- 1. Fonction helper (lecture sans RLS = pas de récursion)
CREATE OR REPLACE FUNCTION public.user_conversation_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid();
$$;

-- 2. Supprimer les politiques qui lisent conversation_participants dans leur condition
DROP POLICY IF EXISTS "participants_select_own_conv" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;

-- 3. Recréer les politiques avec la fonction
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (id IN (SELECT public.user_conversation_ids()));

CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE USING (id IN (SELECT public.user_conversation_ids()));

CREATE POLICY "participants_select_own_conv" ON public.conversation_participants
  FOR SELECT USING (conversation_id IN (SELECT public.user_conversation_ids()));

CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (conversation_id IN (SELECT public.user_conversation_ids()));

CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (SELECT public.user_conversation_ids())
  );

DO $$ BEGIN RAISE NOTICE 'Correctif récursion RLS appliqué.'; END $$;
