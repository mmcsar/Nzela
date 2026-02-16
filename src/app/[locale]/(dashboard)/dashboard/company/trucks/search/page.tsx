'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Search, RefreshCw, Truck as TruckIcon, Bell, ArrowUpDown, ArrowUp, ArrowDown, Eye, MessageSquare } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';

interface TruckRow {
  id: string;
  company_id: string;
  type: string;
  capacity: number;
  current_location: any;
  destination: any;
  price: number;
  price_per_km: number;
  status: string;
  available_date: string;
  features: any;
  created_at: string;
  company?: { id: string; name: string; city: string; province: string };
}

export default function TruckSearchPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);
  const router = useRouter();
  const supabase = createClient();

  const [trucks, setTrucks] = useState<TruckRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minCapacity, setMinCapacity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Tri
  const [sortCol, setSortCol] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchTrucks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('trucks')
        .select('*, company:companies(id, name, city, province)')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        const msg = dbError.message || 'Erreur lors de la recherche de camions';
        setError(msg);
        throw new Error(msg);
      }

      setTrucks(data || []);
    } catch (err) {
      console.error('Error searching trucks:', err);
      setTrucks([]);
      if (!error) setError('Erreur lors de la recherche. Verifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, supabase, error]);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

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

  const formatShortDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('fr-CD', { day: '2-digit', month: '2-digit' }); }
    catch { return 'N/A'; }
  };

  // Filter local
  const filteredTrucks = trucks.filter((truck) => {
    const loc = parseLocation(truck.current_location);
    const dest = parseLocation(truck.destination);
    const term = searchTerm.toLowerCase();

    const matchesSearch = !term || (
      loc.city.toLowerCase().includes(term) ||
      dest.city.toLowerCase().includes(term) ||
      (truck.type || '').toLowerCase().includes(term) ||
      (truck.company?.name || '').toLowerCase().includes(term)
    );

    const matchesCapacity = !minCapacity || truck.capacity >= Number(minCapacity);
    const matchesPrice = !maxPrice || truck.price_per_km <= Number(maxPrice);

    return matchesSearch && matchesCapacity && matchesPrice;
  });

  // Sort
  const sortedTrucks = [...filteredTrucks].sort((a, b) => {
    let va: any, vb: any;
    switch (sortCol) {
      case 'location': va = parseLocation(a.current_location).city; vb = parseLocation(b.current_location).city; break;
      case 'dest': va = parseLocation(a.destination).city; vb = parseLocation(b.destination).city; break;
      case 'company': va = a.company?.name || ''; vb = b.company?.name || ''; break;
      default: va = a[sortCol as keyof TruckRow]; vb = b[sortCol as keyof TruckRow];
    }
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

  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TruckIcon className="w-7 h-7 text-primary-600" />
            Rechercher des camions
          </h1>
          <p className="text-gray-500 mt-1">Trouvez les camions disponibles sur le marche</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/tools')}>
            <Bell className="w-4 h-4 mr-2" />
            Alertes
          </Button>
          <Button variant="outline" onClick={fetchTrucks} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ville, type, entreprise..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tous les types</option>
            <option value="flatbed">Plateau</option>
            <option value="van">Fourgon</option>
            <option value="reefer">Frigorifique</option>
            <option value="tanker">Citerne</option>
            <option value="container">Conteneur</option>
            <option value="lowboy">Surbaisse</option>
          </select>
          <input
            type="number"
            placeholder="Capacite min (kg)"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
          />
          <input
            type="number"
            placeholder="Prix max/km (CDF)"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      {/* Compteur */}
      <div className="text-sm text-gray-500">
        {sortedTrucks.length} camion{sortedTrucks.length > 1 ? 's' : ''} disponible{sortedTrucks.length > 1 ? 's' : ''}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader col="created_at">Date</SortHeader>
                <SortHeader col="type">Type</SortHeader>
                <SortHeader col="location">Localisation</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Prov.</th>
                <SortHeader col="dest">Destination</SortHeader>
                <SortHeader col="capacity">Capacite</SortHeader>
                <SortHeader col="price_per_km">Prix/km</SortHeader>
                <SortHeader col="available_date">Disponible</SortHeader>
                <SortHeader col="company">Entreprise</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : sortedTrucks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <TruckIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    Aucun camion disponible
                  </td>
                </tr>
              ) : (
                sortedTrucks.map((truck) => {
                  const loc = parseLocation(truck.current_location);
                  const dest = parseLocation(truck.destination);
                  return (
                    <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(truck.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {truck.type || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {loc.city}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {loc.province ? loc.province.substring(0, 3).toUpperCase() : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {dest.city !== 'N/A' ? dest.city : 'Toute destination'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {truck.capacity ? truck.capacity.toLocaleString() : '0'} kg
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600 whitespace-nowrap">
                        {truck.price_per_km ? truck.price_per_km.toLocaleString() : '0'} CDF/km
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {truck.available_date ? formatShortDate(truck.available_date) : 'Maintenant'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {truck.company?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          <button
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Voir details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Contacter"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
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
