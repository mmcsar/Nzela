import { create } from 'zustand';

interface Load {
  id: string;
  [key: string]: any;
}

interface LoadFilters {
  search: string;
  status: string;
  minPrice: number | null;
  maxPrice: number | null;
  origin: string;
  destination: string;
}

interface LoadStore {
  // Data
  loads: Load[];
  selectedLoad: Load | null;
  favorites: Set<string>;

  // Filters
  filters: LoadFilters;

  // UI
  viewMode: 'table' | 'cards';
  sortBy: string;
  sortDirection: 'asc' | 'desc';

  // Actions
  setLoads: (loads: Load[]) => void;
  addLoad: (load: Load) => void;
  updateLoad: (id: string, updates: Partial<Load>) => void;
  removeLoad: (id: string) => void;
  setSelectedLoad: (load: Load | null) => void;

  // Filters
  setFilter: (key: keyof LoadFilters, value: any) => void;
  resetFilters: () => void;

  // Favorites
  toggleFavorite: (loadId: string) => void;
  isFavorite: (loadId: string) => boolean;

  // UI
  setViewMode: (mode: 'table' | 'cards') => void;
  setSort: (field: string) => void;
}

const defaultFilters: LoadFilters = {
  search: '',
  status: '',
  minPrice: null,
  maxPrice: null,
  origin: '',
  destination: '',
};

export const useLoadStore = create<LoadStore>((set, get) => ({
  loads: [],
  selectedLoad: null,
  favorites: new Set(),
  filters: { ...defaultFilters },
  viewMode: 'table',
  sortBy: 'created_at',
  sortDirection: 'desc',

  setLoads: (loads) => set({ loads }),
  addLoad: (load) => set((state) => ({ loads: [load, ...state.loads] })),
  updateLoad: (id, updates) =>
    set((state) => ({
      loads: state.loads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  removeLoad: (id) =>
    set((state) => ({
      loads: state.loads.filter((l) => l.id !== id),
    })),
  setSelectedLoad: (load) => set({ selectedLoad: load }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),

  toggleFavorite: (loadId) =>
    set((state) => {
      const newFavs = new Set(state.favorites);
      if (newFavs.has(loadId)) {
        newFavs.delete(loadId);
      } else {
        newFavs.add(loadId);
      }
      return { favorites: newFavs };
    }),
  isFavorite: (loadId) => get().favorites.has(loadId),

  setViewMode: (mode) => set({ viewMode: mode }),
  setSort: (field) =>
    set((state) => ({
      sortBy: field,
      sortDirection: state.sortBy === field && state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),
}));
