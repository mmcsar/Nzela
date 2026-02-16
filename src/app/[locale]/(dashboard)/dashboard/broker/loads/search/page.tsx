'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Search, RefreshCw, Bell, Package, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { truckTypeFr } from '@/lib/utils/translate-fr';

interface LoadRow {
  id: string;
  trailer_type: string;
  origin: any;
  destination: any;
  weight: number;
  distance: number;
  price: number;
  price_per_km: number;
  status: string;
  pickup_date: string;
  created_at: string;
  broker_id: string;
}

export default function LoadSearchPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);
  const router = useRouter();
  const supabase = createClient();

  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Tri
  const [sortCol, setSortCol] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchLoads = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('loads')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('trailer_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLoads(data || []);
    } catch (error) {
      console.error('Error searching loads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, supabase]);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

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

  // Filter local
  const filteredLoads = loads.filter((load) => {
    const origin = parseLocation(load.origin);
    const dest = parseLocation(load.destination);
    const term = searchTerm.toLowerCase();

    const matchesSearch = !term || (
      origin.city.toLowerCase().includes(term) ||
      dest.city.toLowerCase().includes(term) ||
      (load.trailer_type || '').toLowerCase().includes(term) ||
      load.id.toLowerCase().includes(term)
    );

    const matchesPrice =
      (!minPrice || load.price >= Number(minPrice)) &&
      (!maxPrice || load.price <= Number(maxPrice));

    return matchesSearch && matchesPrice;
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

  const handleSearch = () => {
    fetchLoads();
  };

  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="w-7 h-7 text-primary-600" />
            Rechercher des chargements
          </h1>
          <p className="text-gray-500 mt-1">Trouvez les chargements disponibles sur le marche</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/tools')}>
            <Bell className="w-4 h-4 mr-2" />
            Alertes
          </Button>
          <Button variant="outline" onClick={handleSearch} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ville, type, ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); }}
          >
            <option value="all">Tous les types</option>
            <option value="flatbed">Plateau</option>
            <option value="van">Fourgon</option>
            <option value="reefer">Frigorifique</option>
            <option value="tanker">Citerne</option>
            <option value="container">Conteneur</option>
            <option value="lowboy">Surbaisse</option>
            <option value="step-deck">Plateau surbaisse</option>
            <option value="benne">Benne</option>
            <option value="porte-char">Porte-char</option>
            <option value="53ft">53 pieds</option>
          </select>
          <input
            type="number"
            placeholder="Prix min (CDF)"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Prix max (CDF)"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      {/* Compteur */}
      <div className="text-sm text-gray-500">
        {sortedLoads.length} chargement{sortedLoads.length > 1 ? 's' : ''} disponible{sortedLoads.length > 1 ? 's' : ''}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader col="created_at">Date</SortHeader>
                <SortHeader col="origin_city">Origine</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Prov.</th>
                <SortHeader col="dest_city">Destination</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Prov.</th>
                <SortHeader col="trailer_type">Type</SortHeader>
                <SortHeader col="weight">Poids</SortHeader>
                <SortHeader col="distance">Distance</SortHeader>
                <SortHeader col="price">Prix</SortHeader>
                <SortHeader col="price_per_km">Prix/km</SortHeader>
                <SortHeader col="pickup_date">Ramassage</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : sortedLoads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    Aucun chargement disponible
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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {origin.city}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {origin.province ? origin.province.substring(0, 3).toUpperCase() : ''}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {dest.city}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {dest.province ? dest.province.substring(0, 3).toUpperCase() : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {load.trailer_type ? truckTypeFr(load.trailer_type) : 'N/A'}
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
