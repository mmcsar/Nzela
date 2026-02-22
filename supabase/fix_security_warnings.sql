-- ============================================================
-- Correctifs pour les warnings du Security Advisor Supabase
-- Exécuter dans Supabase > SQL Editor
-- ============================================================

-- ─── 1. FONCTIONS : search_path non défini (role mutable search_path) ───
-- Définit search_path = 'public' pour chaque fonction listée.
-- Adapte la liste (fonction_names) si d'autres fonctions sont signalées.

DO $$
DECLARE
  r RECORD;
  func_names TEXT[] := ARRAY[
    'update_conversation_last_message',
    'update_reviews_updated_at',
    'get_property_average_rating',
    'update_alerts_updated_at',
    'update_video_calls_updated_at',
    'update_property_alerts_updated_at'
  ];
  func_name TEXT;
BEGIN
  FOREACH func_name IN ARRAY func_names
  LOOP
    FOR r IN (
      SELECT n.nspname AS schema_name,
             p.proname AS func_name,
             pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = func_name
    )
    LOOP
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        r.schema_name, r.func_name, r.args
      );
      RAISE NOTICE 'Fonction % set search_path = public', r.func_name;
    END LOOP;
  END LOOP;
END $$;


-- ─── 2. EXTENSION POSTGIS (dans public) ───
-- PostGIS ne supporte pas "SET SCHEMA" : l’extension doit rester dans public.
-- Le warning du Security Advisor peut être ignoré pour postgis, ou accepté comme risque connu.
-- Rien à exécuter ici.


-- ─── 3. TABLE property_views : policy INSERT trop permissive ───
-- La policy property_views_insert_public avec WITH CHECK (true) désactive la RLS.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_views') THEN
    DROP POLICY IF EXISTS "property_views_insert_public" ON public.property_views;
    RAISE NOTICE 'Policy property_views_insert_public supprimée.';
  ELSE
    RAISE NOTICE 'Table property_views absente, rien à faire.';
  END IF;
END $$;


-- ─── 4. AUTH – Mots de passe compromis (HaveIBeenPwned) ───
-- Ce réglage se fait dans le Dashboard, pas en SQL.
-- Étapes : Supabase Dashboard → Authentication → Settings
--         → activer "Leaked password protection" / "Check passwords against HaveIBeenPwned".

-- Rien à exécuter ici pour ce point.
