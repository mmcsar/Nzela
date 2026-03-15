'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import {
  Search, RefreshCw, Plus, Eye, Truck, MapPin, Filter, X, Download,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DollarSign,
  Scale, Star, Sparkles, LayoutGrid, LayoutList, ChevronDown,
  Phone, MessageSquare, CalendarClock, XCircle, Map, Building2,
  Wrench, Gauge, Mail,
} from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';

// ══════════════════════════════════════════
// INTERFACES & CONSTANTS
// ══════════════════════════════════════════
interface TruckRow {
  id: string;
  created_at: string;
  type: string;
  capacity: number;
  location_city: string;
  location_province: string;
  dest_city: string;
  dest_province: string;
  price: number;
  price_per_km: number;
  available_date: string;
  status: string;
  features: string[];
  company_name: string;
  company_phone?: string;
  company_email?: string;
  company_city?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  available: { label: 'Disponible', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  booked: { label: 'Reserve', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  'in-transit': { label: 'En transit', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  maintenance: { label: 'Maintenance', bg: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

const PAGE_SIZE = 25;
const FETCH_LIMIT = 80;

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function isNew(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) < 3600000;
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'A l\'instant';
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function formatPrice(price: number) {
  if (!price) return '—';
  return price.toLocaleString('fr-FR') + ' CDF';
}

function formatWeight(w: number) {
  if (!w) return '—';
  if (w >= 1000) return (w / 1000).toFixed(1) + ' T';
  return w.toLocaleString('fr-FR') + ' kg';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { message?: string; details?: string; hint?: string; code?: string };
    return maybeError.message || maybeError.details || maybeError.hint || maybeError.code || 'Erreur inconnue';
  }
  return String(error);
}

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════
export default function TruckBoardPage() {
  const t = useTranslations('truckBoard');
  const { isLoading: authLoading, isAuthorized, authError, role } = useRequireRole(['broker', 'company', 'admin']);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const statusLabel = (s: string) => {
    if (s === 'all') return t('all');
    if (s === 'available') return t('available');
    if (s === 'booked') return t('booked');
    if (s === 'in-transit') return t('inTransit');
    if (s === 'maintenance') return t('maintenance');
    return s;
  };
  const trailerLabel = (value: string) => {
    const key: Record<string, string> = { '': 'allTypes', flatbed: 'trailerFlatbed', van: 'trailerVan', reefer: 'trailerReefer', tanker: 'trailerTanker', container: 'trailerContainer', benne: 'trailerBenne', lowboy: 'trailerLowboy' };
    const k = key[value] || 'allTypes';
    return t(k as 'allTypes' | 'trailerFlatbed' | 'trailerVan' | 'trailerReefer' | 'trailerTanker' | 'trailerContainer' | 'trailerBenne' | 'trailerLowboy');
  };

  const [trucks, setTrucks] = useState<TruckRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const userRole = role ?? '';
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [previewTruck, setPreviewTruck] = useState<TruckRow | null>(null);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    city: '', type: '', status: 'available', search: '',
    minCapacity: '', maxCapacity: '', minPrice: '', maxPrice: '',
  });

  const [sortCol, setSortCol] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadFavorites = useCallback(() => {
    try {
      const saved = localStorage.getItem('nzela_truck_favorites');
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch { /* */ }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem('nzela_truck_favorites', JSON.stringify([...next])); } catch { /* */ }
      return next;
    });
  };

  const fetchTrucks = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from('trucks')
        .select(`
          id,
          created_at,
          type,
          capacity,
          current_location,
          destination,
          price,
          price_per_km,
          available_date,
          status,
          features,
          company:companies(name, phone, email, city)
        `)
        .order('created_at', { ascending: false })
        .limit(FETCH_LIMIT);

      if (error) throw error;

      const rows: TruckRow[] = (data || []).map((truck: any) => {
        let loc = { city: '', province: '' };
        let dest = { city: '', province: '' };
        try {
          loc = typeof truck.current_location === 'string' ? JSON.parse(truck.current_location) : (truck.current_location || {});
          dest = typeof truck.destination === 'string' ? JSON.parse(truck.destination) : (truck.destination || {});
        } catch { /* */ }

        return {
          id: truck.id,
          created_at: truck.created_at,
          type: truck.type || '',
          capacity: truck.capacity || 0,
          location_city: loc.city || '',
          location_province: loc.province || '',
          dest_city: dest.city || '',
          dest_province: dest.province || '',
          price: truck.price || 0,
          price_per_km: truck.price_per_km || 0,
          available_date: truck.available_date || '',
          status: truck.status || 'available',
          features: truck.features || [],
          company_name: truck.company?.name || '',
          company_phone: truck.company?.phone || '',
          company_email: truck.company?.email || '',
          company_city: truck.company?.city || '',
        };
      });

      setTrucks(rows);
      setLastRefresh(new Date());
    } catch (error) {
      const message = getErrorMessage(error);
      setFetchError(message);
      console.error('Error fetching trucks:', {
        message,
        raw: error,
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (authLoading || !isAuthorized) return;
    fetchTrucks();
    loadFavorites();
  }, [authLoading, isAuthorized, fetchTrucks, loadFavorites]);

  useEffect(() => {
    if (authLoading || !isAuthorized) return;
    const interval = setInterval(fetchTrucks, 60000);
    return () => clearInterval(interval);
  }, [authLoading, isAuthorized, fetchTrucks]);

  // Filtrage
  const filteredTrucks = trucks.filter(t => {
    const f = filters;
    if (f.city && !t.location_city.toLowerCase().includes(f.city.toLowerCase())) return false;
    if (f.type && t.type !== f.type) return false;
    if (f.status !== 'all' && t.status !== f.status) return false;
    if (f.search) {
      const term = f.search.toLowerCase();
      const match = t.location_city.toLowerCase().includes(term) ||
        t.dest_city.toLowerCase().includes(term) ||
        t.company_name.toLowerCase().includes(term) ||
        t.type.toLowerCase().includes(term) ||
        trailerLabel(t.type).toLowerCase().includes(term);
      if (!match) return false;
    }
    if (f.minCapacity && t.capacity < Number(f.minCapacity)) return false;
    if (f.maxCapacity && t.capacity > Number(f.maxCapacity)) return false;
    if (f.minPrice && t.price_per_km < Number(f.minPrice)) return false;
    if (f.maxPrice && t.price_per_km > Number(f.maxPrice)) return false;
    return true;
  });

  // Tri
  const sortedTrucks = [...filteredTrucks].sort((a, b) => {
    let valA: any = a[sortCol as keyof TruckRow];
    let valB: any = b[sortCol as keyof TruckRow];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTrucks.length / PAGE_SIZE));
  const paginatedTrucks = sortedTrucks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [filters]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const clearFilters = () => setFilters({ city: '', type: '', status: 'available', search: '', minCapacity: '', maxCapacity: '', minPrice: '', maxPrice: '' });
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && v !== 'available' && k !== 'status').length + (filters.status !== 'available' ? 1 : 0);

