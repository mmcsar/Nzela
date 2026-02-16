import { getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { CompanyManagement } from '@/components/admin/CompanyManagement';
import { getLocale } from 'next-intl/server';

export default async function AdminCompaniesPage() {
  const locale = await getLocale();
  const { user, role } = await getAuthUser();

  if (!user) return redirect({ href: '/login', locale });
  if (role !== 'admin') return redirect({ href: '/dashboard', locale });

  return <CompanyManagement />;
}




