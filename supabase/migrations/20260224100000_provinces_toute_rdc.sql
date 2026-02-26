-- ============================================================
-- Nzela : étendre province à toute la RDC (26 provinces)
-- À exécuter dans Supabase > SQL Editor (ou via supabase db push)
-- Supprime la contrainte CHECK qui limitait à Haut-Katanga et Lualaba.
-- Sans cette migration, companies et brokers n'acceptent que ces 2 provinces.
-- Les tables loads et trucks (origin/destination en JSONB) acceptent déjà toute province.
-- ============================================================

-- Companies : autoriser toutes les provinces RDC
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_province_check;

-- Brokers : autoriser toutes les provinces RDC
ALTER TABLE public.brokers
  DROP CONSTRAINT IF EXISTS brokers_province_check;

-- Si erreur "constraint does not exist", le nom peut varier. Trouver le nom :
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.companies'::regclass AND contype = 'c';
-- Puis : ALTER TABLE public.companies DROP CONSTRAINT "nom_affiché";
