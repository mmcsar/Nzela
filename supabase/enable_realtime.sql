-- =====================================================
-- NZELA - Activer Realtime (WebSocket) pour tables clés
-- Exécuter dans le SQL Editor de Supabase
-- =====================================================
-- Permet les mises à jour en temps réel sur :
-- - loads  : nouveaux chargements, changements de statut
-- - trucks : disponibilité des camions
-- - bols   : création/modification des BOL
-- =====================================================

-- Ajouter les tables à la publication Realtime (si pas déjà présentes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'loads') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loads;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'trucks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trucks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bols') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bols;
  END IF;
END $$;
