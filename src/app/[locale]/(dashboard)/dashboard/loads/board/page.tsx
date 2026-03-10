'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import {
  Search, RefreshCw, Plus, Eye, Package, Truck, MapPin,
  Filter, X, Download, ChevronLeft, ChevronRight, ChevronsLeft,
  ChevronsRight, Clock, DollarSign, Scale, Route, AlertCircle,
  Star, Sparkles, LayoutGrid, LayoutList, ChevronDown,
  ArrowRight, Phone, MessageSquare, Bookmark, BookmarkCheck,
  CalendarClock, TrendingUp, TrendingDown, Minus, XCircle, Mail, Map,
} from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useRealtimeLoads } from '@/hooks/useRealtimeLoads';
import { cargoTypeFr } from '@/lib/utils/translate-fr';
import dynamic from 'next/dynamic';

const LoadBoardMap = dynamic(() => import('@/components/loads/LoadBoardMap'), { ssr: false, loading: () => <div className="w-full h-[500px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">Chargement de la carte...</div> });

// ══════════════════════════════════════════
// INTERFACES & CONSTANTS
// ══════════════════════════════════════════
interface LoadRow {
  id: string;
  created_at: string;
  origin_city: string;
  origin_province: string;
  destination_city: string;
  destination_province: string;
  trailer_type: string;
  cargo_type: string;
  weight: number;
  distance: number;
  price: number;
  price_per_km: number;
  pickup_date: string;
  delivery_date: string;
  status: string;
  broker_name: string;
  broker_phone?: string;
  broker_email?: string;
  publisher_type: 'broker' | 'company' | 'unknown';
  description?: string;
  special_requirements?: string;
}

