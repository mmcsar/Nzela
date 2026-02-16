'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter } from 'lucide-react';

interface TruckSearchProps {
  onSearch: (filters: TruckSearchFilters) => void;
  isLoading?: boolean;
}

export interface TruckSearchFilters {
  location?: string;
  destination?: string;
  type?: string;
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
}

export function TruckSearch({ onSearch, isLoading = false }: TruckSearchProps) {
  const [filters, setFilters] = useState<TruckSearchFilters>({
    location: '',
    destination: '',
    type: '',
    minCapacity: undefined,
    maxCapacity: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    const emptyFilters: TruckSearchFilters = {
      location: '',
      destination: '',
      type: '',
      minCapacity: undefined,
      maxCapacity: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    };
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Localisation actuelle"
            placeholder="Ville ou adresse"
            value={filters.location || ''}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
          <Input
            label="Destination souhaitée"
            placeholder="Ville ou adresse (optionnel)"
            value={filters.destination || ''}
            onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <Input
              label="Type de camion"
              placeholder="Ex: Plateau, Fourgon, Citerne"
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            />
            <Input
              label="Capacité min (kg)"
              type="number"
              value={filters.minCapacity || ''}
              onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              label="Prix min/km (CDF)"
              type="number"
              value={filters.minPrice || ''}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              label="Prix max/km (CDF)"
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            Rechercher
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
          >
            Réinitialiser
          </Button>
        </div>
      </form>
    </div>
  );
}


