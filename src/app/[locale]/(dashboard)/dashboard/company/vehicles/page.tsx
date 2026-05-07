'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Car, Plus, RefreshCw, Search } from 'lucide-react';
import { Link } from '@/lib/i18n/routing';
import { useRequireRole } from '@/hooks/useRequireRole';

export default function VehiclesPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['company', 'admin']);

  // ALL hooks must be called BEFORE any conditional return
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/company/vehicles?limit=100&${params}`);
      const data = await response.json();

      if (response.ok) {
        setVehicles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAuthorized) {
      fetchVehicles();
    }
  }, [isAuthorized, statusFilter, fetchVehicles]);

  const filteredVehicles = vehicles.filter((v) => {
    return (
      (v.registration_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Conditional return AFTER all hooks
  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  const loadingSkeletons = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-7 h-7 text-indigo-500" />
            Flotte camions
          </h1>
          <p className="text-gray-500 mt-1">Gerez vos camions (immat, configuration, PTAC/PTRA, kilometrage, statut)</p>
        </div>
        <Link href="/dashboard/company/vehicles/post">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un camion
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4 transition-shadow duration-200 hover:shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par immatriculation, marque ou modele..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg bg-white min-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="maintenance">Maintenance</option>
            <option value="immobilized">Immobilise</option>
            <option value="sold">Vendu</option>
          </select>
          <Button variant="outline" onClick={fetchVehicles} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: vehicles.length, color: 'text-gray-700' },
          { label: 'Actifs', value: vehicles.filter(v => v.status === 'active').length, color: 'text-emerald-600' },
          { label: 'Maintenance', value: vehicles.filter(v => v.status === 'maintenance').length, color: 'text-amber-600' },
          { label: 'Immobilises', value: vehicles.filter(v => v.status === 'immobilized').length, color: 'text-rose-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingSkeletons.map((idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 w-28 rounded bg-gray-200 mb-3" />
              <div className="h-3 w-44 rounded bg-gray-100 mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-gray-100" />
                <div className="h-3 w-36 rounded bg-gray-100" />
                <div className="h-3 w-28 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">Aucun vehicule</h3>
          <p className="text-gray-500 text-sm mt-1">Ajoutez votre premier vehicule pour commencer</p>
          <Link href="/dashboard/company/vehicles/post" className="mt-4 inline-block">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{vehicle.registration_number}</h3>
                  <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 transition-colors duration-200">
                  {vehicle.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Categorie: {vehicle.category || '-'}</p>
                <p>Kilometrage: {(vehicle.current_mileage_km || 0).toLocaleString()} km</p>
                <p>Config: {vehicle.truck_config || '-'}</p>
                <p>Carrosserie: {vehicle.body_type || '-'}</p>
                <p>PTAC/PTRA: {vehicle.ptac_tons ?? '-'} t / {vehicle.ptra_tons ?? '-'} t</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
