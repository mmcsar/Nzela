import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { Link } from '@/lib/i18n/routing';
import { getLocale } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Truck, Plus, Search } from 'lucide-react';
import { truckTypeFr, truckStatusFr } from '@/lib/utils/translate-fr';

export default async function CompanyDashboardPage() {
  const locale = await getLocale();
  const { user } = await getAuthUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  const supabase = await createClient();

  // Get company_id
  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  let company = null;
  let trucks: any[] = [];
  let stats = {
    totalTrucks: 0,
    availableTrucks: 0,
    bookedTrucks: 0,
  };

  if (userData?.company_id) {
    const companyId = userData.company_id;
    const [companyRes, trucksAllRes, trucksRecentRes] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).single(),
      supabase.from('trucks').select('id, status').eq('company_id', companyId),
      supabase.from('trucks').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
    ]);

    company = companyRes.data;
    const allTrucks = trucksAllRes.data || [];
    trucks = trucksRecentRes.data || [];

    stats = {
      totalTrucks: allTrucks.length,
      availableTrucks: allTrucks.filter((t: any) => t.status === 'available').length,
      bookedTrucks: allTrucks.filter((t: any) => t.status === 'booked').length,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de bord - Entreprise</h1>
        {company && (
          <div className="text-right">
            <p className="text-sm text-gray-600">{company.name}</p>
            <p className="text-xs text-gray-500">{company.city}, {company.province}</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Camions</p>
              <p className="text-3xl font-bold text-primary-600">{stats.totalTrucks}</p>
            </div>
            <Truck className="w-12 h-12 text-primary-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-3xl font-bold text-green-600">{stats.availableTrucks}</p>
            </div>
            <Truck className="w-12 h-12 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reserves</p>
              <p className="text-3xl font-bold text-orange-600">{stats.bookedTrucks}</p>
            </div>
            <Truck className="w-12 h-12 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/loads/board">
            <Button className="w-full" size="lg">
              <Search className="w-5 h-5 mr-2" />
              Trouver un chargement
            </Button>
          </Link>
          <Link href="/dashboard/publish">
            <Button variant="outline" className="w-full" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Publier un camion
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Trucks */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mes camions recents</h2>
          <Link href="/dashboard/company/trucks">
            <Button variant="outline" size="sm">Voir tout</Button>
          </Link>
        </div>
        {trucks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun camion poste. <Link href="/dashboard/company/trucks/post" className="text-primary-600 hover:underline">Poster votre premier camion</Link>
          </p>
        ) : (
          <div className="space-y-4">
            {trucks.map((truck: any) => (
              <div key={truck.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{truckTypeFr(truck.type)}</h3>
                    <p className="text-sm text-gray-600">Capacite: {truck.capacity} kg</p>
                    <p className="text-sm text-gray-600">Prix: {truck.price} CDF/km</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    truck.status === 'available' ? 'bg-green-100 text-green-800' :
                    truck.status === 'booked' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {truckStatusFr(truck.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
