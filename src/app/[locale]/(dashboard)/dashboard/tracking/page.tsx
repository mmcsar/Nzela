'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Button } from '@/components/ui/Button';

// Lazy load TrackingMap (Leaflet is heavy and doesn't work in SSR)
const TrackingMap = dynamic(
  () => import('@/components/tracking/TrackingMap').then(mod => mod.TrackingMap),
  { ssr: false, loading: () => <div className="w-full h-[400px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">Chargement de la carte...</div> }
);
import {
  MapPin, Navigation, Clock, Truck, RefreshCw, Search, Satellite,
  Activity, Battery, Signal, ChevronRight, Package, Route, Gauge,
  Radio, Eye, Loader2,
} from 'lucide-react';

interface TrackingData {
  status: string;
  loadId: string;
  truckId?: string;
  sessionId?: string;
  currentPosition?: { lat: number; lng: number };
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  progress: number;
  eta?: string;
  speed?: number;
  heading?: number;
  distanceTotal?: number;
  distanceRemaining?: number;
  updates: any[];
  route: { lat: number; lng: number }[];
  startedAt?: string;
  updatedAt?: string;
}

interface LoadItem {
  id: string;
  origin: any;
  destination: any;
  status: string;
  cargo_type?: string;
  weight?: number;
  truck_id?: string;
}

