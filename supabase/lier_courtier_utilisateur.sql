-- ============================================================
-- Lier les courtiers (brokers) aux utilisateurs (users)
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query
-- ============================================================
-- Ce script lie les lignes de la table "brokers" aux utilisateurs
-- (owner_id + users.broker_id) pour que l'admin puisse les approuver
-- sans erreur "Aucun courtier trouvé".
-- ============================================================

-- 1) Courtiers dont l'email du broker = email de l'utilisateur → lier
UPDATE public.brokers b
SET owner_id = u.id, updated_at = NOW()
FROM public.users u
WHERE u.role = 'broker'
  AND u.broker_id IS NULL
  AND b.email = u.email
  AND (b.owner_id IS DISTINCT FROM u.id);

-- 2) Mettre à jour users.broker_id pour ces courtiers
UPDATE public.users u
SET broker_id = b.id, updated_at = NOW()
FROM public.brokers b
WHERE b.owner_id = u.id
  AND u.role = 'broker'
  AND (u.broker_id IS NULL OR u.broker_id != b.id);

-- 3) Cas "Entreprise mmc" : courtiers SANS owner_id dont le nom ou email contient le préfixe de l'utilisateur
--    Ex. user mmc@maintenancemc.com → broker avec name ou email contenant "mmc"
UPDATE public.brokers b
SET owner_id = u.id, updated_at = NOW()
FROM public.users u
WHERE u.role = 'broker'
  AND u.broker_id IS NULL
  AND b.owner_id IS NULL
  AND (
    b.email ILIKE '%' || split_part(u.email, '@', 1) || '%'
    OR b.name ILIKE '%' || split_part(u.email, '@', 1) || '%'
  )
  AND NOT EXISTS (SELECT 1 FROM public.brokers b2 WHERE b2.owner_id = u.id);

-- 4) Refaire le lien users.broker_id pour tous les broker dont owner_id = user
UPDATE public.users u
SET broker_id = b.id, updated_at = NOW()
FROM public.brokers b
WHERE b.owner_id = u.id
  AND u.role = 'broker'
  AND (u.broker_id IS NULL OR u.broker_id != b.id);

-- 5) Vérification (optionnel) : afficher les liaisons
SELECT u.email, u.role, u.broker_id, b.name AS broker_name, b.owner_id
FROM public.users u
LEFT JOIN public.brokers b ON b.id = u.broker_id
WHERE u.role = 'broker'
ORDER BY u.email;
