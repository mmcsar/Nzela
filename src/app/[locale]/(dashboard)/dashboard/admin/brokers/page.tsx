import { getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { BrokerManagement } from '@/components/admin/BrokerManagement';
import { getLocale } from 'next-intl/server';

export default async function AdminBrokersPage() {
  const locale = await getLocale();
  const { user, role } = await getAuthUser();

  if (!user) return redirect({ href: '/login', locale });
  if (role !== 'admin') return redirect({ href: '/dashboard', locale });

  return <BrokerManagement />;
}




