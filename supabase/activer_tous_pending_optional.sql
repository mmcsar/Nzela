-- ============================================================
-- OPTIONNEL : passer toutes les entreprises et courtiers
-- "pending" en "active" sur Supabase.
-- À exécuter dans Supabase : SQL Editor > New query > Coller > Run
--
-- L'app autorise déjà la publication pour pending et active ;
-- ce script sert seulement à marquer les comptes comme "validés"
-- dans la base (pour stats, affichage, etc.).
-- ============================================================

-- Entreprises en attente → active
UPDATE public.companies
SET status = 'active', updated_at = NOW()
WHERE status = 'pending';

-- Courtiers en attente → active
UPDATE public.brokers
SET status = 'active', updated_at = NOW()
WHERE status = 'pending';

-- Vérification
SELECT 'companies' AS table_name, status, COUNT(*) AS nb FROM public.companies GROUP BY status
UNION ALL
SELECT 'brokers', status, COUNT(*) FROM public.brokers GROUP BY status
ORDER BY table_name, status;
