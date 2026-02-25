-- Notifier les admins à chaque nouvelle inscription entreprise ou courtier (directement dans Supabase).
-- Ainsi l'entreprise/courtier est déjà en base : la plateforme affiche toujours ce qui est dans Supabase,
-- et les admins reçoivent une notification même si l'appel API notify-signup échoue (session, réseau).

-- Fonction : insérer une notification pour chaque admin (nouvelle inscription)
CREATE OR REPLACE FUNCTION public.notify_admins_new_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link, icon)
  SELECT u.id, 'system', 'Nouvelle inscription entreprise', COALESCE(NEW.name, 'Une entreprise') || ' demande une validation. Un administrateur doit approuver le compte.', '/dashboard/admin/companies', 'Building2'
  FROM public.users u
  WHERE u.role = 'admin';
  RETURN NEW;
END;
$$;

-- Fonction : idem pour les courtiers
CREATE OR REPLACE FUNCTION public.notify_admins_new_broker_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link, icon)
  SELECT u.id, 'system', 'Nouvelle inscription courtier', COALESCE(NEW.name, 'Un courtier') || ' demande une validation. Un administrateur doit approuver le compte.', '/dashboard/admin/brokers', 'Users'
  FROM public.users u
  WHERE u.role = 'admin';
  RETURN NEW;
END;
$$;

-- Trigger : après insertion d'une entreprise
DROP TRIGGER IF EXISTS notify_admins_on_company_insert ON public.companies;
CREATE TRIGGER notify_admins_on_company_insert
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_signup();

-- Trigger : après insertion d'un courtier
DROP TRIGGER IF EXISTS notify_admins_on_broker_insert ON public.brokers;
CREATE TRIGGER notify_admins_on_broker_insert
  AFTER INSERT ON public.brokers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_broker_signup();