const PROVINCE_ABBR: Record<string, string> = {
  'haut-katanga': 'HK', 'lualaba': 'LU', 'haut-lomami': 'HL', 'tanganyika': 'TG',
  'kinshasa': 'KN', 'kongo-central': 'KC', 'kasai': 'KS', 'kasai-central': 'KSC',
  'kasai-oriental': 'KSO', 'lomami': 'LO', 'sankuru': 'SK', 'maniema': 'MN',
  'sud-kivu': 'SKV', 'nord-kivu': 'NKV', 'ituri': 'IT', 'tshopo': 'TS',
  'bas-uele': 'BU', 'haut-uele': 'HU', 'mongala': 'MG', 'nord-ubangi': 'NU',
  'sud-ubangi': 'SU', 'equateur': 'EQ', 'tshuapa': 'TH', 'kwango': 'KG',
  'kwilu': 'KL', 'mai-ndombe': 'MND',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string; ring: string }> = {
  available: { label: 'Disponible', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
  booked: { label: 'Reserve', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', ring: 'ring-blue-500/20' },
  'in-transit': { label: 'En transit', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', ring: 'ring-amber-500/20' },
  delivered: { label: 'Livre', bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', ring: 'ring-purple-500/20' },
  completed: { label: 'Complete', bg: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400', ring: 'ring-gray-400/20' },
  cancelled: { label: 'Annule', bg: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400', ring: 'ring-red-400/20' },
};

const TRAILER_TYPES = [
  { value: '', label: 'Tous types' },
  { value: 'flatbed', label: 'Plateau' },
  { value: 'van', label: 'Fourgon' },
  { value: 'reefer', label: 'Frigorifique' },
  { value: 'tanker', label: 'Citerne' },
  { value: 'container', label: 'Conteneur' },
  { value: 'lowboy', label: 'Surbaisse' },
];

const PAGE_SIZE = 25;
const FETCH_LIMIT = 80;

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function isNew(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) < 3600000; // < 1h
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

function timeUntil(dateStr: string) {
  if (!dateStr) return '';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return 'Passe';
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Imminent';
  if (hours < 24) return `dans ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Demain';
  return `dans ${days}j`;
}

function getPriceColor(pricePerKm: number): { text: string; bg: string; icon: 'up' | 'down' | 'mid' } {
  if (pricePerKm <= 0) return { text: 'text-gray-400', bg: '', icon: 'mid' };
  if (pricePerKm >= 500) return { text: 'text-emerald-700', bg: 'bg-emerald-50', icon: 'up' };
  if (pricePerKm >= 300) return { text: 'text-blue-600', bg: 'bg-blue-50', icon: 'mid' };
  return { text: 'text-orange-600', bg: 'bg-orange-50', icon: 'down' };
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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

function getProvAbbr(prov: string) {
  return PROVINCE_ABBR[prov?.toLowerCase()] || prov?.substring(0, 3).toUpperCase() || '';
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
export default function LoadBoardPage() {
  const { isLoading: authLoading, isAuthorized, authError, role } = useRequireRole(['broker', 'company', 'admin']);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const userRole = role ?? '';
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'map'>('table');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Drawer preview
  const [previewLoad, setPreviewLoad] = useState<LoadRow | null>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Filtres
  const [filters, setFilters] = useState({
    startDate: '', endDate: '',
    originCity: '', destCity: '',
    status: 'all', trailerType: '', search: '',
    minWeight: '', maxWeight: '',
    minPrice: '', maxPrice: '',
  });

  // Tri
  const [sortCol, setSortCol] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadFavorites = useCallback(() => {
    try {
      const saved = localStorage.getItem('nzela_load_favorites');
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  const fetchLoads = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from('loads')
        .select(`
          id,
          created_at,
          origin,
          destination,
          trailer_type,
          cargo_type,
          weight,
          distance,
          price,
          price_per_km,
          pickup_date,
          delivery_date,
          status,
          broker_id,
          broker:brokers(name, phone, email)
        `)
        .order('created_at', { ascending: false })
        .limit(FETCH_LIMIT);

      if (error) throw error;

      const rows: LoadRow[] = (data || []).map((load: any) => {
        let origin = { city: '', province: '' };
        let dest = { city: '', province: '' };
        try {
          origin = typeof load.origin === 'string' ? JSON.parse(load.origin) : (load.origin || {});
          dest = typeof load.destination === 'string' ? JSON.parse(load.destination) : (load.destination || {});
        } catch { /* ignore */ }

        return {
          id: load.id,
          created_at: load.created_at,
          origin_city: origin.city || '',
          origin_province: origin.province || '',
          destination_city: dest.city || '',
          destination_province: dest.province || '',
          trailer_type: load.trailer_type || '',
          cargo_type: load.cargo_type || '',
          weight: load.weight || 0,
          distance: load.distance || 0,
          price: load.price || 0,
          price_per_km: load.price_per_km || 0,
          pickup_date: load.pickup_date || '',
          delivery_date: load.delivery_date || '',
          status: load.status || 'available',
          broker_name: load.broker?.name || '',
          broker_phone: load.broker?.phone || '',
          broker_email: load.broker?.email || '',
          publisher_type: load.broker_id ? 'broker' : 'unknown',
          description: load.description || '',
          special_requirements: load.special_requirements || '',
        };
      });

      setLoads(rows);
      setLastRefresh(new Date());
    } catch (error) {
      const message = getErrorMessage(error);
      setFetchError(message);
      console.error('Error fetching loads:', {
        message,
        raw: error,
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // ── Init ──
  useEffect(() => {
    if (authLoading || !isAuthorized) return;
    fetchLoads();
    loadFavorites();
  }, [authLoading, isAuthorized, fetchLoads, loadFavorites]);

  // Fallback polling (toutes les 5 min) si WebSocket déconnecté
  useEffect(() => {
    if (authLoading || !isAuthorized) return;
    const interval = setInterval(() => { fetchLoads(); }, 300000);
    return () => clearInterval(interval);
  }, [authLoading, isAuthorized, fetchLoads]);

  const toggleFavorite = (loadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(loadId)) next.delete(loadId); else next.add(loadId);
      try { localStorage.setItem('nzela_load_favorites', JSON.stringify([...next])); } catch { /* */ }
      return next;
    });
  };

  // WebSocket Realtime : rafraîchissement instantané à chaque changement (INSERT/UPDATE/DELETE sur loads)
  useRealtimeLoads(fetchLoads);

  // ── Filtrage ──
  const filteredLoads = loads.filter((load) => {
    const f = filters;
    if (f.originCity && !load.origin_city.toLowerCase().includes(f.originCity.toLowerCase())) return false;
    if (f.destCity && !load.destination_city.toLowerCase().includes(f.destCity.toLowerCase())) return false;
    if (f.status !== 'all' && load.status !== f.status) return false;
    if (f.trailerType && load.trailer_type !== f.trailerType) return false;
    if (f.search) {
      const term = f.search.toLowerCase();
      const match = load.origin_city.toLowerCase().includes(term) ||
        load.destination_city.toLowerCase().includes(term) ||
        load.broker_name.toLowerCase().includes(term) ||
        load.id.toLowerCase().includes(term) ||
        load.cargo_type.toLowerCase().includes(term) ||
        load.trailer_type.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (f.minWeight && load.weight < Number(f.minWeight)) return false;
    if (f.maxWeight && load.weight > Number(f.maxWeight)) return false;
    if (f.minPrice && load.price < Number(f.minPrice)) return false;
    if (f.maxPrice && load.price > Number(f.maxPrice)) return false;
    if (f.startDate) {
      const d = new Date(load.pickup_date || load.created_at);
      if (d < new Date(f.startDate)) return false;
    }
    if (f.endDate) {
      const d = new Date(load.pickup_date || load.created_at);
      if (d > new Date(f.endDate + 'T23:59:59')) return false;
    }
    return true;
  });

  // ── Tri ──
  const sortedLoads = [...filteredLoads].sort((a, b) => {
    let valA: any = a[sortCol as keyof LoadRow];
    let valB: any = b[sortCol as keyof LoadRow];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(sortedLoads.length / PAGE_SIZE));
  const paginatedLoads = sortedLoads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filters]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const clearFilters = () => {
    setFilters({
      startDate: '', endDate: '', originCity: '', destCity: '',
      status: 'all', trailerType: '', search: '',
      minWeight: '', maxWeight: '', minPrice: '', maxPrice: '',
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([, v]) => v && v !== 'all').length;

  // ── Export ──
  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Origine', 'Province', 'Destination', 'Province', 'Type', 'Poids', 'Distance', 'Prix', 'Prix/km', 'Statut', 'Courtier'];
    const rows = sortedLoads.map(l => [
      l.id.substring(0, 8), formatDate(l.pickup_date || l.created_at),
      l.origin_city, l.origin_province, l.destination_city, l.destination_province,
      l.trailer_type, l.weight, l.distance, l.price, l.price_per_km, l.status, l.broker_name,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `load-board-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── KPIs ──
  const stats = {
    total: filteredLoads.length,
    available: filteredLoads.filter(l => l.status === 'available').length,
    inTransit: filteredLoads.filter(l => l.status === 'in-transit').length,
    newCount: filteredLoads.filter(l => isNew(l.created_at)).length,
    avgPrice: filteredLoads.length > 0 ? Math.round(filteredLoads.reduce((s, l) => s + l.price, 0) / filteredLoads.length) : 0,
    totalWeight: filteredLoads.reduce((s, l) => s + l.weight, 0),
    avgDistance: filteredLoads.length > 0 ? Math.round(filteredLoads.reduce((s, l) => s + l.distance, 0) / filteredLoads.length) : 0,
  };

  // ── SortHeader ──
  const SortHeader = ({ col, label, align }: { col: string; label: string; align?: string }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50/50 select-none transition-colors whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortCol === col && (
          <span className="text-primary-600 font-black">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-xl w-full bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-amber-700">Acces indisponible</p>
          <p className="text-sm text-gray-600 mt-1">
            {authError || 'Session invalide ou profil utilisateur incomplet. Reconnectez-vous puis reessayez.'}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={() => router.push('/login')}>
              Se reconnecter
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Reessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-gradient-to-b from-slate-50/70 to-gray-50/50 min-h-screen py-1">
      {/* ══════════════════════ HEADER ══════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
              <Package className="w-4 h-4 text-white" />
            </div>
            Load Board
            {stats.newCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold animate-pulse">
                <Sparkles className="w-3 h-3" />
                {stats.newCount} nouveau{stats.newCount > 1 ? 'x' : ''}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            Marche des chargements en temps reel
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <span className="text-gray-300">|</span>
            <span>MAJ: {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Vue toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Vue tableau"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Vue cartes"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Vue carte"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>

          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={fetchLoads} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {userRole === 'broker' && (
            <Button size="sm" onClick={() => router.push('/dashboard/publish')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Poster
            </Button>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="border border-amber-200 bg-amber-50 text-amber-800 text-sm rounded-lg px-3 py-2">
          Erreur de chargement du Load Board: {fetchError}
        </div>
      )}

      {/* ══════════════════════ KPIs ══════════════════════ */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: 'text-gray-700', bg: 'from-gray-50 to-gray-100/50', border: 'border-gray-200' },
          { label: 'Disponibles', value: stats.available, icon: MapPin, color: 'text-emerald-700', bg: 'from-emerald-50 to-emerald-100/30', border: 'border-emerald-200' },
          { label: 'En transit', value: stats.inTransit, icon: Truck, color: 'text-amber-700', bg: 'from-amber-50 to-amber-100/30', border: 'border-amber-200' },
          { label: 'Nouveaux', value: stats.newCount, icon: Sparkles, color: 'text-rose-700', bg: 'from-rose-50 to-rose-100/30', border: 'border-rose-200' },
          { label: 'Prix moy.', value: formatPrice(stats.avgPrice), icon: DollarSign, color: 'text-green-700', bg: 'from-green-50 to-green-100/30', border: 'border-green-200' },
          { label: 'Poids total', value: formatWeight(stats.totalWeight), icon: Scale, color: 'text-blue-700', bg: 'from-blue-50 to-blue-100/30', border: 'border-blue-200' },
          { label: 'Dist. moy.', value: `${stats.avgDistance} km`, icon: Route, color: 'text-purple-700', bg: 'from-purple-50 to-purple-100/30', border: 'border-purple-200' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-gradient-to-br ${kpi.bg} rounded-xl border ${kpi.border} p-2.5 transition-all hover:shadow-sm hover:-translate-y-0.5`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className={`w-3 h-3 ${kpi.color}`} />
                <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">{kpi.label}</span>
              </div>
              <div className={`text-base font-bold ${kpi.color} leading-tight`}>{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════ SEARCH + FILTERS ══════════════════════ */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            placeholder="Rechercher ville, courtier, ID, cargo, type..."
            className="w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 bg-white transition-all"
          />
          {filters.search && (
            <button onClick={() => setFilters({ ...filters, search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick status filters */}
        <div className="hidden lg:flex items-center gap-1">
          {(['all', 'available', 'booked', 'in-transit'] as const).map(s => {
            const cfg = s === 'all' ? { label: 'Tous', bg: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' } : STATUS_CONFIG[s];
            const active = filters.status === s;
            return (
              <button
                key={s}
                onClick={() => setFilters({ ...filters, status: s })}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium border rounded-lg transition-all ${
                  active ? `${cfg.bg} ring-2 ring-primary-500/20 shadow-sm` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-all ${
            showFilters ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filtres</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-600 text-white rounded-full">{activeFilterCount}</span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ══════════════════════ FILTER PANEL ══════════════════════ */}
      {showFilters && (
        <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Date debut', type: 'date', key: 'startDate' },
              { label: 'Date fin', type: 'date', key: 'endDate' },
              { label: 'Origine', type: 'text', key: 'originCity', ph: 'Lubumbashi...' },
              { label: 'Destination', type: 'text', key: 'destCity', ph: 'Kolwezi...' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{f.label}</label>
                <input
                  type={f.type}
                  value={filters[f.key as keyof typeof filters]}
                  onChange={e => setFilters({ ...filters, [f.key]: e.target.value })}
                  placeholder={f.ph || ''}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none transition-all"
                />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Statut</label>
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/40 outline-none">
                <option value="all">Tous</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type remorque</label>
              <select value={filters.trailerType} onChange={e => setFilters({ ...filters, trailerType: e.target.value })}
                className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/40 outline-none">
                {TRAILER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Poids min (kg)', key: 'minWeight', ph: '0' },
              { label: 'Poids max (kg)', key: 'maxWeight', ph: '50000' },
              { label: 'Prix min (CDF)', key: 'minPrice', ph: '0' },
              { label: 'Prix max (CDF)', key: 'maxPrice', ph: '10000000' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{f.label}</label>
                <input
                  type="number"
                  value={filters[f.key as keyof typeof filters]}
                  onChange={e => setFilters({ ...filters, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none transition-all"
                />
              </div>
            ))}
          </div>
          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Effacer tous les filtres ({activeFilterCount})
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ COUNTER ══════════════════════ */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-0.5">
        <span>
          <strong className="text-gray-800">{sortedLoads.length}</strong> chargement{sortedLoads.length !== 1 ? 's' : ''}
          {activeFilterCount > 0 && ` (${activeFilterCount} filtre${activeFilterCount > 1 ? 's' : ''})`}
          {sortedLoads.length !== loads.length && ` sur ${loads.length}`}
          {favorites.size > 0 && (
            <span className="ml-2 text-amber-600">
              <Star className="w-3 h-3 inline -mt-0.5 mr-0.5" />
              {favorites.size} favori{favorites.size > 1 ? 's' : ''}
            </span>
          )}
        </span>
        <span>
          Page {page}/{totalPages} — {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, sortedLoads.length)}
        </span>
      </div>

      {/* ══════════════════════ TABLE VIEW ══════════════════════ */}
      {viewMode === 'table' && (
        <div className="bg-white/95 border border-gray-200/90 rounded-xl overflow-hidden shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="w-8 px-2"></th>
                  <SortHeader col="pickup_date" label="Ramassage" />
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left whitespace-nowrap">Trajet</th>
                  <SortHeader col="trailer_type" label="Type" />
                  <SortHeader col="weight" label="Poids" align="right" />
                  <SortHeader col="distance" label="Distance" align="right" />
                  <SortHeader col="price" label="Prix" align="right" />
                  <SortHeader col="price_per_km" label="CDF/km" align="right" />
                  <SortHeader col="status" label="Statut" />
                  <SortHeader col="broker_name" label="Editeur" />
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-16 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-400" />
                      <p className="text-sm text-gray-500">Chargement du Load Board...</p>
                    </td>
                  </tr>
                ) : paginatedLoads.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-20 text-center">
                      <div className="max-w-xs mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600">Aucun chargement trouve</p>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {activeFilterCount > 0
                            ? 'Essayez d\'ajuster vos filtres pour voir plus de resultats'
                            : 'Les chargements apparaitront ici une fois publies'}
                        </p>
                        {(userRole === 'broker' || userRole === 'admin') && (
                          <Button size="sm" className="mt-4" onClick={() => router.push('/dashboard/publish')}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Poster un chargement
                          </Button>
                        )}
                        {activeFilterCount > 0 && (
                          <button onClick={clearFilters} className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium">
                            Effacer les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLoads.map((load) => {
                    const statusCfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;
                    const isNewLoad = isNew(load.created_at);
                    const isFav = favorites.has(load.id);
                    const priceCol = getPriceColor(load.price_per_km);
                    const pickupTimeUntil = timeUntil(load.pickup_date);

                    return (
                      <tr
                        key={load.id}
                        className={`cursor-pointer transition-all group ${isNewLoad ? 'bg-amber-50/25' : ''} ${isFav ? 'border-l-2 border-l-amber-400' : ''} ${
                          paginatedLoads.indexOf(load) % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                        } hover:bg-blue-50/50`}
                        onClick={() => setPreviewLoad(load)}
                      >
                        {/* Favori */}
                        <td className="px-2 py-2.5 text-center">
                          <button
                            onClick={(e) => toggleFavorite(load.id, e)}
                            className="p-0.5 transition-all"
                            title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                          >
                            {isFav ? (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            ) : (
                              <Star className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400" />
                            )}
                          </button>
                        </td>

                        {/* Date + relative */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isNewLoad && (
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Nouveau" />
                            )}
                            <div>
                              <div className="text-xs font-medium text-gray-800">{formatDate(load.pickup_date || load.created_at)}</div>
                              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                <CalendarClock className="w-2.5 h-2.5" />
                                {load.pickup_date ? pickupTimeUntil : timeAgo(load.created_at)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Route */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5 min-w-[200px]">
                            <div className="text-right min-w-[80px]">
                              <span className="text-xs font-semibold text-blue-700">{load.origin_city || '—'}</span>
                              {load.origin_province && (
                                <span className="text-[9px] text-gray-400 ml-1 font-medium">{getProvAbbr(load.origin_province)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 text-gray-300 px-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20 animate-pulse" />
                              <div className="w-8 h-px bg-gradient-to-r from-blue-400 to-emerald-500 transition-all" />
                              <div className="w-0 h-0 border-l-[5px] border-l-emerald-500 border-y-[3px] border-y-transparent" />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-emerald-700">{load.destination_city || '—'}</span>
                              {load.destination_province && (
                                <span className="text-[9px] text-gray-400 ml-1 font-medium">{getProvAbbr(load.destination_province)}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type remorque + Type marchandise */}
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            {load.trailer_type && (
                              <span className="text-[10px] text-gray-500">Remorque: {load.trailer_type}</span>
                            )}
                            {load.cargo_type ? (
                              <span className="text-xs text-gray-700 font-medium px-1.5 py-0.5 bg-primary-50 rounded border border-primary-100">
                                {cargoTypeFr(load.cargo_type)}
                              </span>
                            ) : load.trailer_type ? null : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Poids */}
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-xs font-medium text-gray-800">{formatWeight(load.weight)}</span>
                        </td>

                        {/* Distance */}
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-xs text-gray-600">{load.distance > 0 ? `${load.distance} km` : '—'}</span>
                        </td>

                        {/* Prix */}
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-xs font-bold text-gray-900">{formatPrice(load.price)}</span>
                        </td>

                        {/* Prix/km (colore) */}
                        <td className="px-3 py-2.5 text-right">
                          {load.price_per_km > 0 ? (
                            <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${priceCol.bg} ${priceCol.text}`}>
                              {priceCol.icon === 'up' && <TrendingUp className="w-3 h-3" />}
                              {priceCol.icon === 'down' && <TrendingDown className="w-3 h-3" />}
                              {priceCol.icon === 'mid' && <Minus className="w-3 h-3" />}
                              {load.price_per_km.toLocaleString('fr-FR')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </td>

                        {/* Statut */}
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${load.status === 'available' ? 'animate-pulse' : ''}`} />
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Editeur */}
                        <td className="px-3 py-2.5">
                          {load.broker_name ? (
                            <div className="min-w-[120px]">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Courtier
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">{load.broker_name}</div>
                              {load.broker_phone && (
                                <div className="text-[10px] text-gray-400 truncate">{load.broker_phone}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            {load.broker_phone && (
                              <a
                                href={`tel:${load.broker_phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors rounded-lg"
                                title="Appeler"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPreviewLoad(load); }}
                              className="p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 transition-colors rounded-lg"
                              title="Message"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/loads/${load.id}`); }}
                              className="p-1.5 text-gray-300 group-hover:text-primary-600 transition-colors rounded-lg group-hover:bg-primary-50"
                              title="Voir details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} total={sortedLoads.length} onPageChange={setPage} />}
        </div>
      )}

      {/* ══════════════════════ CARDS VIEW (Mobile-friendly) ══════════════════════ */}
      {viewMode === 'cards' && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-primary-400" />
            </div>
          ) : paginatedLoads.length === 0 ? (
            <EmptyState
              activeFilterCount={activeFilterCount}
              userRole={userRole}
              onClearFilters={clearFilters}
              onPost={() => router.push('/dashboard/publish')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedLoads.map((load) => {
                const statusCfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;
                const isNewLoad = isNew(load.created_at);
                const isFav = favorites.has(load.id);
                const priceCol = getPriceColor(load.price_per_km);

                return (
                  <div
                    key={load.id}
                    onClick={() => setPreviewLoad(load)}
                    className={`bg-white/95 border border-gray-200/90 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:bg-white relative backdrop-blur-sm ${
                      isNewLoad ? 'ring-2 ring-amber-200/50' : ''
                    } ${isFav ? 'border-l-4 border-l-amber-400' : ''}`}
                  >
                    {/* Top: New badge + Favorite + Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${load.status === 'available' ? 'animate-pulse' : ''}`} />
                          {statusCfg.label}
                        </span>
                        {isNewLoad && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-bold">
                            <Sparkles className="w-2.5 h-2.5" /> NEW
                          </span>
                        )}
                      </div>
                      <button onClick={(e) => toggleFavorite(load.id, e)} className="p-1">
                        <Star className={`w-4 h-4 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-gray-300 hover:text-gray-400'}`} />
                      </button>
                    </div>

                    {/* Route — origine bleu, destination vert, responsive + animation */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-blue-700 truncate">{load.origin_city || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-medium truncate">{load.origin_province || ''}</div>
                      </div>
                      <div className="flex items-center gap-1 px-2 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-500/20 animate-pulse" />
                        <div className="w-8 h-px sm:w-10 bg-gradient-to-r from-blue-400 to-emerald-500 transition-all" />
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-sm font-bold text-emerald-700 truncate">{load.destination_city || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-medium truncate">{load.destination_province || ''}</div>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/80">
                        <div className="text-[9px] text-gray-500 uppercase font-semibold">Poids</div>
                        <div className="text-xs font-bold text-gray-800">{formatWeight(load.weight)}</div>
                      </div>
                      <div className="bg-slate-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/80">
                        <div className="text-[9px] text-gray-500 uppercase font-semibold">Distance</div>
                        <div className="text-xs font-bold text-gray-800">{load.distance > 0 ? `${load.distance} km` : '—'}</div>
                      </div>
                      <div className="bg-slate-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/80">
                        <div className="text-[9px] text-gray-500 uppercase font-semibold">Prix</div>
                        <div className="text-xs font-bold text-gray-900">{formatPrice(load.price)}</div>
                      </div>
                      <div className={`rounded-lg px-2.5 py-1.5 ${priceCol.bg || 'bg-gray-50'}`}>
                        <div className="text-[9px] text-gray-500 uppercase font-semibold">CDF/km</div>
                        <div className={`text-xs font-bold flex items-center gap-0.5 ${priceCol.text}`}>
                          {priceCol.icon === 'up' && <TrendingUp className="w-3 h-3" />}
                          {priceCol.icon === 'down' && <TrendingDown className="w-3 h-3" />}
                          {load.price_per_km > 0 ? load.price_per_km.toLocaleString('fr-FR') : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Editeur + Contact */}
                    {load.broker_name && (
                      <div className="flex items-center justify-between py-2 border-t border-gray-100/90">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-blue-700">{load.broker_name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-gray-800 truncate">{load.broker_name}</span>
                              <span className="px-1 py-0.5 text-[7px] font-bold uppercase rounded bg-blue-50 text-blue-600 border border-blue-200 flex-shrink-0">
                                Courtier
                              </span>
                            </div>
                            {load.broker_phone && (
                              <div className="text-[10px] text-gray-400">{load.broker_phone}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {load.broker_phone && (
                            <a
                              href={`tel:${load.broker_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                              title="Appeler"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPreviewLoad(load); }}
                            className="p-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                            title="Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        {load.pickup_date ? (
                          <>
                            {formatDate(load.pickup_date)}
                            <span className="text-gray-400">·</span>
                            <span className="font-medium">{timeUntil(load.pickup_date)}</span>
                          </>
                        ) : (
                          timeAgo(load.created_at)
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {load.trailer_type && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium capitalize">{load.trailer_type}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && <div className="mt-4"><PaginationBar page={page} totalPages={totalPages} total={sortedLoads.length} onPageChange={setPage} /></div>}
        </div>
      )}

      {/* ══════════════════════ MAP VIEW ══════════════════════ */}
      {viewMode === 'map' && (
        <LoadBoardMap
          loads={sortedLoads.slice(0, 100)}
          onSelectLoad={(load) => setPreviewLoad(load as LoadRow)}
        />
      )}

      {/* ══════════════════════ PREVIEW DRAWER ══════════════════════ */}
      {previewLoad && (
        <PreviewDrawer
          load={previewLoad}
          isFav={favorites.has(previewLoad.id)}
          onToggleFav={(e) => toggleFavorite(previewLoad.id, e)}
          onClose={() => setPreviewLoad(null)}
          onViewFull={() => { router.push(`/dashboard/loads/${previewLoad.id}`); setPreviewLoad(null); }}
          onMessage={() => { router.push(`/dashboard/messages`); setPreviewLoad(null); }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// PREVIEW DRAWER
// ══════════════════════════════════════════
function PreviewDrawer({ load, isFav, onToggleFav, onClose, onViewFull, onMessage }: {
  load: LoadRow;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
  onClose: () => void;
  onViewFull: () => void;
  onMessage: () => void;
}) {
  const statusCfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;
  const priceCol = getPriceColor(load.price_per_km);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Package className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Apercu du chargement</h3>
              <p className="text-[10px] text-gray-400 font-mono">#{load.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onToggleFav} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Star className={`w-4 h-4 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Status + New badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg}`}>
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot} ${load.status === 'available' ? 'animate-pulse' : ''}`} />
              {statusCfg.label}
            </span>
            {isNew(load.created_at) && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                <Sparkles className="w-3 h-3" /> Nouveau
              </span>
            )}
            <span className="text-[10px] text-gray-400 ml-auto">{timeAgo(load.created_at)}</span>
          </div>

          {/* Route visuelle — origine bleu, destination vert, animation */}
          <div className="bg-gradient-to-br from-blue-50/50 to-emerald-50/50 rounded-xl border p-4 transition-all">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20 animate-pulse" />
                <div className="w-0.5 h-12 bg-gradient-to-b from-blue-400 to-emerald-500 rounded-full transition-all" />
                <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
              </div>
              <div className="flex-1 space-y-6 min-w-0">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Origine</div>
                  <div className="text-base font-bold text-blue-700 truncate">{load.origin_city || '—'}</div>
                  <div className="text-xs text-gray-500 truncate">{load.origin_province}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Destination</div>
                  <div className="text-base font-bold text-emerald-700 truncate">{load.destination_city || '—'}</div>
                  <div className="text-xs text-gray-500 truncate">{load.destination_province}</div>
                </div>
              </div>
              {load.distance > 0 && (
                <div className="text-right">
                  <div className="text-xl font-black text-primary-600">{load.distance}</div>
                  <div className="text-[10px] text-gray-400 uppercase">km</div>
                </div>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Type remorque', value: load.trailer_type || '—', icon: Truck },
              { label: 'Type marchandise', value: load.cargo_type ? cargoTypeFr(load.cargo_type) : '—', icon: Package },
              { label: 'Poids', value: formatWeight(load.weight), icon: Scale },
              { label: 'Ramassage', value: load.pickup_date ? `${formatDate(load.pickup_date)} · ${timeUntil(load.pickup_date)}` : '—', icon: CalendarClock },
              { label: 'Livraison', value: load.delivery_date ? formatDate(load.delivery_date) : '—', icon: Clock },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] text-gray-500 uppercase font-bold">{item.label}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 capitalize">{item.value}</div>
                </div>
              );
            })}
          </div>

          {/* Prix */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-emerald-600 uppercase font-bold mb-0.5">Prix du transport</div>
                <div className="text-2xl font-black text-emerald-800">{formatPrice(load.price)}</div>
              </div>
              {load.price_per_km > 0 && (
                <div className={`text-right px-3 py-2 rounded-lg ${priceCol.bg}`}>
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Par km</div>
                  <div className={`text-lg font-bold flex items-center justify-end gap-1 ${priceCol.text}`}>
                    {priceCol.icon === 'up' && <TrendingUp className="w-4 h-4" />}
                    {priceCol.icon === 'down' && <TrendingDown className="w-4 h-4" />}
                    {load.price_per_km.toLocaleString('fr-FR')}
                    <span className="text-xs font-normal">CDF</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editeur / Contact */}
          {load.broker_name && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-gray-400 uppercase font-bold">Publie par</div>
                <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Courtier
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-700">{load.broker_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900">{load.broker_name}</div>
                  {load.broker_phone && (
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {load.broker_phone}
                    </div>
                  )}
                  {load.broker_email && (
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {load.broker_email}
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons contact */}
              <div className="flex gap-2">
                {load.broker_phone && (
                  <a
                    href={`tel:${load.broker_phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Appeler
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMessage(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          {load.description && (
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Description</div>
              <p className="text-sm text-gray-600 leading-relaxed">{load.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={onViewFull}>
              <Eye className="w-4 h-4 mr-2" /> Voir la page complete
            </Button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════
// PAGINATION COMPONENT
// ══════════════════════════════════════════
function PaginationBar({ page, totalPages, total, onPageChange }: {
  page: number; totalPages: number; total: number; onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
      <p className="text-xs text-gray-500">
        {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, total)} sur {total}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) pageNum = i + 1;
          else if (page <= 3) pageNum = i + 1;
          else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
          else pageNum = page - 2 + i;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                page === pageNum ? 'bg-primary-600 text-white shadow-sm' : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════
function EmptyState({ activeFilterCount, userRole, onClearFilters, onPost }: {
  activeFilterCount: number; userRole: string; onClearFilters: () => void; onPost: () => void;
}) {
  return (
    <div className="bg-white border rounded-xl py-20 text-center">
      <div className="max-w-xs mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Package className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-base font-semibold text-gray-700">Aucun chargement trouve</p>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          {activeFilterCount > 0
            ? 'Vos filtres sont trop restrictifs. Essayez d\'en retirer quelques-uns pour voir plus de resultats.'
            : 'Le Load Board est vide pour le moment. Les chargements apparaitront ici des qu\'ils seront publies.'}
        </p>
        <div className="flex flex-col items-center gap-2 mt-5">
          {(userRole === 'broker' || userRole === 'admin') && (
            <Button onClick={onPost}>
              <Plus className="w-4 h-4 mr-1.5" /> Poster un chargement
            </Button>
          )}
          {activeFilterCount > 0 && (
            <button onClick={onClearFilters} className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Effacer tous les filtres
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
