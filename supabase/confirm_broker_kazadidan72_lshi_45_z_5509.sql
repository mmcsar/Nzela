-- Confirmer le courtier kazadidan72@gmail.com avec RCCM LSHI 45-Z-5509
-- Exécuter dans Supabase SQL Editor

BEGIN;

-- 1) Mise à jour principale via owner_id lié à auth.users
UPDATE public.brokers b
SET
  registration_number = 'LSHI 45-Z-5509',
  status = 'active',
  updated_at = NOW()
FROM auth.users au
WHERE b.owner_id = au.id
  AND lower(trim(au.email)) = 'kazadidan72@gmail.com';

-- 2) Secours si owner_id est absent/incorrect
UPDATE public.brokers
SET
  registration_number = 'LSHI 45-Z-5509',
  status = 'active',
  updated_at = NOW()
WHERE lower(trim(email)) = 'kazadidan72@gmail.com';

-- 3) Assurer le role broker et la liaison broker_id dans public.users
UPDATE public.users u
SET
  role = 'broker',
  broker_id = b.id
FROM public.brokers b
LEFT JOIN auth.users au ON au.id = b.owner_id
WHERE lower(trim(u.email)) = 'kazadidan72@gmail.com'
  AND (
    lower(trim(coalesce(au.email, ''))) = 'kazadidan72@gmail.com'
    OR lower(trim(coalesce(b.email, ''))) = 'kazadidan72@gmail.com'
  );

COMMIT;

-- Vérification finale
SELECT
  u.id AS user_id,
  u.email,
  u.role,
  u.broker_id,
  b.id AS broker_row_id,
  b.name,
  b.registration_number,
  b.status
FROM public.users u
LEFT JOIN public.brokers b ON b.id = u.broker_id
WHERE lower(trim(u.email)) = 'kazadidan72@gmail.com';
