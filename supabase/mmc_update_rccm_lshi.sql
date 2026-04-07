-- Mettre à jour le RCCM du courtier MMC (connexion : le login compare ce champ au RCCM saisi)
-- Exécuter dans Supabase → SQL Editor
-- Email : mmc@maintenancemc.com  |  RCCM officiel : LSHI 17-B-6981
--
-- Si 0 ligne mise à jour : vérifier l'email dans auth.users et public.users (casse, espaces).

-- 1) Par propriétaire (lien auth.users → brokers.owner_id)
UPDATE public.brokers b
SET
  registration_number = 'LSHI 17-B-6981',
  status = 'active',
  updated_at = NOW()
FROM auth.users au
WHERE b.owner_id = au.id
  AND lower(trim(au.email)) = 'mmc@maintenancemc.com';

-- 2) Secours : ligne courtier dont l'email métier correspond (si owner_id différent / données anciennes)
UPDATE public.brokers
SET
  registration_number = 'LSHI 17-B-6981',
  status = 'active',
  updated_at = NOW()
WHERE lower(trim(email)) = 'mmc@maintenancemc.com';

-- Vérification : une ligne doit afficher LSHI 17-B-6981
-- SELECT b.id, b.name, b.registration_number, b.status, b.owner_id, b.email
-- FROM public.brokers b
-- LEFT JOIN auth.users au ON au.id = b.owner_id
-- WHERE lower(trim(coalesce(au.email, ''))) = 'mmc@maintenancemc.com'
--    OR lower(trim(b.email)) = 'mmc@maintenancemc.com';
