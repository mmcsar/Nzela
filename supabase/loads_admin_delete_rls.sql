-- ═══════════════════════════════════════════════════════════════════════════
-- Optionnel : permettre à un utilisateur role=admin de DELETE sur public.loads
-- via le client Supabase (JWT). L’API Next.js utilise déjà la service role pour
-- la suppression admin — ce script est utile si vous appelez Supabase directement
-- depuis le client ou pour cohérence RLS.
--
-- Exécuter dans Supabase → SQL Editor (une fois).
-- Prérequis : public.users.role = 'admin' pour les comptes admin.
-- ═══════════════════════════════════════════════════════════════════════════

-- Fonction admin (évite la récursion RLS sur public.users)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Politique DELETE : en plus de loads_delete_own (courtier propriétaire)
DROP POLICY IF EXISTS "loads_admin_delete" ON public.loads;

CREATE POLICY "loads_admin_delete" ON public.loads
  FOR DELETE
  USING (public.is_admin());

-- Vérification rapide (à lancer connecté en admin dans le SQL Editor, optionnel) :
-- SELECT public.is_admin();
