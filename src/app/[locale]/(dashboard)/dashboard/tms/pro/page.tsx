'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Syne, Space_Mono } from 'next/font/google';
import {
  Truck, Package, MapPin, Loader2, Download, Plus, X, RefreshCw,
} from 'lucide-react';
const syne = Syne({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

function parseLoc(loc: unknown): string {
  if (!loc) return '—';
  if (typeof loc === 'string') {
    try {
      const o = JSON.parse(loc);
      return o?.city ?? o?.address ?? '—';
    } catch {
      return loc;
    }
  }
  return (loc as { city?: string })?.city ?? '—';
}

type Panel = 'flotte' | 'chauffeurs' | 'routes' | 'livraisons';

const PAGE_TITLES: Record<Panel, [string, string]> = {
  flotte: ['Gestion de Flotte', 'Véhicules actifs et disponibilité'],
  chauffeurs: ['Gestion des Chauffeurs', 'Chauffeurs enregistrés et assignations'],
  routes: ['Gestion des Routes', 'Routes actives — RDC & International'],
  livraisons: ['Livraisons Actives', 'Chargements en cours'],
};

const MOCK_DRIVERS = [
  { id: '1', name: 'Jean Mutombo', initials: 'JM', phone: '+243 97 111 2233', permit: 'Permis C · Valide', vehicle: 'Mercedes Actros', deliveries: 127, rating: 4.9, status: 'En mission' },
  { id: '2', name: 'Bienvenu Kabila', initials: 'BK', phone: '+243 81 445 6677', permit: 'Permis B · Valide', vehicle: 'Toyota HiAce', deliveries: 89, rating: 4.7, status: 'Disponible' },
  { id: '3', name: 'Patrick Nkusu', initials: 'PN', phone: '+243 99 887 5544', permit: 'Permis C · Valide', vehicle: 'Isuzu NQR', deliveries: 203, rating: 4.95, status: 'Disponible' },
];

const MOCK_ROUTES = [
  { id: 'R001', name: 'Lubumbashi → Kolwezi', stops: ['Lubumbashi', 'Likasi', 'Kolwezi'], distance: '320 km', duration: '4h 30', freq: '3x / sem', status: 'Active' },
  { id: 'R002', name: 'Lubumbashi → Kasumbalesa', stops: ['Lubumbashi', 'Kipushi', 'Kasumbalesa'], distance: '95 km', duration: '1h 45', freq: 'Quotidien', status: 'En cours' },
  { id: 'R003', name: 'Lubumbashi → Kalemie', stops: ['Lubumbashi', 'Kongolo', 'Kalemie'], distance: '680 km', duration: '10h', freq: '1x / sem', status: 'Planifiée' },
];

export default function TMSProPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthorized, role, brokerId, companyId } = useRequireRole(['broker', 'company', 'admin']);
  const [panel, setPanel] = useState<Panel>('flotte');
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [searchFlotte, setSearchFlotte] = useState('');
  const [searchLivraisons, setSearchLivraisons] = useState('');
  const supabase = useMemo(() => createClient(), []);

  const fetchTrucks = useCallback(async () => {
    if (!companyId || role !== 'company') return;
    const { data } = await supabase.from('trucks').select('id, type, capacity, status, current_location, price').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50);
    setTrucks(data || []);
  }, [companyId, role, supabase]);

  const fetchLoads = useCallback(async () => {
    if (!role) return;
    try {
      if (role === 'broker' && brokerId) {
        const { data } = await supabase.from('loads').select('id, origin, destination, status, workflow_step, cargo_type, weight, broker:brokers(name)').eq('broker_id', brokerId).in('status', ['available', 'booked', 'in-transit', 'completed']).order('updated_at', { ascending: false }).limit(80);
        setLoads(data || []);
        return;
      }
      if (role === 'company' && companyId) {
        const { data: trucksData } = await supabase.from('trucks').select('id').eq('company_id', companyId);
        const ids = (trucksData || []).map((t: any) => t.id);
        if (ids.length === 0) { setLoads([]); return; }
        const { data: bols } = await supabase.from('bols').select('load_id').in('truck_id', ids);
        const loadIds = [...new Set((bols || []).map((b: any) => b.load_id))];
        if (loadIds.length === 0) { setLoads([]); return; }
        const { data } = await supabase.from('loads').select('id, origin, destination, status, workflow_step, cargo_type, weight, broker:brokers(name)').in('id', loadIds).order('updated_at', { ascending: false }).limit(80);
        setLoads(data || []);
        return;
      }
      if (role === 'admin') {
        const { data } = await supabase.from('loads').select('id, origin, destination, status, workflow_step, cargo_type, weight, broker:brokers(name)').in('status', ['available', 'booked', 'in-transit', 'completed']).order('updated_at', { ascending: false }).limit(80);
        setLoads(data || []);
        return;
      }
      setLoads([]);
    } catch {
      setLoads([]);
    }
  }, [role, brokerId, companyId, supabase]);

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  /* setState dans callback async (fin fetch) = événement externe, autorisé par la règle mais détecté ici */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isAuthorized) return;
    let cancelled = false;
    Promise.all([fetchTrucks(), fetchLoads()]).finally(() => {
      if (!cancelled) setInitialLoadDone(true);
    });
    return () => { cancelled = true; };
  }, [isAuthorized, fetchTrucks, fetchLoads]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isLoading = loading || (!initialLoadDone && isAuthorized);

  const kpis = useMemo(() => ({
    vehicles: trucks.length,
    drivers: MOCK_DRIVERS.length,
    routes: MOCK_ROUTES.length,
    livraisons: loads.length,
    inTransit: loads.filter((l) => l.status === 'in-transit' || l.status === 'in_transit').length,
  }), [trucks.length, loads]);

  const filteredTrucks = useMemo(() => {
    if (!searchFlotte.trim()) return trucks;
    const q = searchFlotte.toLowerCase();
    return trucks.filter((t) => (t.type || '').toLowerCase().includes(q) || (t.id || '').toLowerCase().includes(q));
  }, [trucks, searchFlotte]);

  const filteredLoads = useMemo(() => {
    if (!searchLivraisons.trim()) return loads;
    const q = searchLivraisons.toLowerCase();
    return loads.filter((l) => {
      const o = parseLoc(l.origin).toLowerCase();
      const d = parseLoc(l.destination).toLowerCase();
      return o.includes(q) || d.includes(q) || (l.cargo_type || '').toLowerCase().includes(q) || (l.id || '').toLowerCase().includes(q);
    });
  }, [loads, searchLivraisons]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const refreshData = () => {
    setLoading(true);
    Promise.all([fetchTrucks(), fetchLoads()]).finally(() => {
      setLoading(false);
      showToast('Données actualisées');
    });
  };

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const theme = {
    bg: 'var(--tms-bg)',
    s: 'var(--tms-s)',
    s2: 'var(--tms-s2)',
    b: 'var(--tms-b)',
    a: 'var(--tms-a)',
    green: 'var(--tms-green)',
    blue: 'var(--tms-blue)',
    orange: 'var(--tms-orange)',
    red: 'var(--tms-red)',
    t: 'var(--tms-t)',
    m: 'var(--tms-m)',
    r: 'var(--tms-r)',
  };

  return (
    <div className={'tms-pro-wrap ' + syne.className + ' min-h-screen'} style={{ background: theme.bg, color: theme.t }}>
      <div className="flex flex-col h-full">
        {/* Topbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b" style={{ borderColor: theme.b, background: theme.s }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight" style={{ letterSpacing: '-0.5px' }}>
                {PAGE_TITLES[panel][0]}
              </h1>
            </div>
            <p className="text-xs mt-0.5" style={{ color: theme.m }}>
              {PAGE_TITLES[panel][1]}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button
              type="button"
              onClick={refreshData}
              disabled={isLoading}
              aria-label="Actualiser les données"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50"
              style={{ borderColor: theme.b, color: theme.m }}
            >
              <RefreshCw className={'w-3.5 h-3.5 ' + (isLoading ? 'animate-spin' : '')} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors"
              style={{ borderColor: theme.b, color: theme.m }}
              aria-label="Exporter"
            >
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exporter</span>
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{ background: theme.a, color: '#000' }}
            >
              <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{panel === 'flotte' ? 'Ajouter Véhicule' : panel === 'livraisons' ? 'Nouvelle Livraison' : 'Ajouter'}</span>
            </button>
            <Link href="/dashboard/tms" className="text-xs font-semibold py-2" style={{ color: theme.a }}>← TMS</Link>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <div className="rounded-xl p-4 border" style={{ background: theme.s, borderColor: theme.b }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: theme.m }}>Véhicules actifs</div>
              <div className="text-2xl font-extrabold" style={{ color: theme.green }}>{kpis.vehicles}</div>
              <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: theme.b }}>
                <div className="h-full rounded-full" style={{ width: Math.min(100, kpis.vehicles * 12) + '%', background: theme.green }} />
              </div>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: theme.s, borderColor: theme.b }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: theme.m }}>Chauffeurs</div>
              <div className="text-2xl font-extrabold" style={{ color: theme.blue }}>{kpis.drivers}</div>
              <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: theme.b }}>
                <div className="h-full rounded-full" style={{ width: '66%', background: theme.blue }} />
              </div>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: theme.s, borderColor: theme.b }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: theme.m }}>Routes actives</div>
              <div className="text-2xl font-extrabold" style={{ color: theme.a }}>{kpis.routes}</div>
              <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: theme.b }}>
                <div className="h-full rounded-full" style={{ width: '85%', background: theme.a }} />
              </div>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: theme.s, borderColor: theme.b }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: theme.m }}>Livraisons</div>
              <div className="text-2xl font-extrabold">{kpis.livraisons}</div>
              <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: theme.b }}>
                <div className="h-full rounded-full" style={{ width: (loads.length ? Math.min(100, (kpis.inTransit / loads.length) * 100 + 20) : 0) + '%', background: theme.orange }} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0 mb-4">
            <div role="tablist" aria-label="Sections TMS" className="flex gap-0.5 p-1 rounded-lg border w-fit min-w-0" style={{ background: theme.s, borderColor: theme.b }}>
              {(['flotte', 'chauffeurs', 'routes', 'livraisons'] as Panel[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={panel === p}
                  aria-controls={'panel-' + p}
                  id={'tab-' + p}
                  tabIndex={panel === p ? 0 : -1}
                  onClick={() => setPanel(p)}
                  className="px-3 sm:px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap"
                  style={
                    panel === p
                      ? { background: theme.a, color: '#000' }
                      : { color: theme.m }
                  }
                >
                  {p === 'flotte' && 'Flotte'}
                  {p === 'chauffeurs' && 'Chauffeurs'}
                  {p === 'routes' && 'Routes'}
                  {p === 'livraisons' && 'Livraisons'}
                </button>
              ))}
            </div>
          </div>

          {/* Panel: Flotte */}
          {panel === 'flotte' && (
            <div id="panel-flotte" role="tabpanel" aria-labelledby="tab-flotte" className="rounded-xl border overflow-hidden" style={{ background: theme.s, borderColor: theme.b }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b" style={{ borderColor: theme.b }}>
                <span className="text-sm font-bold">Véhicules de la flotte</span>
                <input
                  type="search"
                  placeholder="Rechercher véhicule..."
                  value={searchFlotte}
                  onChange={(e) => setSearchFlotte(e.target.value)}
                  aria-label="Rechercher un véhicule"
                  className="tms-pro-input w-full sm:w-48 px-3 py-1.5 rounded-md text-xs"
                  style={{ borderColor: theme.b }}
                />
              </div>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.a }} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[520px]" role="grid">
                    <thead>
                      <tr style={{ background: theme.s2 }}>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Véhicule</th>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Type</th>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Capacité</th>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Statut</th>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrucks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center" style={{ color: theme.m }}>
                            {role === 'company' ? 'Aucun véhicule. Ajoutez-en depuis Camions.' : 'Vue réservée aux transporteurs.'}
                          </td>
                        </tr>
                      ) : (
                        filteredTrucks.map((t) => (
                          <tr key={t.id} className="border-t hover:bg-white/5" style={{ borderColor: theme.b }}>
                            <td className="py-3 px-4">
                              <div className="font-semibold">{t.type || 'Véhicule'}</div>
                              <div className="text-xs" style={{ color: theme.m }}>ID {t.id.slice(0, 8)}</div>
                            </td>
                            <td className="py-3 px-4">{t.type || '—'}</td>
                            <td className="py-3 px-4">{t.capacity != null ? String(t.capacity) + ' kg' : '—'}</td>
                            <td className="py-3 px-4">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                  background: t.status === 'available' ? 'rgba(61,220,132,.12)' : t.status === 'in-transit' ? 'rgba(77,166,255,.12)' : 'rgba(255,140,66,.12)',
                                  color: t.status === 'available' ? theme.green : t.status === 'in-transit' ? theme.blue : theme.orange,
                                }}
                              >
                                {t.status === 'available' ? 'Disponible' : t.status === 'in-transit' ? 'En mission' : t.status === 'maintenance' ? 'Maintenance' : 'Réservé'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => router.push('/dashboard/company/trucks/' + t.id)}
                                className="text-xs px-2 py-1 rounded border transition-colors"
                                style={{ borderColor: theme.b, color: theme.m }}
                              >
                                Détails
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Panel: Chauffeurs (mock) */}
          {panel === 'chauffeurs' && (
            <div id="panel-chauffeurs" role="tabpanel" aria-labelledby="tab-chauffeurs" className="rounded-xl border overflow-hidden" style={{ background: theme.s, borderColor: theme.b }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: theme.b }}>
                <span className="text-sm font-bold">Chauffeurs enregistrés</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]" role="grid">
                  <thead>
                    <tr style={{ background: theme.s2 }}>
                      <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Chauffeur</th>
                      <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Téléphone</th>
                      <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Véhicule</th>
                      <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_DRIVERS.map((d) => (
                      <tr key={d.id} className="border-t hover:bg-white/5" style={{ borderColor: theme.b }}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(77,166,255,.2)', color: theme.blue }}>{d.initials}</div>
                            <div>
                              <div className="font-semibold">{d.name}</div>
                              <div className="text-xs" style={{ color: theme.m }}>{d.permit}</div>
                            </div>
                          </div>
                        </td>
                        <td className={'py-3 px-4 ' + spaceMono.className + ' text-xs'}>{d.phone}</td>
                        <td className="py-3 px-4">{d.vehicle}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: d.status === 'En mission' ? 'rgba(77,166,255,.12)' : 'rgba(61,220,132,.12)', color: d.status === 'En mission' ? theme.blue : theme.green }}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="p-4 text-xs" style={{ color: theme.m }}>Données de démonstration. Intégration chauffeurs à venir.</p>
            </div>
          )}

          {/* Panel: Routes (mock) */}
          {panel === 'routes' && (
            <div id="panel-routes" role="tabpanel" aria-labelledby="tab-routes" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_ROUTES.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border p-4 cursor-pointer transition-all hover:border-[var(--tms-a)]"
                  style={{ background: theme.s, borderColor: theme.b }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className={'text-xs font-semibold ' + spaceMono.className} style={{ color: theme.a }}>ROUTE #{r.id}</div>
                      <div className="font-bold mt-0.5">{r.name}</div>
                    </div>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: r.status === 'Active' ? 'rgba(61,220,132,.12)' : 'rgba(77,166,255,.12)', color: r.status === 'Active' ? theme.green : theme.blue }}>{r.status}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap my-2">
                    {r.stops.map((s, i) => (
                      <span key={s}>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: theme.s2 }}>{s}</span>
                        {i < r.stops.length - 1 && <span style={{ color: theme.m }}>→</span>}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t text-xs" style={{ borderColor: theme.b }}>
                    <div><div className="text-[9px] uppercase tracking-wider" style={{ color: theme.m }}>Distance</div><div className="font-bold">{r.distance}</div></div>
                    <div><div className="text-[9px] uppercase tracking-wider" style={{ color: theme.m }}>Durée</div><div className="font-bold">{r.duration}</div></div>
                    <div><div className="text-[9px] uppercase tracking-wider" style={{ color: theme.m }}>Fréquence</div><div className="font-bold">{r.freq}</div></div>
                  </div>
                </div>
              ))}
              <p className="col-span-full text-xs" style={{ color: theme.m }}>Routes de démonstration. Basées sur les axes RDC (Haut-Katanga, Lualaba).</p>
            </div>
          )}

          {/* Panel: Livraisons (loads) */}
          {panel === 'livraisons' && (
            <div id="panel-livraisons" role="tabpanel" aria-labelledby="tab-livraisons" className="rounded-xl border overflow-hidden" style={{ background: theme.s, borderColor: theme.b }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b" style={{ borderColor: theme.b }}>
                <span className="text-sm font-bold">Livraisons en cours</span>
                <input
                  type="search"
                  placeholder="N° tracking, ville..."
                  value={searchLivraisons}
                  onChange={(e) => setSearchLivraisons(e.target.value)}
                  aria-label="Rechercher une livraison"
                  className="tms-pro-input w-full sm:w-48 px-3 py-1.5 rounded-md text-xs"
                  style={{ borderColor: theme.b }}
                />
              </div>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.a }} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]" role="grid">
                    <thead>
                      <tr style={{ background: theme.s2 }}>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Tracking</th>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Trajet</th>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Poids</th>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Statut</th>
                        <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.m }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 px-4 text-center" style={{ color: theme.m }}>
                            <p className="mb-2">Aucune livraison à afficher.</p>
                            <Link href="/dashboard/loads/board" className="text-xs font-semibold inline-block mt-2" style={{ color: theme.a }}>Voir le Load Board →</Link>
                          </td>
                        </tr>
                      ) : (
                        filteredLoads.map((l) => {
                          const statusColor = l.status === 'completed' ? theme.green : l.status === 'in-transit' || l.status === 'in_transit' ? theme.blue : l.status === 'booked' ? theme.orange : theme.green;
                          return (
                            <tr key={l.id} className="border-t hover:bg-white/5" style={{ borderColor: theme.b }}>
                              <td className={'py-3 px-4 ' + spaceMono.className + ' text-xs'} style={{ color: theme.a }}>{l.id.slice(0, 12)}</td>
                              <td className="py-3 px-4">
                                <span>{parseLoc(l.origin)} → {parseLoc(l.destination)}</span>
                                {l.broker?.name && <div className="text-xs" style={{ color: theme.m }}>{l.broker.name}</div>}
                              </td>
                              <td className="py-3 px-4">{l.weight ? (l.weight / 1000).toFixed(1) + ' T' : '—'}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: statusColor === theme.green ? 'rgba(61,220,132,.12)' : statusColor === theme.blue ? 'rgba(77,166,255,.12)' : 'rgba(255,140,66,.12)', color: statusColor }}>
                                  {l.status === 'in-transit' || l.status === 'in_transit' ? 'En transit' : l.status === 'booked' ? 'Réservé' : l.status === 'completed' ? 'Livré' : l.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <button type="button" onClick={() => router.push('/dashboard/loads/' + l.id)} className="text-xs px-2 py-1 rounded border transition-colors" style={{ borderColor: theme.b, color: theme.m }}>Voir</button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4" onClick={() => setModalOpen(false)} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="rounded-2xl border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: theme.s, borderColor: theme.b }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <span id="modal-title" className="font-extrabold">Ajouter un Véhicule</span>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Fermer" className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: theme.s2, color: theme.m }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: theme.m }}>Marque</label>
                <input className="tms-pro-input w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ borderColor: theme.b }} placeholder="Mercedes, Toyota..." />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: theme.m }}>Modèle</label>
                <input className="tms-pro-input w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ borderColor: theme.b }} placeholder="Actros, HiAce..." />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: theme.m }}>Plaque</label>
                <input className="tms-pro-input w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ borderColor: theme.b }} placeholder="KA-0000-CD" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: theme.m }}>Capacité (T)</label>
                <input type="number" className="tms-pro-input w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ borderColor: theme.b }} placeholder="5" />
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: theme.b }}>
              <button type="button" onClick={() => { setModalOpen(false); showToast('Enregistré (démo)'); }} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ background: theme.a, color: '#000' }}>Enregistrer</button>
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold border" style={{ borderColor: theme.b, color: theme.m }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-lg font-bold text-sm z-[2000] animate-fade-in" style={{ background: theme.green, color: '#000' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
