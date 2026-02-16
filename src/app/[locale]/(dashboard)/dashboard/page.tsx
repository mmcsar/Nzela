import { getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { getLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/routing';

export default async function DashboardPage() {
  const locale = await getLocale();
  const { user, role } = await getAuthUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  // Redirect based on role
  if (role === 'admin') {
    return redirect({ href: '/dashboard/admin', locale });
  } else if (role === 'company') {
    return redirect({ href: '/dashboard/company', locale });
  } else if (role === 'broker') {
    return redirect({ href: '/dashboard/broker', locale });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Bienvenue sur votre tableau de bord</h2>
        <p className="text-gray-600 mb-6">
          Selectionnez votre type de compte pour acceder a votre espace.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/company">
            <div className="border rounded-lg p-6 hover:bg-gray-50 cursor-pointer">
              <h3 className="text-lg font-semibold mb-2">Entreprise</h3>
              <p className="text-sm text-gray-600">Gerer vos camions et vehicules</p>
            </div>
          </Link>
          <Link href="/dashboard/broker">
            <div className="border rounded-lg p-6 hover:bg-gray-50 cursor-pointer">
              <h3 className="text-lg font-semibold mb-2">Courtier</h3>
              <p className="text-sm text-gray-600">Gerer vos chargements</p>
            </div>
          </Link>
          <Link href="/dashboard/admin">
            <div className="border rounded-lg p-6 hover:bg-gray-50 cursor-pointer">
              <h3 className="text-lg font-semibold mb-2">Administrateur</h3>
              <p className="text-sm text-gray-600">Gerer la plateforme</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
