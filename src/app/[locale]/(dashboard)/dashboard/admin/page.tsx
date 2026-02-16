import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect, Link } from '@/lib/i18n/routing';
import { getLocale } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Users, Building2, Package, Truck, CreditCard, Settings } from 'lucide-react';

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const { user, role } = await getAuthUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  if (role !== 'admin') {
    return redirect({ href: '/dashboard', locale });
  }

  // Get stats - all in parallel (1 round-trip)
  const supabase = await createClient();
  const [companiesResult, brokersResult, trucksResult, loadsResult] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact' }),
    supabase.from('brokers').select('id', { count: 'exact' }),
    supabase.from('trucks').select('id', { count: 'exact' }),
    supabase.from('loads').select('id', { count: 'exact' }),
  ]);

  const stats = {
    companies: companiesResult.count || 0,
    brokers: brokersResult.count || 0,
    trucks: trucksResult.count || 0,
    loads: loadsResult.count || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord - Administrateur</h1>
          <p className="text-gray-600 mt-1">MMC SARL - Gestion de la plateforme</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entreprises</p>
              <p className="text-3xl font-bold text-primary-600">{stats.companies}</p>
            </div>
            <Building2 className="w-12 h-12 text-primary-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Courtiers</p>
              <p className="text-3xl font-bold text-blue-600">{stats.brokers}</p>
            </div>
            <Users className="w-12 h-12 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Camions</p>
              <p className="text-3xl font-bold text-green-600">{stats.trucks}</p>
            </div>
            <Truck className="w-12 h-12 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chargements</p>
              <p className="text-3xl font-bold text-orange-600">{stats.loads}</p>
            </div>
            <Package className="w-12 h-12 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/admin/companies">
          <div className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 cursor-pointer">
            <Building2 className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Gérer les entreprises</h3>
            <p className="text-sm text-gray-600">Voir et gérer toutes les entreprises inscrites</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/users">
          <div className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 cursor-pointer">
            <Users className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Gérer les utilisateurs</h3>
            <p className="text-sm text-gray-600">Voir et gérer tous les utilisateurs</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/brokers">
          <div className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 cursor-pointer">
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Gérer les courtiers</h3>
            <p className="text-sm text-gray-600">Voir et gérer tous les courtiers inscrits</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/trucks">
          <div className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 cursor-pointer">
            <Truck className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Voir tous les camions</h3>
            <p className="text-sm text-gray-600">Consulter tous les camions postés</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/loads">
          <div className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 cursor-pointer">
            <Package className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Voir tous les chargements</h3>
            <p className="text-sm text-gray-600">Consulter tous les chargements postés</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/subscriptions">
          <div className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 cursor-pointer">
            <CreditCard className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Gérer les abonnements</h3>
            <p className="text-sm text-gray-600">Voir et gérer tous les abonnements</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/settings">
          <div className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 cursor-pointer">
            <Settings className="w-8 h-8 text-gray-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Paramètres</h3>
            <p className="text-sm text-gray-600">Configurer la plateforme</p>
          </div>
        </Link>
      </div>
    </div>
  );
}




