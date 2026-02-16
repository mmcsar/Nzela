'use client';

import { Load } from '@/types';
import { Button } from '@/components/ui/Button';
import { Package, MapPin, Calendar, DollarSign, Truck } from 'lucide-react';

interface LoadDetailsProps {
  load: Load;
}

export function LoadDetails({ load }: LoadDetailsProps) {
  const origin = typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin;
  const destination = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{load.trailerType}</h1>
            <p className="text-gray-600 mt-2">
              Publié le {new Date(load.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            load.status === 'available' ? 'bg-green-100 text-green-800' :
            load.status === 'booked' ? 'bg-orange-100 text-orange-800' :
            load.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {load.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Origine</p>
                <p className="text-lg font-semibold">{origin.city}</p>
                <p className="text-sm text-gray-600">{origin.address}</p>
                <p className="text-sm text-gray-600">{origin.province}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Destination</p>
                <p className="text-lg font-semibold">{destination.city}</p>
                <p className="text-sm text-gray-600">{destination.address}</p>
                <p className="text-sm text-gray-600">{destination.province}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Distance</p>
                <p className="text-lg font-semibold">{load.distance} km</p>
                <p className="text-sm text-gray-600">Durée estimée: {load.duration}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Poids</p>
                <p className="text-2xl font-bold text-green-600">{load.weight.toLocaleString()} kg</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Prix total</p>
                <p className="text-2xl font-bold text-green-600">
                  {load.price.toLocaleString()} CDF
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {load.pricePerKm.toLocaleString()} CDF/km
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Date de ramassage</p>
                <p className="text-lg font-semibold">
                  {new Date(load.pickupDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Livraison: {new Date(load.deliveryDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {load.broker && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Courtier</p>
                <p className="text-lg font-semibold">{load.broker.name}</p>
                <p className="text-sm text-gray-600">{load.broker.city}, {load.broker.province}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex gap-4">
          <Button className="flex-1">
            Contacter le courtier
          </Button>
          <Button variant="outline">
            Réserver
          </Button>
        </div>
      </div>
    </div>
  );
}




