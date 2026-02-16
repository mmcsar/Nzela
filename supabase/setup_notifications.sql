-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE NOTIFICATIONS - Pour le bouton "Notifier l'administrateur"
-- Exécuter dans Supabase SQL Editor si la table n'existe pas
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN (
    'load_new', 'load_assigned', 'load_status', 'message_new',
    'payment_received', 'payment_failed', 'kyc_approved', 'kyc_rejected',
    'kyc_submitted', 'tracking_alert', 'subscription_expiry', 'system'
  )),

  title TEXT NOT NULL,
  body TEXT NOT NULL,

  link TEXT,
  icon TEXT,

  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifs_created ON public.notifications(created_at DESC);

-- 2. RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifs_select" ON public.notifications;
DROP POLICY IF EXISTS "notifs_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifs_update" ON public.notifications;
DROP POLICY IF EXISTS "notifs_delete" ON public.notifications;

CREATE POLICY "notifs_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifs_insert" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "notifs_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifs_delete" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- 3. Confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Table notifications prête. Le bouton "Notifier l''administrateur" fonctionnera.';
END $$;
