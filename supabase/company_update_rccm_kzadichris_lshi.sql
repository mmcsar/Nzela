-- Mettre à jour le RCCM de l'entreprise liée à kzadichris@gmail.com
-- (connexion : le login compare ce champ au RCCM saisi pour role = company)
-- Exécuter dans Supabase → SQL Editor
--
-- RCCM : LSHI 17-B-6981
-- À la connexion, vous pouvez saisir par ex. « LSHI 17-B-6981 » (tolérance espaces / tirets).
--
-- Si 0 ligne mise à jour : exécuter d'abord setup_kzadichris_company.sql pour créer la ligne companies + users.company_id.

-- 1) Par propriétaire (auth.users → companies.owner_id)
UPDATE public.companies c
SET
  registration_number = 'LSHI 17-B-6981',
  status = 'active',
  updated_at = NOW()
FROM auth.users au
WHERE c.owner_id = au.id
  AND lower(trim(au.email)) = 'kzadichris@gmail.com';

-- 2) Secours : ligne entreprise dont l'email métier correspond
UPDATE public.companies
SET
  registration_number = 'LSHI 17-B-6981',
  status = 'active',
  updated_at = NOW()
WHERE lower(trim(email)) = 'kzadichris@gmail.com';

-- Vérification : role = company, company_id renseigné, RCCM = LSHI 17-B-6981 (colonne utilisée au login)
SELECT
  u.id AS user_id,
  u.email,
  u.role,
  u.company_id,
  c.name AS company_name,
  c.registration_number AS rccm_utilise_au_login,
  c.status
FROM public.users u
LEFT JOIN public.companies c ON c.id = u.company_id
WHERE lower(trim(u.email)) = 'kzadichris@gmail.com';
