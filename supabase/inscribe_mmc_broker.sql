-- INSCRIPTION MANUELLE: mmc@maintenancemc.com comme courtier
-- Executer chaque bloc separement dans Supabase SQL Editor si erreur

-- Etape 1: Creer/mettre a jour users (remplacez USER_ID par l'ID de auth.users)
-- Obtenir l'ID: SELECT id FROM auth.users WHERE email = 'mmc@maintenancemc.com';

INSERT INTO public.users (id, email, full_name, role, company_id, broker_id)
SELECT id, 'mmc@maintenancemc.com', 'MMC', 'broker', NULL, NULL
FROM auth.users WHERE email = 'mmc@maintenancemc.com' LIMIT 1
ON CONFLICT (id) DO UPDATE SET role = 'broker', full_name = COALESCE(public.users.full_name, 'MMC'), updated_at = NOW();

-- Etape 2: Creer le broker si inexistant
INSERT INTO public.brokers (name, registration_number, address, city, province, phone, email, owner_id, status)
SELECT 'MMC SARL', 'RCCM-MMC-' || substring(au.id::text, 1, 8), 'A completer', 'Lubumbashi', 'haut-katanga', '+243000000000', 'mmc@maintenancemc.com', au.id, 'active'
FROM auth.users au
WHERE au.email = 'mmc@maintenancemc.com'
  AND NOT EXISTS (SELECT 1 FROM public.brokers b WHERE b.owner_id = au.id)
LIMIT 1;

-- Etape 3: Lier broker_id dans users
UPDATE public.users u
SET broker_id = b.id, updated_at = NOW()
FROM public.brokers b
WHERE b.owner_id = u.id AND u.email = 'mmc@maintenancemc.com' AND u.broker_id IS NULL;

-- Etape 4: Activer le broker
UPDATE public.brokers SET status = 'active' WHERE owner_id IN (SELECT id FROM auth.users WHERE email = 'mmc@maintenancemc.com');
