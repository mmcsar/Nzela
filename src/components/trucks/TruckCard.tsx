'use client';

import React from 'react';
import { Truck } from '@/types';
import { Button } from '@/components/ui/Button';
import { Truck as TruckIcon, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Link } from '@/lib/i18n/routing';

// Traduction des types de camions (anglais -> francais)
const TRUCK_TYPE_FR: Record<string, string> = {
  'flatbed': 'Plateau',
  'van': 'Fourgon',
  'reefer': 'Frigorifique',
  'tanker': 'Citerne',
  'container': 'Conteneur',
  'lowboy': 'Surbaisse',
  'step-deck': 'Plateau surbaisse',
  'benne': 'Benne',
  'porte-char': 'Porte-char',
  '53ft': '53 pieds',
};

const TRUCK_STATUS_FR: Record<string, string> = {
  'available': 'Disponible',
  'booked': 'Reserve',
  'in-transit': 'En transit',
  'maintenance': 'Maintenance',
};

function translateType(type: string): string {
  return TRUCK_TYPE_FR[type.toLowerCase()] || type;
}

function translateStatus(status: string): string {
  return TRUCK_STATUS_FR[status] || status;
}

interface TruckCardProps {
  truck: Truck;
  showActions?: boolean;
}

export const TruckCard = React.memo(function TruckCard({ truck, showActions = true }: TruckCardProps) {
  // Parse currentLocation safely
  let currentLocation: any = null;
  try {
    if (typeof truck.currentLocation === 'string') {
      currentLocation = JSON.parse(truck.currentLocation);
    } else {
      currentLocation = truck.currentLocation;
    }
  } catch (e) {
    currentLocation = { city: 'N/A', address: '', province: 'haut-katanga' };
  }
  
  if (!currentLocation) {
    currentLocation = { city: 'N/A', address: '', province: 'haut-katanga' };
  }

  // Parse destination safely
  let destination: any = null;
  if (truck.destination) {
    try {
      if (typeof truck.destination === 'string') {
        destination = JSON.parse(truck.destination);
      } else {
        destination = truck.destination;
      }
    } catch (e) {
      destination = null;
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <TruckIcon className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold">{translateType(truck.type)}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          truck.status === 'available' ? 'bg-green-100 text-green-800' :
          truck.status === 'booked' ? 'bg-orange-100 text-orange-800' :
          truck.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {translateStatus(truck.status)}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-1" />
          <div>
            <p className="text-sm font-medium text-gray-900">Localisation actuelle</p>
            <p className="text-sm text-gray-600">
              {currentLocation?.address ? `${currentLocation.address}, ` : ''}{currentLocation?.city || 'N/A'}
            </p>
          </div>
        </div>
        {destination && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-900">Destination souhaitée</p>
              <p className="text-sm text-gray-600">
                {destination?.address ? `${destination.address}, ` : ''}{destination?.city || 'N/A'}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Disponible: {truck.availableDate ? new Date(truck.availableDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
          </div>
          <span>Capacité: {truck.capacity ? truck.capacity.toLocaleString() : '0'} kg</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-600">
              {truck.pricePerKm ? truck.pricePerKm.toLocaleString() : '0'} CDF/km
            </span>
          </div>
        </div>
        {truck.features && truck.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {truck.features.map((feature, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex gap-2">
          <Link href={`/dashboard/company/trucks/${truck.id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              Voir détails
            </Button>
          </Link>
          {truck.status === 'available' && (
            <Button className="flex-1" size="sm">
              Contacter
            </Button>
          )}
        </div>
      )}
    </div>
  );
});


