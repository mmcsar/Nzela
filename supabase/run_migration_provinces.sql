-- ============================================================
-- Nzela : migration 26 provinces (Haut-Katanga + Lualaba → toute la RDC)
-- À exécuter dans Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- Companies : autoriser toutes les provinces RDC
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_province_check;

-- Brokers : autoriser toutes les provinces RDC
ALTER TABLE public.brokers
  DROP CONSTRAINT IF EXISTS brokers_province_check;

-- Si erreur "constraint does not exist" : trouver le nom avec :
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.companies'::regclass AND contype = 'c';
-- Puis : ALTER TABLE public.companies DROP CONSTRAINT "nom_trouvé";