export default function TrackingPage() {
  const { isAuthorized, isLoading: authLoading } = useRequireRole(['admin', 'broker', 'company']);
  const [loads, setLoads] = useState<LoadItem[]>([]);
  const [selectedLoadId, setSelectedLoadId] = useState<string>('');
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLoads, setIsLoadingLoads] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch loads
  useEffect(() => {
    async function fetchLoads() {
      try {
        const res = await fetch('/api/loads?limit=50');
        const data = await res.json();
        const trackable = (data.loads || []).filter((l: any) =>
          ['in-transit', 'in_transit', 'booked', 'completed', 'delivered'].includes(l.status)
        );
        setLoads(trackable);
        
        // Auto-select first in-transit load
        const inTransit = trackable.find((l: any) => l.status === 'in-transit' || l.status === 'in_transit');
        if (inTransit) setSelectedLoadId(inTransit.id);
      } catch (e) {
        console.error('Error fetching loads:', e);
      } finally {
        setIsLoadingLoads(false);
      }
    }
    fetchLoads();
  }, []);

  // Fetch tracking data
  const fetchTracking = async (loadId: string) => {
    if (!loadId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tracking?loadId=${loadId}`);
      const data = await res.json();
      setTracking(data.tracking);
      setIsSimulated(!!data.simulated);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Error fetching tracking:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLoadId) fetchTracking(selectedLoadId);
  }, [selectedLoadId]);

  // Auto-refresh every 15s
  useEffect(() => {
    if (!autoRefresh || !selectedLoadId || !tracking || tracking.status !== 'active') return;
    const interval = setInterval(() => fetchTracking(selectedLoadId), 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedLoadId, tracking]);

  const parseLocation = (loc: any) => {
    if (typeof loc === 'string') {
      try { return JSON.parse(loc); } catch { return { city: loc }; }
    }
    return loc || {};
  };

  const filteredLoads = loads.filter(l => {
    if (!searchFilter) return true;
    const o = parseLocation(l.origin);
    const d = parseLocation(l.destination);
    const text = `${o.city || ''} ${d.city || ''} ${l.cargo_type || ''} ${l.status}`.toLowerCase();
    return text.includes(searchFilter.toLowerCase());
  });

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all bg-white';

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <Satellite className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tracking GPS</h1>
            <p className="text-sm text-gray-500">Suivi en temps reel des chargements</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tracking?.status === 'active' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">EN DIRECT</span>
            </div>
          )}
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Maj: {lastRefresh.toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedLoadId && fetchTracking(selectedLoadId)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Sidebar: Load selection ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className={`${inputCls} pl-9`}
              placeholder="Rechercher un chargement..."
            />
          </div>

          {/* Load list */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">Chargements ({filteredLoads.length})</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-1 rounded ${autoRefresh ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}
                  title={autoRefresh ? 'Auto-refresh actif' : 'Auto-refresh desactive'}
                >
                  <Radio className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isLoadingLoads ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              </div>
            ) : filteredLoads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucun chargement a suivre</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                {filteredLoads.map(load => {
                  const o = parseLocation(load.origin);
                  const d = parseLocation(load.destination);
                  const isActive = load.id === selectedLoadId;
                  const isTransit = load.status === 'in-transit' || load.status === 'in_transit';

                  return (
                    <button
                      key={load.id}
                      onClick={() => setSelectedLoadId(load.id)}
                      className={`w-full text-left p-3 transition-colors hover:bg-gray-50 ${
                        isActive ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {isTransit && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {o.city || '?'} → {d.city || '?'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {load.cargo_type || 'Chargement'} {load.weight ? `· ${load.weight}kg` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isTransit ? 'bg-emerald-100 text-emerald-700' :
                            load.status === 'completed' || load.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {isTransit ? 'EN TRANSIT' : load.status?.toUpperCase()}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Main: Map + Stats ── */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedLoadId ? (
            <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
              <Satellite className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">Selectionnez un chargement</h3>
              <p className="text-sm text-gray-500">Choisissez un chargement dans la liste pour voir son suivi GPS en temps reel.</p>
            </div>
          ) : (
            <>
              {/* Simulated badge */}
              {isSimulated && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-800">
                  <Activity className="w-4 h-4 shrink-0" />
                  <span><strong>Mode simulation</strong> — Pas de donnees GPS reelles pour ce chargement. Les positions sont estimees.</span>
                </div>
              )}

              {/* Map */}
              {tracking ? (
                <TrackingMap
                  origin={tracking.origin}
                  destination={tracking.destination}
                  currentPosition={tracking.currentPosition}
                  route={tracking.route}
                  progress={tracking.progress}
                  status={tracking.status}
                  speed={tracking.speed}
                  originLabel={(() => { const l = loads.find(l => l.id === selectedLoadId); return l ? parseLocation(l.origin).city : 'Origine'; })()}
                  destLabel={(() => { const l = loads.find(l => l.id === selectedLoadId); return l ? parseLocation(l.destination).city : 'Destination'; })()}
                  height="380px"
                />
              ) : isLoading ? (
                <div className="bg-gray-100 rounded-xl flex items-center justify-center" style={{ height: 380 }}>
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : null}

              {/* Stats cards */}
              {tracking && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Navigation, label: 'Progression', value: `${tracking.progress}%`, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { icon: Gauge, label: 'Vitesse', value: tracking.speed ? `${Math.round(tracking.speed)} km/h` : '—', color: 'text-blue-500', bg: 'bg-blue-50' },
                    { icon: Clock, label: 'ETA', value: tracking.eta ? new Date(tracking.eta).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' }) : '—', color: 'text-amber-500', bg: 'bg-amber-50' },
                    { icon: Route, label: 'Distance rest.', value: tracking.distanceRemaining ? `${tracking.distanceRemaining} km` : '—', color: 'text-purple-500', bg: 'bg-purple-50' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border p-3.5 text-center">
                      <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                      <div className="text-[11px] text-gray-500 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Updates timeline */}
              {tracking && tracking.updates.length > 0 && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      Historique GPS ({tracking.updates.length} points)
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {tracking.updates.slice().reverse().slice(0, 15).map((update: any, i: number) => (
                      <div key={update.id || i} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          i === 0 ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-gray-300'
                        }`} />
                        <span className="text-gray-400 w-16 shrink-0 font-mono text-xs">
                          {new Date(update.timestamp).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-gray-700 font-medium">
                          {update.coordinates.lat.toFixed(4)}, {update.coordinates.lng.toFixed(4)}
                        </span>
                        {update.speed > 0 && (
                          <span className="text-xs text-gray-400 ml-auto">{Math.round(update.speed)} km/h</span>
                        )}
                        {update.battery && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <Battery className="w-3 h-3" /> {update.battery}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
