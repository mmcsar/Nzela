'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

interface LoadSearchProps {
  onSearch: (filters: LoadSearchFilters) => void;
  isLoading?: boolean;
}

export interface LoadSearchFilters {
  origin?: string;
  originRadius?: number;
  destination?: string;
  destinationRadius?: number;
  trailerType?: string;
  loadSize?: string;
  shipDate?: string;
  sortBy?: string;
  weight?: string;
  length?: string;
  minPrice?: number;
  maxPrice?: number;
}

export function LoadSearch({ onSearch, isLoading = false }: LoadSearchProps) {
  const [filters, setFilters] = useState<LoadSearchFilters>({
    origin: '',
    originRadius: 100,
    destination: '',
    destinationRadius: 100,
    trailerType: 'any',
    loadSize: 'all',
    shipDate: 'any',
    sortBy: 'age-newest',
    weight: 'all',
    length: 'all',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    const emptyFilters: LoadSearchFilters = {
      origin: '',
      originRadius: 100,
      destination: '',
      destinationRadius: 100,
      trailerType: 'any',
      loadSize: 'all',
      shipDate: 'any',
      sortBy: 'age-newest',
      weight: 'all',
      length: 'all',
    };
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Origin and Destination Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Origine
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ville, Province ou Code postal"
              value={filters.origin || ''}
              onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.originRadius || 100}
              onChange={(e) => setFilters({ ...filters, originRadius: Number(e.target.value) })}
            >
              <option value={50}>Radius: 50</option>
              <option value={100}>Radius: 100</option>
              <option value={200}>Radius: 200</option>
              <option value={500}>Radius: 500</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ville, Province ou Code postal"
              value={filters.destination || ''}
              onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.destinationRadius || 100}
              onChange={(e) => setFilters({ ...filters, destinationRadius: Number(e.target.value) })}
            >
              <option value={50}>Radius: 50</option>
              <option value={100}>Radius: 100</option>
              <option value={200}>Radius: 200</option>
              <option value={500}>Radius: 500</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de remorque
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.trailerType || 'any'}
            onChange={(e) => setFilters({ ...filters, trailerType: e.target.value })}
          >
            <option value="any">Tous</option>
            <option value="53ft">53 pieds</option>
            <option value="flatbed">Plateau</option>
            <option value="reefer">Frigorifique</option>
            <option value="van">Fourgon</option>
            <option value="tanker">Citerne</option>
            <option value="container">Conteneur</option>
            <option value="lowboy">Surbaisse</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Taille
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.loadSize || 'all'}
            onChange={(e) => setFilters({ ...filters, loadSize: e.target.value })}
          >
            <option value="all">Tous</option>
            <option value="full">Plein</option>
            <option value="partial">Partiel</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d&apos;expédition
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.shipDate || 'any'}
            onChange={(e) => setFilters({ ...filters, shipDate: e.target.value })}
          >
            <option value="any">Tous</option>
            <option value="today">Aujourd&apos;hui</option>
            <option value="tomorrow">Demain</option>
            <option value="this-week">Cette semaine</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trier par
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.sortBy || 'age-newest'}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          >
            <option value="age-newest">Âge (plus récent)</option>
            <option value="age-oldest">Âge (plus ancien)</option>
            <option value="price-high">Prix (plus élevé)</option>
            <option value="price-low">Prix (plus bas)</option>
            <option value="distance-short">Distance (plus courte)</option>
            <option value="distance-long">Distance (plus longue)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Poids
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.weight || 'all'}
            onChange={(e) => setFilters({ ...filters, weight: e.target.value })}
          >
            <option value="all">Tous</option>
            <option value="0-10000">0-10,000 kg</option>
            <option value="10000-20000">10,000-20,000 kg</option>
            <option value="20000-30000">20,000-30,000 kg</option>
            <option value="30000+">30,000+ kg</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Longueur
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.length || 'all'}
            onChange={(e) => setFilters({ ...filters, length: e.target.value })}
          >
            <option value="all">Tous</option>
            <option value="20">20ft</option>
            <option value="40">40ft</option>
            <option value="53">53ft</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          <Search className="w-4 h-4 mr-2" />
          Rechercher
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
        >
          Effacer le formulaire
        </Button>
      </div>
    </form>
  );
}

