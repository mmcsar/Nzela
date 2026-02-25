-- Corrige la récursion infinie sur la table users : la policy "Admin can read all"
-- qui fait EXISTS (SELECT FROM users ...) relance RLS sur users. Il faut utiliser
-- une fonction SECURITY DEFINER is_admin() qui lit users sans repasser par RLS.

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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Remplacer la policy qui cause la récursion par une utilisant is_admin()
DROP POLICY IF EXISTS "Admin can read all" ON public.users;
CREATE POLICY "Admin can read all" ON public.users
  FOR SELECT USING (public.is_admin());

-- Si vous aviez "Admin can read all users" (migration.sql)
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
CREATE POLICY "Admin can read all users" ON public.users
  FOR SELECT USING (public.is_admin());
