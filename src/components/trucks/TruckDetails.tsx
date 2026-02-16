'use client';

import { Truck } from '@/types';
import { Button } from '@/components/ui/Button';
import { Truck as TruckIcon, MapPin, Calendar, DollarSign, Package } from 'lucide-react';
import Link from 'next/link';

interface TruckDetailsProps {
  truck: Truck;
}

// Normalise les champs snake_case (Supabase) vers camelCase
function getTruckField<T>(truck: any, camel: string, snake: string): T {
  return truck[camel] ?? truck[snake];
}

export function TruckDetails({ truck }: TruckDetailsProps) {
  const rawLoc = getTruckField(truck, 'currentLocation', 'current_location');
  let currentLocation: { city?: string; address?: string; province?: string } | null = null;
  try {
    if (typeof rawLoc === 'string') currentLocation = JSON.parse(rawLoc);
    else if (rawLoc && typeof rawLoc === 'object') currentLocation = rawLoc;
  } catch { /* ignore */ }
  currentLocation = currentLocation ?? { city: '', address: '', province: '' };

  const rawDest = truck.destination ?? (truck as any).destination;
  let destination: { city?: string; address?: string; province?: string } | null = null;
  try {
    if (rawDest) {
      if (typeof rawDest === 'string') destination = JSON.parse(rawDest);
      else if (typeof rawDest === 'object') destination = rawDest;
    }
  } catch { /* ignore */ }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{truck.type}</h1>
            <p className="text-gray-600 mt-2">
              Publié le {(getTruckField(truck, 'createdAt', 'created_at')
                ? new Date(getTruckField(truck, 'createdAt', 'created_at') as string).toLocaleDateString('fr-FR')
                : '—')}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            truck.status === 'available' ? 'bg-green-100 text-green-800' :
            truck.status === 'booked' ? 'bg-orange-100 text-orange-800' :
            truck.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {truck.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Localisation actuelle</p>
                <p className="text-lg font-semibold">{currentLocation.city || '—'}</p>
                {currentLocation.address && <p className="text-sm text-gray-600">{currentLocation.address}</p>}
                {currentLocation.province && <p className="text-sm text-gray-600">{currentLocation.province}</p>}
              </div>
            </div>

            {destination && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Destination souhaitée</p>
                  <p className="text-lg font-semibold">{destination.city || '—'}</p>
                  {destination.address && <p className="text-sm text-gray-600">{destination.address}</p>}
                  {destination.province && <p className="text-sm text-gray-600">{destination.province}</p>}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Disponible à partir de</p>
                <p className="text-lg font-semibold">
                  {getTruckField(truck, 'availableDate', 'available_date')
                  ? new Date(getTruckField(truck, 'availableDate', 'available_date') as string).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Capacité</p>
                <p className="text-2xl font-bold text-green-600">{(truck.capacity ?? (truck as any).capacity ?? 0).toLocaleString()} kg</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Prix par km</p>
                <p className="text-2xl font-bold text-green-600">
                  {(getTruckField(truck, 'pricePerKm', 'price_per_km') ?? 0).toLocaleString()} CDF/km
                </p>
                {(truck.price ?? (truck as any).price ?? 0) > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Prix fixe: {(truck.price ?? (truck as any).price ?? 0).toLocaleString()} CDF
                  </p>
                )}
              </div>
            </div>

            {truck.company && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Entreprise</p>
                <p className="text-lg font-semibold">{truck.company.name}</p>
                <p className="text-sm text-gray-600">{truck.company.city}, {truck.company.province}</p>
              </div>
            )}
          </div>
        </div>

        {truck.features && truck.features.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium text-gray-500 mb-3">Équipements et caractéristiques</p>
            <div className="flex flex-wrap gap-2">
              {truck.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t flex gap-4">
          <Button className="flex-1">
            Contacter l&apos;entreprise
          </Button>
          <Button variant="outline">
            Réserver
          </Button>
        </div>
      </div>
    </div>
  );
}




