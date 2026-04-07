-- Mettre à jour le RCCM du courtier MMC (connexion : le login compare ce champ au RCCM saisi)
-- Exécuter dans Supabase → SQL Editor
-- Email : mmc@maintenancemc.com  |  RCCM officiel : LSHI 17-B-6981

UPDATE public.brokers b
SET
  registration_number = 'LSHI 17-B-6981',
  status = 'active',
  updated_at = NOW()
FROM auth.users au
WHERE b.owner_id = au.id
  AND au.email = 'mmc@maintenancemc.com';

-- Vérification (doit afficher une ligne avec le bon RCCM)
-- SELECT b.id, b.name, b.registration_number, b.status, b.owner_id
-- FROM public.brokers b
-- JOIN auth.users au ON au.id = b.owner_id
-- WHERE au.email = 'mmc@maintenancemc.com';
