-- Expose les tables tracking au flux Realtime (écoute INSERT/UPDATE côté client)
-- Requis pour le suivi GPS quasi temps réel via Supabase Realtime + RLS existantes

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_updates;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_sessions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
