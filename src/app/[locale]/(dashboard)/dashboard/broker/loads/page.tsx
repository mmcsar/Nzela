'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Plus, Eye, RefreshCw, Search, Package, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useRealtimeLoads } from '@/hooks/useRealtimeLoads';

interface LoadRow {
  id: string;
  trailer_type: string;
  cargo_type?: string;
  origin: any;
  destination: any;
  weight: number;
  distance: number;
  price: number;
  price_per_km: number;
  status: string;
  pickup_date: string;
  created_at: string;
}

export default function LoadsPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'admin']);
  const router = useRouter();
  const supabase = createClient();

  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortCol, setSortCol] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchLoads = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: userData } = await supabase
        .from('users')
        .select('broker_id')
        .eq('id', user.id)
        .single();

      if (!userData?.broker_id) {
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('loads')
        .select('*')
        .eq('broker_id', userData.broker_id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLoads(data || []);
    } catch (error) {
      console.error('Error fetching loads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, supabase, router]);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  // WebSocket Realtime : mises à jour instantanées sur les loads
  useRealtimeLoads(fetchLoads);

  // Parsing helpers
  const parseLocation = (loc: any) => {
    if (!loc) return { city: 'N/A', province: '' };
    try {
      const parsed = typeof loc === 'string' ? JSON.parse(loc) : loc;
      return { city: parsed?.city || 'N/A', province: parsed?.province || '' };
    } catch { return { city: 'N/A', province: '' }; }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('fr-CD', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return 'N/A'; }
  };

  const formatPrice = (v: number) => v ? v.toLocaleString() + ' CDF' : '0 CDF';

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: 'bg-emerald-100 text-emerald-700',
      booked: 'bg-orange-100 text-orange-700',
      'in-transit': 'bg-blue-100 text-blue-700',
      delivered: 'bg-purple-100 text-purple-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      available: 'Disponible',
      booked: 'Reserve',
      'in-transit': 'En transit',
      delivered: 'Livre',
      completed: 'Termine',
      cancelled: 'Annule',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Filter
  const filteredLoads = loads.filter((load) => {
    const origin = parseLocation(load.origin);
    const dest = parseLocation(load.destination);
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      origin.city.toLowerCase().includes(term) ||
      dest.city.toLowerCase().includes(term) ||
      (load.trailer_type || '').toLowerCase().includes(term) ||
      load.id.toLowerCase().includes(term)
    );
  });

  // Sort
  const sortedLoads = [...filteredLoads].sort((a, b) => {
    let va: any = a[sortCol as keyof LoadRow];
    let vb: any = b[sortCol as keyof LoadRow];
    if (sortCol === 'origin_city') { va = parseLocation(a.origin).city; vb = parseLocation(b.origin).city; }
    if (sortCol === 'dest_city') { va = parseLocation(a.destination).city; vb = parseLocation(b.destination).city; }
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (col: string) => {
    if (sortCol === col) { setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortHeader = ({ col, children }: { col: string; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
      onClick={() => toggleSort(col)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortCol === col ? (
          sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-300" />
        )}
      </div>
    </th>
  );

  // Stats
  const stats = [
    { label: 'Total', value: loads.length, color: 'text-gray-700' },
    { label: 'Disponibles', value: loads.filter(l => l.status === 'available').length, color: 'text-emerald-600' },
    { label: 'En transit', value: loads.filter(l => l.status === 'in-transit' || l.status === 'booked').length, color: 'text-blue-600' },
    { label: 'Termines', value: loads.filter(l => l.status === 'completed' || l.status === 'delivered').length, color: 'text-purple-600' },
  ];

  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-primary-600" />
            Mes chargements
          </h1>
          <p className="text-gray-500 mt-1">Gerez vos chargements publies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLoads} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => router.push('/dashboard/broker/loads/post')}>
            <Plus className="w-4 h-4 mr-2" />
            Publier
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par ville, type, ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="booked">Reserve</option>
            <option value="in-transit">En transit</option>
            <option value="delivered">Livre</option>
            <option value="completed">Termine</option>
            <option value="cancelled">Annule</option>
          </select>
        </div>
      </div>

      {/* Compteur */}
      <div className="text-sm text-gray-500">
        {sortedLoads.length} chargement{sortedLoads.length > 1 ? 's' : ''} affiche{sortedLoads.length > 1 ? 's' : ''}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader col="created_at">Date</SortHeader>
                <SortHeader col="trailer_type">Type</SortHeader>
                <SortHeader col="origin_city">Origine</SortHeader>
                <SortHeader col="dest_city">Destination</SortHeader>
                <SortHeader col="weight">Poids</SortHeader>
                <SortHeader col="distance">Distance</SortHeader>
                <SortHeader col="price">Prix</SortHeader>
                <SortHeader col="price_per_km">Prix/km</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <SortHeader col="pickup_date">Ramassage</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : sortedLoads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    Aucun chargement trouve
                  </td>
                </tr>
              ) : (
                sortedLoads.map((load) => {
                  const origin = parseLocation(load.origin);
                  const dest = parseLocation(load.destination);
                  return (
                    <tr
                      key={load.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/loads/${load.id}`)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(load.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        <div>
                          {load.trailer_type && <span>{load.trailer_type}</span>}
                          {load.cargo_type && (
                            <div className="text-xs text-primary-600 font-medium mt-0.5">
                              {load.cargo_type.replace(/_/g, ' ')}
                            </div>
                          )}
                          {!load.trailer_type && !load.cargo_type && 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span className="font-medium text-gray-900">{origin.city}</span>
                        {origin.province && (
                          <span className="ml-1 text-gray-400 text-xs">{origin.province.substring(0, 3).toUpperCase()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span className="font-medium text-gray-900">{dest.city}</span>
                        {dest.province && (
                          <span className="ml-1 text-gray-400 text-xs">{dest.province.substring(0, 3).toUpperCase()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {load.weight ? load.weight.toLocaleString() : '0'} kg
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {load.distance || 0} km
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600 whitespace-nowrap">
                        {formatPrice(load.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {load.price_per_km ? load.price_per_km.toLocaleString() : '0'} CDF/km
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(load.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {load.pickup_date ? formatDate(load.pickup_date) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Voir details"
                          onClick={() => router.push(`/dashboard/loads/${load.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
