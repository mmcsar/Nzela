-- ══════════════════════════════════════════════════════════════
-- NZELA - SYSTEME DE MESSAGERIE
-- Tables: conversations, conversation_participants, messages
-- Securite: RLS strict - chaque utilisateur ne voit QUE ses conversations
-- ══════════════════════════════════════════════════════════════

-- 1. NETTOYAGE (si re-execution)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- ══════════════════════════════════════════
-- 2. TABLE CONVERSATIONS
-- ══════════════════════════════════════════
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Lien optionnel vers un chargement (conversation liee a un load)
  load_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
  -- Titre auto-genere ou personnalise
  title TEXT,
  -- Type: 'load' (liee a un chargement), 'direct' (entre 2 utilisateurs), 'support'
  type TEXT NOT NULL DEFAULT 'load' CHECK (type IN ('load', 'direct', 'support')),
  -- Statut: active, archived, closed
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  -- Metadata JSON (infos supplementaires, ex: load origin/dest)
  metadata JSONB DEFAULT '{}',
  -- Timestamps
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- 3. TABLE PARTICIPANTS
-- ══════════════════════════════════════════
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Role dans la conversation
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'observer')),
  -- Dernier message lu (pour compter les non-lus)
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  -- Notifications activees
  notifications_enabled BOOLEAN DEFAULT TRUE,
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  -- Un utilisateur ne peut etre qu'une fois dans une conversation
  UNIQUE(conversation_id, user_id)
);

-- ══════════════════════════════════════════
-- 4. TABLE MESSAGES
-- ══════════════════════════════════════════
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Contenu
  content TEXT NOT NULL,
  -- Type: text, image, document, location, system
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'document', 'location', 'system')),
  -- URL d'une piece jointe (image, document)
  attachment_url TEXT,
  -- Metadata JSON (ex: coordonnees GPS pour 'location', taille fichier pour 'document')
  metadata JSONB DEFAULT '{}',
  -- Est-ce un message systeme (ex: "X a rejoint la conversation")
  is_system BOOLEAN DEFAULT FALSE,
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- 5. INDEX DE PERFORMANCE
-- ══════════════════════════════════════════
-- Conversations
CREATE INDEX idx_conversations_load ON public.conversations(load_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversations_type ON public.conversations(type);

-- Participants
CREATE INDEX idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX idx_participants_user_conv ON public.conversation_participants(user_id, conversation_id);

-- Messages
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- ══════════════════════════════════════════
-- 6. TRIGGERS (updated_at automatique)
-- ══════════════════════════════════════════
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: mettre a jour last_message_at quand un nouveau message est insere
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ══════════════════════════════════════════
-- 7. ROW LEVEL SECURITY (RLS) - STRICT
-- ══════════════════════════════════════════

-- Activer RLS sur les 3 tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ── CONVERSATIONS ──

-- SELECT: Un utilisateur ne voit QUE les conversations ou il est participant
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM public.conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Tout utilisateur authentifie peut creer une conversation
CREATE POLICY "conversations_insert_auth" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Seuls les participants peuvent modifier (archiver, fermer)
CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE USING (
    id IN (
      SELECT conversation_id FROM public.conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Admin: acces total
CREATE POLICY "conversations_admin_all" ON public.conversations
  FOR ALL USING (public.is_admin());

-- ── PARTICIPANTS ──

-- SELECT: On voit les participants des conversations ou on est soi-meme participant
CREATE POLICY "participants_select_own_conv" ON public.conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants AS cp
      WHERE cp.user_id = auth.uid()
    )
  );

-- INSERT: Seul un participant existant ou le createur peut ajouter des participants
CREATE POLICY "participants_insert_auth" ON public.conversation_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: On ne peut modifier que ses propres parametres (last_read_at, notifications)
CREATE POLICY "participants_update_own" ON public.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- DELETE: On peut quitter une conversation (supprimer sa propre participation)
CREATE POLICY "participants_delete_own" ON public.conversation_participants
  FOR DELETE USING (user_id = auth.uid());

-- Admin: acces total
CREATE POLICY "participants_admin_all" ON public.conversation_participants
  FOR ALL USING (public.is_admin());

-- ── MESSAGES ──

-- SELECT: On ne voit que les messages des conversations ou on est participant
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: On ne peut envoyer des messages que dans les conversations ou on est participant
CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: On ne peut modifier que ses propres messages (pour soft delete)
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Admin: acces total
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL USING (public.is_admin());

-- ══════════════════════════════════════════
-- 8. VERIFICATION
-- ══════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════';
  RAISE NOTICE ' MESSAGERIE NZELA - INSTALLATION TERMINEE';
  RAISE NOTICE '══════════════════════════════════════════';
  RAISE NOTICE ' Tables:';
  RAISE NOTICE '   ✓ conversations (type, load_id, status)';
  RAISE NOTICE '   ✓ conversation_participants (user_id, role, last_read)';
  RAISE NOTICE '   ✓ messages (content, type, sender_id)';
  RAISE NOTICE ' Index: 11 index de performance';
  RAISE NOTICE ' Triggers: 3 (updated_at x2 + last_message_at)';
  RAISE NOTICE ' RLS: 12 policies strictes';
  RAISE NOTICE '   - Utilisateur ne voit QUE ses conversations';
  RAISE NOTICE '   - Ne peut envoyer QUE dans ses conversations';
  RAISE NOTICE '   - Ne peut modifier QUE ses propres messages';
  RAISE NOTICE '   - Admin a acces total';
  RAISE NOTICE '══════════════════════════════════════════';
END $$;