  // Export CSV (liste filtrée)
  const exportCSV = () => {
    const headers = [t('id'), t('dispo'), t('type'), t('location'), t('province'), t('destination'), t('capacity'), t('pricePerKm'), t('status'), t('company'), t('phone')];
    const rows = sortedTrucks.map(t => [
      t.id.substring(0, 8),
      formatDate(t.available_date),
      t.type,
      t.location_city,
      t.location_province,
      t.dest_city || '',
      t.capacity,
      t.price_per_km,
      t.status,
      t.company_name,
      t.company_phone || '',
    ]);
    const escape = (v: string | number) => (typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const csv = [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truck-board-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPIs
  const stats = {
    total: filteredTrucks.length,
    available: filteredTrucks.filter(t => t.status === 'available').length,
    inTransit: filteredTrucks.filter(t => t.status === 'in-transit').length,
    newCount: filteredTrucks.filter(t => isNew(t.created_at)).length,
    avgPrice: filteredTrucks.length > 0 ? Math.round(filteredTrucks.reduce((s, t) => s + t.price_per_km, 0) / filteredTrucks.length) : 0,
    totalCapacity: filteredTrucks.reduce((s, t) => s + t.capacity, 0),
  };

  const SortHeader = ({ col, label, align }: { col: string; label: string; align?: string }) => (
    <th onClick={() => toggleSort(col)}
      className={`px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50/50 select-none transition-colors whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortCol === col && <span className="text-primary-600 font-black">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-xl w-full bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-amber-700">{t('accessUnavailable')}</p>
          <p className="text-sm text-gray-600 mt-1">
            {authError || t('invalidSession')}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={() => router.push('/login')}>
              {t('reconnect')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              {t('retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
              <Truck className="w-4 h-4 text-white" />
            </div>
            {t('title')}
            {stats.newCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold animate-pulse">
                <Sparkles className="w-3 h-3" /> {stats.newCount} {t('newLabel')}{stats.newCount > 1 ? 'x' : ''}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            {t('marketSubtitle')}
            <span className="flex items-center gap-1 text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t('live')}</span>
            <span className="text-gray-300">|</span>
            <span>MAJ: {lastRefresh ? lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400'}`}><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400'}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t('export')}</span>
          </button>
          <button onClick={fetchTrucks} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {userRole === 'company' && (
            <Button size="sm" onClick={() => router.push('/dashboard/publish')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {t('post')}
            </Button>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="border border-amber-200 bg-amber-50 text-amber-800 text-sm rounded-lg px-3 py-2">
          {t('loadError')}: {fetchError}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: t('total'), value: stats.total, icon: Truck, color: 'text-gray-700', bg: 'from-gray-50 to-gray-100/50', border: 'border-gray-200' },
          { label: t('available'), value: stats.available, icon: MapPin, color: 'text-emerald-700', bg: 'from-emerald-50 to-emerald-100/30', border: 'border-emerald-200' },
          { label: t('inTransit'), value: stats.inTransit, icon: Truck, color: 'text-amber-700', bg: 'from-amber-50 to-amber-100/30', border: 'border-amber-200' },
          { label: t('newLabel'), value: stats.newCount, icon: Sparkles, color: 'text-rose-700', bg: 'from-rose-50 to-rose-100/30', border: 'border-rose-200' },
          { label: t('avgPrice'), value: `${stats.avgPrice.toLocaleString()} CDF`, icon: DollarSign, color: 'text-green-700', bg: 'from-green-50 to-green-100/30', border: 'border-green-200' },
          { label: t('totalCapacity'), value: formatWeight(stats.totalCapacity), icon: Scale, color: 'text-blue-700', bg: 'from-blue-50 to-blue-100/30', border: 'border-blue-200' },
        ].map((kpi) => { const Icon = kpi.icon; return (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.bg} rounded-xl border ${kpi.border} p-2.5 transition-all hover:shadow-sm hover:-translate-y-0.5`}>
            <div className="flex items-center gap-1.5 mb-0.5"><Icon className={`w-3 h-3 ${kpi.color}`} /><span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">{kpi.label}</span></div>
            <div className={`text-base font-bold ${kpi.color} leading-tight`}>{kpi.value}</div>
          </div>
        ); })}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
            placeholder={t('searchPlaceholderLong')}
            className="w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 bg-white" />
          {filters.search && <button onClick={() => setFilters({ ...filters, search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
        <div className="hidden lg:flex items-center gap-1">
          {(['available', 'all', 'booked', 'in-transit'] as const).map(s => {
            const cfg = s === 'all' ? { label: t('all'), bg: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' } : { ...STATUS_CONFIG[s], label: statusLabel(s) };
            const active = filters.status === s;
            return (
              <button key={s} onClick={() => setFilters({ ...filters, status: s })}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium border rounded-lg transition-all ${active ? `${cfg.bg} ring-2 ring-primary-500/20 shadow-sm` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-all ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">{t('filters')}</span>
          {activeFilterCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-600 text-white rounded-full">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('location')}</label>
              <input type="text" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} placeholder="Lubumbashi..."
                className="w-full px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('type')}</label>
              <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/40 outline-none">
                <option value="">{t('allTypes')}</option>
                {[{ value: 'flatbed', key: 'trailerFlatbed' as const }, { value: 'van', key: 'trailerVan' as const }, { value: 'reefer', key: 'trailerReefer' as const }, { value: 'tanker', key: 'trailerTanker' as const }, { value: 'container', key: 'trailerContainer' as const }, { value: 'benne', key: 'trailerBenne' as const }, { value: 'lowboy', key: 'trailerLowboy' as const }].map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('minCapacity')} (kg)</label>
              <input type="number" value={filters.minCapacity} onChange={e => setFilters({ ...filters, minCapacity: e.target.value })}
                className="w-full px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('maxCapacity')} (kg)</label>
              <input type="number" value={filters.maxCapacity} onChange={e => setFilters({ ...filters, maxCapacity: e.target.value })}
                className="w-full px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('minPrice')}/km</label>
              <input type="number" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-full px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('maxPrice')}/km</label>
              <input type="number" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"><XCircle className="w-3.5 h-3.5" /> {t('clearFilters')} ({activeFilterCount})</button>
            </div>
          )}
        </div>
      )}

      {/* Counter */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span><strong className="text-gray-800">{sortedTrucks.length}</strong> {sortedTrucks.length !== 1 ? t('trucksCountPlural') : t('trucksCount')}</span>
        <span>{page} {t('pageOf')} {totalPages}</span>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/80 border-b">
                <tr>
                  <th className="w-8 px-2"></th>
                  <SortHeader col="available_date" label={t('dispo')} />
                  <SortHeader col="type" label={t('type')} />
                  <SortHeader col="location_city" label={t('location')} />
                  <SortHeader col="dest_city" label={t('destination')} />
                  <SortHeader col="capacity" label={t('capacity')} align="right" />
                  <SortHeader col="price_per_km" label={t('pricePerKm')} align="right" />
                  <SortHeader col="status" label={t('status')} />
                  <SortHeader col="company_name" label={t('company')} />
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">{t('contact')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={10} className="px-6 py-16 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-400" /><p className="text-sm text-gray-500">{t('loading')}</p></td></tr>
                ) : paginatedTrucks.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-20 text-center">
                    <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-600">{t('noTrucksFound')}</p>
                    {(userRole === 'company' || userRole === 'admin') && (
                      <Button size="sm" className="mt-4" onClick={() => router.push('/dashboard/publish')}><Plus className="w-3.5 h-3.5 mr-1" /> {t('postFirstTruck')}</Button>
                    )}
                  </td></tr>
                ) : paginatedTrucks.map(truck => {
                  const statusCfg = STATUS_CONFIG[truck.status] || STATUS_CONFIG.available;
                  const isNewTruck = isNew(truck.created_at);
                  const isFav = favorites.has(truck.id);

                  return (
                    <tr key={truck.id} onClick={() => setPreviewTruck(truck)}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-all group ${isNewTruck ? 'bg-amber-50/20' : ''} ${isFav ? 'border-l-2 border-l-amber-400' : ''}`}>
                      <td className="px-2 py-2.5 text-center">
                        <button onClick={(e) => toggleFavorite(truck.id, e)} className="p-0.5">
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-gray-300 group-hover:text-gray-400'}`} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isNewTruck && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          <div>
                            <div className="text-xs font-medium text-gray-800">{formatDate(truck.available_date)}</div>
                            <div className="text-[10px] text-gray-400">{timeAgo(truck.created_at)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-medium text-gray-700 px-1.5 py-0.5 bg-orange-50 rounded">{trailerLabel(truck.type)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-semibold text-gray-800">{truck.location_city || '—'}</span>
                        {truck.location_province && <span className="text-[9px] text-gray-400 ml-1">{truck.location_province.substring(0, 3).toUpperCase()}</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-gray-600">{truck.dest_city || t('anyDestination')}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-xs font-medium text-gray-800">{formatWeight(truck.capacity)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-xs font-bold text-emerald-700">{truck.price_per_km ? `${truck.price_per_km.toLocaleString()}` : '—'}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${truck.status === 'available' ? 'animate-pulse' : ''}`} />
                          {statusLabel(truck.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {truck.company_name ? (
                          <div className="min-w-[120px]">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-orange-50 text-orange-700 border border-orange-200">{t('company')}</span>
                            </div>
                            <div className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">{truck.company_name}</div>
                            {truck.company_phone && <div className="text-[10px] text-gray-400 truncate">{truck.company_phone}</div>}
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          {truck.company_phone && (
                            <a href={`tel:${truck.company_phone}`} onClick={e => e.stopPropagation()}
                              className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors rounded-lg" title={t('call')}>
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button onClick={e => { e.stopPropagation(); setPreviewTruck(truck); }}
                            className="p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 transition-colors rounded-lg" title={t('view')}>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
              <p className="text-xs text-gray-500">{((page-1)*PAGE_SIZE)+1} - {Math.min(page*PAGE_SIZE, sortedTrucks.length)} {t('pageOf')} {sortedTrucks.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page===1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"><ChevronsLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(Math.max(1,page-1))} disabled={page===1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 py-1 text-xs font-medium">{page}/{totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages,page+1))} disabled={page===totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                <button onClick={() => setPage(totalPages)} disabled={page===totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"><ChevronsRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedTrucks.map(truck => {
            const statusCfg = STATUS_CONFIG[truck.status] || STATUS_CONFIG.available;
            const isNewTruck = isNew(truck.created_at);
            const isFav = favorites.has(truck.id);

            return (
              <div key={truck.id} onClick={() => setPreviewTruck(truck)}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isNewTruck ? 'ring-2 ring-amber-200/50' : ''} ${isFav ? 'border-l-4 border-l-amber-400' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />{statusLabel(truck.status)}
                    </span>
                    <span className="text-xs font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">{trailerLabel(truck.type)}</span>
                    {isNewTruck && <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-bold"><Sparkles className="w-2.5 h-2.5" /> NEW</span>}
                  </div>
                  <button onClick={(e) => toggleFavorite(truck.id, e)} className="p-1">
                    <Star className={`w-4 h-4 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                  </button>
                </div>

                {/* Location */}
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm font-bold text-gray-900">{truck.location_city || '—'}</span>
                    <span className="text-[10px] text-gray-400">{truck.location_province}</span>
                  </div>
                  {truck.dest_city && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="text-[10px]">→</span>
                      <span>{truck.dest_city}</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <div className="text-[9px] text-gray-500 uppercase font-semibold">{t('capacity')}</div>
                    <div className="text-xs font-bold text-gray-800">{formatWeight(truck.capacity)}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg px-2.5 py-1.5">
                    <div className="text-[9px] text-gray-500 uppercase font-semibold">{t('pricePerKm')}</div>
                    <div className="text-xs font-bold text-emerald-700">{truck.price_per_km ? `${truck.price_per_km.toLocaleString()} CDF` : '—'}</div>
                  </div>
                </div>

                {/* Features */}
                {truck.features && truck.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {truck.features.slice(0, 3).map(f => (
                      <span key={f} className="px-1.5 py-0.5 text-[9px] bg-gray-100 text-gray-600 rounded">{f}</span>
                    ))}
                    {truck.features.length > 3 && <span className="text-[9px] text-gray-400">+{truck.features.length - 3}</span>}
                  </div>
                )}

                {/* Entreprise + Contact */}
                {truck.company_name && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-orange-700">{truck.company_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-800 truncate">{truck.company_name}</span>
                          <span className="px-1 py-0.5 text-[7px] font-bold uppercase rounded bg-orange-50 text-orange-600 border border-orange-200 flex-shrink-0">{t('company')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {truck.company_phone && (
                        <a href={`tel:${truck.company_phone}`} onClick={e => e.stopPropagation()}
                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title={t('call')}>
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {formatDate(truck.available_date)}</span>
                  <span>{timeAgo(truck.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PREVIEW DRAWER */}
      {previewTruck && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setPreviewTruck(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{t('previewTitle')}</h3>
                  <p className="text-[10px] text-gray-400 font-mono">#{previewTruck.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setPreviewTruck(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${(STATUS_CONFIG[previewTruck.status] || STATUS_CONFIG.available).bg}`}>
                  <span className={`w-2 h-2 rounded-full ${(STATUS_CONFIG[previewTruck.status] || STATUS_CONFIG.available).dot}`} />
                  {statusLabel(previewTruck.status)}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-50 rounded">{trailerLabel(previewTruck.type)}</span>
              </div>

              <div className="bg-gray-50 rounded-xl border p-4 space-y-3">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">{t('location')}</div>
                  <div className="text-base font-bold text-gray-900">{previewTruck.location_city || '—'}</div>
                  <div className="text-xs text-gray-500">{previewTruck.location_province}</div>
                </div>
                {previewTruck.dest_city && (
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">{t('destinationWanted')}</div>
                    <div className="text-base font-bold text-gray-900">{previewTruck.dest_city}</div>
                    <div className="text-xs text-gray-500">{previewTruck.dest_province}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1"><Scale className="w-3 h-3 text-gray-400" /><span className="text-[9px] text-gray-500 uppercase font-bold">{t('capacity')}</span></div>
                  <div className="text-sm font-semibold text-gray-800">{formatWeight(previewTruck.capacity)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1"><CalendarClock className="w-3 h-3 text-gray-400" /><span className="text-[9px] text-gray-500 uppercase font-bold">{t('availableDate')}</span></div>
                  <div className="text-sm font-semibold text-gray-800">{formatDate(previewTruck.available_date)}</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                <div className="text-[10px] text-emerald-600 uppercase font-bold mb-0.5">{t('pricePerKm')}</div>
                <div className="text-2xl font-black text-emerald-800">{previewTruck.price_per_km ? `${previewTruck.price_per_km.toLocaleString()} CDF` : '—'}</div>
                {previewTruck.price > 0 && <div className="text-xs text-emerald-600 mt-1">{t('fixedPrice')}: {formatPrice(previewTruck.price)}</div>}
              </div>

              {previewTruck.features && previewTruck.features.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-2">{t('equipment')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {previewTruck.features.map(f => (
                      <span key={f} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                        <Wrench className="w-3 h-3" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Entreprise + Contact */}
              {previewTruck.company_name && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">{t('publishedBy')}</div>
                    <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-orange-50 text-orange-700 border border-orange-200">{t('company')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-700">{previewTruck.company_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{previewTruck.company_name}</div>
                      {previewTruck.company_phone && <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {previewTruck.company_phone}</div>}
                      {previewTruck.company_email && <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {previewTruck.company_email}</div>}
                      {previewTruck.company_city && <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {previewTruck.company_city}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {previewTruck.company_phone && (
                      <a href={`tel:${previewTruck.company_phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100">
                        <Phone className="w-3.5 h-3.5" /> {t('call')}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => { router.push('/dashboard/messages'); setPreviewTruck(null); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-xs font-semibold hover:bg-primary-100"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> {t('message')}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={() => { setPreviewTruck(null); }}>
                  <Eye className="w-4 h-4 mr-2" /> {t('contactCompany')}
                </Button>
                <button onClick={() => setPreviewTruck(null)} className="px-4 py-2.5 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">{t('close')}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
