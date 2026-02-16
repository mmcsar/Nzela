'use client';

import { MapPin, Calendar, DollarSign, Car } from 'lucide-react';

interface VehicleCardProps {
  vehicle: any;
  onClick?: () => void;
}

export function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const location = vehicle.current_location
    ? typeof vehicle.current_location === 'string'
      ? JSON.parse(vehicle.current_location)
      : vehicle.current_location
    : {};

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    booked: 'bg-blue-100 text-blue-700',
    'in-transit': 'bg-amber-100 text-amber-700',
    maintenance: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    booked: 'Réservé',
    'in-transit': 'En transit',
    maintenance: 'Maintenance',
  };

  const typeLabels: Record<string, string> = {
    pickup: 'Pickup',
    van: 'Van / Fourgon',
    'small-truck': 'Petit camion',
    other: 'Autre',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{typeLabels[vehicle.type] || vehicle.type}</h3>
            <p className="text-sm text-gray-500">{vehicle.capacity?.toLocaleString()} kg</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[vehicle.status] || 'bg-gray-100 text-gray-700'}`}>
          {statusLabels[vehicle.status] || vehicle.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{location.city || 'N/A'}, {location.province || ''}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>
            {vehicle.available_date
              ? new Date(vehicle.available_date).toLocaleDateString('fr-CD')
              : 'Disponible maintenant'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span>{vehicle.price_per_km?.toLocaleString() || 0} CDF/km</span>
        </div>
      </div>

      {vehicle.features && vehicle.features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(Array.isArray(vehicle.features) ? vehicle.features : []).slice(0, 3).map((f: string, i: number) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
