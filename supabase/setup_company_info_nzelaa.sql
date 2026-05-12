-- ============================================================
-- RCCM pour l’entreprise liée à info@nzelaa.com
--
-- Erreur 23505 : une autre ligne `companies` a déjà le même
-- `registration_number` (contrainte UNIQUE). Deux entreprises
-- ne peuvent pas partager le même RCCM.
-- ============================================================

-- Qui occupe déjà « LSHI 17-B-6981 » ?
SELECT id, name, registration_number, email, owner_id, status
FROM public.companies
WHERE registration_number = 'LSHI 17-B-6981';

-- Entreprise ciblée par info@nzelaa.com
SELECT c.id, c.name, c.registration_number, c.email, c.owner_id
FROM public.companies c
WHERE
  c.owner_id IN (SELECT id FROM auth.users WHERE lower(email) = lower('info@nzelaa.com'))
  OR lower(c.email) = lower('info@nzelaa.com');

-- ----------------------------------------------------------------
-- A) Recommandé : RCCM distinct pour ce compte (pas de conflit)
--    Même référence métier + suffixe réservé au compte support.
-- ----------------------------------------------------------------
UPDATE public.companies c
SET
  registration_number = 'LSHI 17-B-6981-NZELAA',
  updated_at = NOW()
WHERE
  (
    c.owner_id IN (SELECT id FROM auth.users WHERE lower(email) = lower('info@nzelaa.com'))
    OR lower(c.email) = lower('info@nzelaa.com')
  )
  AND c.registration_number IS DISTINCT FROM 'LSHI 17-B-6981-NZELAA';

-- Vérification
SELECT c.id, c.name, c.registration_number, c.email, c.owner_id
FROM public.companies c
WHERE
  c.owner_id IN (SELECT id FROM auth.users WHERE lower(email) = lower('info@nzelaa.com'))
  OR lower(c.email) = lower('info@nzelaa.com');

-- ----------------------------------------------------------------
-- B) Option : libérer « LSHI 17-B-6981 » pour une seule entreprise
--    Si l’autre ligne est un doublon / test, renommez-la d’abord,
--    puis mettez le RCCM canonique sur la bonne fiche.
--    Remplacez COMPANY_ID_A_LIBERER par l’id renvoyé par le 1er SELECT.
-- ----------------------------------------------------------------
/*
UPDATE public.companies
SET registration_number = 'RCCM-ANCIEN-DOUBLON-' || upper(left(replace(id::text, '-', ''), 12)),
    updated_at = NOW()
WHERE id = 'COMPANY_ID_A_LIBERER';

UPDATE public.companies c
SET registration_number = 'LSHI 17-B-6981', updated_at = NOW()
WHERE c.id = 'ID_DE_LA_FICHE_INFO_NZELAA';
*/
