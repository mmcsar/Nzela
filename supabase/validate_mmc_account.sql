-- VALIDATION MANUELLE: mmc@maintenancemc.com
-- Executer dans Supabase SQL Editor (instructions SQL simples, pas de DO block)

-- 1. Valider demandes KYC
UPDATE public.verification_requests vr
SET status = 'approved', reviewed_at = NOW(), reviewed_by = (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), review_notes = 'Validation manuelle'
FROM auth.users au
WHERE vr.user_id = au.id AND au.email = 'mmc@maintenancemc.com' AND vr.status IN ('pending', 'in_review', 'more_info_needed');

-- 2. Valider documents
UPDATE public.verification_documents vd
SET status = 'approved', reviewed_at = NOW(), reviewed_by = (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
FROM auth.users au
WHERE vd.user_id = au.id AND au.email = 'mmc@maintenancemc.com' AND vd.status = 'pending';

-- 3. Valider broker
UPDATE public.brokers b
SET verification_status = 'verified', status = 'active', verified_at = NOW(), verified_by = (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
FROM auth.users au
WHERE b.owner_id = au.id AND au.email = 'mmc@maintenancemc.com';

-- 4. Valider company (si applicable)
UPDATE public.companies c
SET verification_status = 'verified', status = 'active', verified_at = NOW(), verified_by = (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
FROM auth.users au
WHERE c.owner_id = au.id AND au.email = 'mmc@maintenancemc.com';

-- 5. Mettre a jour kyc_status
UPDATE public.users u SET kyc_status = 'verified' FROM auth.users au WHERE u.id = au.id AND au.email = 'mmc@maintenancemc.com';
