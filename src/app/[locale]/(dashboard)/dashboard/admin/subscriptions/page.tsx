import { getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { SubscriptionManagement } from '@/components/admin/SubscriptionManagement';
import { getLocale } from 'next-intl/server';

export default async function AdminSubscriptionsPage() {
  const locale = await getLocale();
  const { user, role } = await getAuthUser();

  if (!user) return redirect({ href: '/login', locale });
  if (role !== 'admin') return redirect({ href: '/dashboard', locale });

  return <SubscriptionManagement />;
}




