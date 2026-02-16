import { create } from 'zustand';

interface Truck {
  id: string;
  [key: string]: any;
}

interface TruckFilters {
  search: string;
  status: string;
  type: string;
  minCapacity: number | null;
  maxPrice: number | null;
}

interface TruckStore {
  trucks: Truck[];
  selectedTruck: Truck | null;
  filters: TruckFilters;
  sortBy: string;
  sortDirection: 'asc' | 'desc';

  setTrucks: (trucks: Truck[]) => void;
  addTruck: (truck: Truck) => void;
  updateTruck: (id: string, updates: Partial<Truck>) => void;
  removeTruck: (id: string) => void;
  setSelectedTruck: (truck: Truck | null) => void;
  setFilter: (key: keyof TruckFilters, value: any) => void;
  resetFilters: () => void;
  setSort: (field: string) => void;
}

const defaultFilters: TruckFilters = {
  search: '',
  status: '',
  type: '',
  minCapacity: null,
  maxPrice: null,
};

export const useTruckStore = create<TruckStore>((set) => ({
  trucks: [],
  selectedTruck: null,
  filters: { ...defaultFilters },
  sortBy: 'created_at',
  sortDirection: 'desc',

  setTrucks: (trucks) => set({ trucks }),
  addTruck: (truck) => set((state) => ({ trucks: [truck, ...state.trucks] })),
  updateTruck: (id, updates) =>
    set((state) => ({
      trucks: state.trucks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTruck: (id) =>
    set((state) => ({
      trucks: state.trucks.filter((t) => t.id !== id),
    })),
  setSelectedTruck: (truck) => set({ selectedTruck: truck }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  setSort: (field) =>
    set((state) => ({
      sortBy: field,
      sortDirection: state.sortBy === field && state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),
}));
