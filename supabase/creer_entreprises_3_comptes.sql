-- ============================================================
-- CRÉER ET LIER UNE ENTREPRISE POUR LES 3 COMPTES (MMC, Kzadi, JHS)
-- À exécuter dans Supabase : SQL Editor > New query > Coller > Run
--
-- Après ce script + a_ajouter_sur_supabase.sql, la liste entreprises
-- s'affichera et vous pourrez cliquer "Approuver" pour activer.
-- ============================================================

-- Helper: crée une entreprise pour un email (role company) si elle n'existe pas, puis lie user.company_id
DO $$
DECLARE
  rec RECORD;
  new_company_id UUID;
  reg_no TEXT;
BEGIN
  FOR rec IN
    SELECT au.id AS uid, au.email, COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)) AS full_name
    FROM auth.users au
    WHERE au.email IN ('mmc@maintenancemc.com', 'kzadichris@gmail.com', 'jhsfreight@gmail.com')
  LOOP
    -- S'assurer que l'utilisateur est dans public.users avec role company
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (rec.uid, rec.email, rec.full_name, 'company')
    ON CONFLICT (id) DO UPDATE SET
      role = 'company',
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
      updated_at = NOW();

    -- Créer l'entreprise si pas déjà une avec ce owner_id
    IF NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = rec.uid) THEN
      reg_no := 'RCCM-' || UPPER(REPLACE(SPLIT_PART(rec.email, '@', 1), '.', '')) || '-' || UPPER(SUBSTRING(rec.uid::text, 1, 8));
      -- Gérer l'unicité de registration_number (au cas où conflit)
      WHILE EXISTS (SELECT 1 FROM public.companies WHERE registration_number = reg_no) LOOP
        reg_no := reg_no || '-' || SUBSTRING(gen_random_uuid()::text, 1, 4);
      END LOOP;

      INSERT INTO public.companies (name, registration_number, address, city, province, phone, email, owner_id, status)
      VALUES (
        'Entreprise ' || rec.full_name,
        reg_no,
        'Adresse à compléter',
        'Lubumbashi',
        'haut-katanga',
        '+243000000000',
        rec.email,
        rec.uid,
        'pending'
      )
      RETURNING id INTO new_company_id;

      UPDATE public.users
      SET company_id = new_company_id, updated_at = NOW()
      WHERE id = rec.uid;
    ELSE
      -- Lien existant mais user.company_id peut être NULL
      UPDATE public.users u
      SET company_id = c.id, updated_at = NOW()
      FROM public.companies c
      WHERE c.owner_id = u.id AND u.id = rec.uid AND (u.company_id IS NULL OR u.company_id != c.id);
    END IF;
  END LOOP;
END $$;

-- Vérification
SELECT
  u.email,
  u.role,
  u.company_id,
  c.name AS company_name,
  c.registration_number,
  c.status AS company_status
FROM public.users u
LEFT JOIN public.companies c ON c.owner_id = u.id
WHERE u.email IN ('mmc@maintenancemc.com', 'kzadichris@gmail.com', 'jhsfreight@gmail.com')
ORDER BY u.email;
