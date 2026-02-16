'use client';

import { useState, useEffect, useCallback } from 'react';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
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

      const response = await fetch(`/api/vehicles?${params}`);
      const data = await response.json();

      if (response.ok) {
        setVehicles(data.vehicles || []);
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
    const loc = v.current_location
      ? typeof v.current_location === 'string' ? JSON.parse(v.current_location) : v.current_location
      : {};
    return (
      (v.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Conditional return AFTER all hooks
  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-7 h-7 text-indigo-500" />
            Mes Vehicules
          </h1>
          <p className="text-gray-500 mt-1">Gerez vos vehicules legers (pickup, van, petit camion)</p>
        </div>
        <Link href="/dashboard/company/vehicles/post">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un vehicule
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par type ou ville..."
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
            <option value="available">Disponible</option>
            <option value="booked">Reserve</option>
            <option value="in-transit">En transit</option>
            <option value="maintenance">Maintenance</option>
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
          { label: 'Disponibles', value: vehicles.filter(v => v.status === 'available').length, color: 'text-emerald-600' },
          { label: 'Reserves', value: vehicles.filter(v => v.status === 'booked').length, color: 'text-blue-600' },
          { label: 'En transit', value: vehicles.filter(v => v.status === 'in-transit').length, color: 'text-amber-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
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
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
