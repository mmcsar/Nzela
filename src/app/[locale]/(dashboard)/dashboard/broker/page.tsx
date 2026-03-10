import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect, Link } from '@/lib/i18n/routing';
import { getLocale } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Package, Plus, Search, FileText } from 'lucide-react';
import { truckTypeFr, loadStatusFr } from '@/lib/utils/translate-fr';

export default async function BrokerDashboardPage() {
  const locale = await getLocale();
  const { user } = await getAuthUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  const supabase = await createClient();

  // Get broker_id
  const { data: userData } = await supabase
    .from('users')
    .select('broker_id')
    .eq('id', user.id)
    .single();

  let broker = null;
  let loads: any[] = [];
  let stats = {
    totalLoads: 0,
    availableLoads: 0,
    bookedLoads: 0,
    totalBols: 0,
  };

  if (userData?.broker_id) {
    const brokerId = userData.broker_id;
    const [brokerRes, loadsRes] = await Promise.all([
      supabase.from('brokers').select('*').eq('id', brokerId).single(),
      supabase.from('loads').select('id, status, created_at, trailer_type, distance, price').eq('broker_id', brokerId).order('created_at', { ascending: false }),
    ]);

    broker = brokerRes.data;
    const allLoads = loadsRes.data || [];
    loads = allLoads.slice(0, 5);

    let bolCount = 0;
    if (allLoads.length > 0) {
      const loadIds = allLoads.map((l: any) => l.id);
      const { count } = await supabase.from('bols').select('id', { count: 'exact', head: true }).in('load_id', loadIds);
      bolCount = count ?? 0;
    }

    stats = {
      totalLoads: allLoads.length,
      availableLoads: allLoads.filter((l: any) => l.status === 'available').length,
      bookedLoads: allLoads.filter((l: any) => l.status === 'booked').length,
      totalBols: bolCount,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de bord - Courtier</h1>
        {broker && (
          <div className="text-right">
            <p className="text-sm text-gray-600">{broker.name}</p>
            <p className="text-xs text-gray-500">{broker.city}, {broker.province}</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Chargements</p>
              <p className="text-3xl font-bold text-primary-600">{stats.totalLoads}</p>
            </div>
            <Package className="w-12 h-12 text-primary-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-3xl font-bold text-green-600">{stats.availableLoads}</p>
            </div>
            <Package className="w-12 h-12 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Réservés</p>
              <p className="text-3xl font-bold text-orange-600">{stats.bookedLoads}</p>
            </div>
            <Package className="w-12 h-12 text-orange-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bordereaux (BOL)</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalBols}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/publish">
            <Button className="w-full" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Publier un chargement
            </Button>
          </Link>
          <Link href="/dashboard/loads/board">
            <Button variant="outline" className="w-full" size="lg">
              <Search className="w-5 h-5 mr-2" />
              Voir Load Board
            </Button>
          </Link>
          <Link
            href="/dashboard/broker/bol/create"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 font-medium rounded-lg border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Créer un BOL
          </Link>
        </div>
      </div>

      {/* Recent Loads */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mes chargements récents</h2>
          <Link href="/dashboard/broker/loads">
            <Button variant="outline" size="sm">Voir tout</Button>
          </Link>
        </div>
        {loads.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun chargement posté. <Link href="/dashboard/publish" className="text-primary-600 hover:underline">Publier votre premier chargement</Link>
          </p>
        ) : (
          <div className="space-y-4">
            {loads.map((load: any) => (
              <div key={load.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{truckTypeFr(load.trailer_type)}</h3>
                    <p className="text-sm text-gray-600">Distance: {load.distance} km</p>
                    <p className="text-sm text-gray-600">Prix: {load.price} CDF</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    load.status === 'available' ? 'bg-green-100 text-green-800' :
                    load.status === 'booked' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {loadStatusFr(load.status)}
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




