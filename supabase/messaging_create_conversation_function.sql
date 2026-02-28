-- ══════════════════════════════════════════════════════════════
-- NZELA - Fonction pour créer une conversation (contourne RLS)
-- À exécuter dans Supabase → SQL Editor (une fois).
-- L'API appelle cette fonction avec le client utilisateur (session).
-- SECURITY DEFINER = les INSERT s'exécutent en tant que propriétaire, pas de blocage RLS.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_conversation_secure(
  p_creator_id uuid,
  p_recipient_id uuid,
  p_load_id uuid DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_type text DEFAULT 'direct'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
  v_title text;
  v_recipient_email text;
BEGIN
  -- Seul l'utilisateur connecté peut créer une conversation pour lui-même
  IF auth.uid() IS NULL OR auth.uid() != p_creator_id THEN
    RAISE EXCEPTION 'Non autorisé'
      USING ERRCODE = 'P0001';
  END IF;

  -- Vérifier que le destinataire existe
  SELECT email INTO v_recipient_email
  FROM public.users WHERE id = p_recipient_id LIMIT 1;
  IF v_recipient_email IS NULL THEN
    RAISE EXCEPTION 'Destinataire introuvable'
      USING ERRCODE = 'P0002';
  END IF;

  v_title := COALESCE(NULLIF(trim(p_title), ''), 'Conversation avec ' || split_part(v_recipient_email, '@', 1));

  INSERT INTO public.conversations (load_id, title, type, status, metadata)
  VALUES (p_load_id, v_title, COALESCE(NULLIF(trim(p_type), ''), CASE WHEN p_load_id IS NOT NULL THEN 'load' ELSE 'direct' END), 'active', COALESCE(jsonb_build_object('loadId', p_load_id), '{}'))
  RETURNING id INTO v_conv_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES
    (v_conv_id, p_creator_id, 'member'),
    (v_conv_id, p_recipient_id, 'member');

  INSERT INTO public.messages (conversation_id, sender_id, content, type, is_system)
  VALUES (v_conv_id, p_creator_id, 'Conversation demarree', 'system', true);

  RETURN v_conv_id;
END;
$$;

-- Autoriser les rôles authentifiés à appeler la fonction
GRANT EXECUTE ON FUNCTION public.create_conversation_secure(uuid, uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_conversation_secure(uuid, uuid, uuid, text, text) TO service_role;

COMMENT ON FUNCTION public.create_conversation_secure IS 'Crée une conversation + 2 participants + message système. Appelée par l''API avec le client utilisateur (session).';
