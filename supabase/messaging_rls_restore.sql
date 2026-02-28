-- ══════════════════════════════════════════════════════════════
-- NZELA - Restauration des policies RLS messagerie (original)
-- À exécuter dans Supabase → SQL Editor si l'erreur
-- "new row violates row-level security policy for table conversations" apparaît.
-- Les policies doivent autoriser INSERT quand auth.uid() IS NOT NULL.
-- ══════════════════════════════════════════════════════════════

-- Conversations
DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_auth" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_admin_all" ON public.conversations;

CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (id IN (SELECT public.user_conversation_ids()));
CREATE POLICY "conversations_insert_auth" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE USING (id IN (SELECT public.user_conversation_ids()));
CREATE POLICY "conversations_admin_all" ON public.conversations
  FOR ALL USING (public.is_admin());

-- Participants
DROP POLICY IF EXISTS "participants_select_own_conv" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert_auth" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update_own" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_delete_own" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_admin_all" ON public.conversation_participants;

CREATE POLICY "participants_select_own_conv" ON public.conversation_participants
  FOR SELECT USING (conversation_id IN (SELECT public.user_conversation_ids()));
CREATE POLICY "participants_insert_auth" ON public.conversation_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "participants_update_own" ON public.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "participants_delete_own" ON public.conversation_participants
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "participants_admin_all" ON public.conversation_participants
  FOR ALL USING (public.is_admin());

-- Messages
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "messages_admin_all" ON public.messages;

CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (conversation_id IN (SELECT public.user_conversation_ids()));
CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (SELECT public.user_conversation_ids())
  );
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL USING (public.is_admin());

-- ══════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE 'Policies RLS messagerie restaurées (conversations, conversation_participants, messages).';
END $$;
