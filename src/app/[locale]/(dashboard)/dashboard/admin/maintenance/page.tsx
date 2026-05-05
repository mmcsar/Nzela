import { getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { getLocale } from 'next-intl/server';
import { AdminMaintenanceOverview } from '@/components/admin/AdminMaintenanceOverview';

export default async function AdminMaintenancePage() {
  const locale = await getLocale();
  const { user, role } = await getAuthUser();

  if (!user) return redirect({ href: '/login', locale });
  if (role !== 'admin') return redirect({ href: '/dashboard', locale });

  return <AdminMaintenanceOverview />;
}
