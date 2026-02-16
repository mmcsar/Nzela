-- ============================================================
-- RENDRE kzadichris@gmail.com OPÉRATIONNEL COMME ENTREPRISE
-- À exécuter dans Supabase SQL Editor
--
-- Prérequis: le compte doit exister dans auth.users (inscription faite)
-- ============================================================

-- 1. S'assurer que l'utilisateur existe dans public.users avec role='company'
INSERT INTO public.users (id, email, full_name, role, company_id, broker_id)
SELECT id, 'kzadichris@gmail.com', COALESCE(raw_user_meta_data->>'full_name', 'Kzadi Chris'), 'company', NULL, NULL
FROM auth.users
WHERE email = 'kzadichris@gmail.com'
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  role = 'company',
  broker_id = NULL,
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name, 'Kzadi Chris'),
  updated_at = NOW();

-- 2. Créer l'entreprise si inexistante
INSERT INTO public.companies (name, registration_number, address, city, province, phone, email, owner_id, status)
SELECT
  'Entreprise Test Kzadi',
  'RCCM-KZA-' || UPPER(SUBSTRING(au.id::text, 1, 8)),
  'Adresse à compléter',
  'Lubumbashi',
  'haut-katanga',
  '+243970000000',
  'kzadichris@gmail.com',
  au.id,
  'active'
FROM auth.users au
WHERE au.email = 'kzadichris@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = au.id)
LIMIT 1;

-- 3. Lier company_id dans users
UPDATE public.users u
SET company_id = c.id, updated_at = NOW()
FROM public.companies c
WHERE c.owner_id = u.id
  AND u.email = 'kzadichris@gmail.com'
  AND (u.company_id IS NULL OR u.company_id != c.id);

-- 4. Activer l'entreprise (au cas où elle existait déjà en pending)
UPDATE public.companies
SET status = 'active', updated_at = NOW()
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'kzadichris@gmail.com' LIMIT 1);

-- 4b. (Optionnel) Si table companies a verification_status/verified_at (KYC):
-- UPDATE public.companies SET verification_status='verified', verified_at=NOW(),
--   verified_by=(SELECT id FROM public.users WHERE role='admin' LIMIT 1)
-- WHERE owner_id=(SELECT id FROM auth.users WHERE email='kzadichris@gmail.com' LIMIT 1);

-- (confirmed_at dans auth.users est une colonne générée - ne pas la modifier)

-- Vérification
SELECT
  u.id AS user_id,
  u.email,
  u.role,
  u.company_id,
  c.id AS company_id,
  c.name AS company_name,
  c.status AS company_status
FROM public.users u
LEFT JOIN public.companies c ON c.owner_id = u.id
WHERE u.email = 'kzadichris@gmail.com';
