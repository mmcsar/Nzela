'use client';

import dynamic from 'next/dynamic';
import { MapPin, Navigation, Clock, Truck, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { useTracking } from '@/lib/react-query/hooks';

const TrackingMap = dynamic(
  () => import('@/components/tracking/TrackingMap').then((mod) => mod.TrackingMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm">
        Chargement de la carte…
      </div>
    ),
  }
);

interface TrackingData {
  status: string;
  loadId: string;
  truckId?: string;
  currentPosition?: { lat: number; lng: number };
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  progress: number;
  eta?: string;
  speed?: number;
  updates: any[];
  route: { lat: number; lng: number }[];
}

interface LiveTrackerProps {
  loadId: string;
  compact?: boolean;
}

function parseLocCity(loc: unknown): string {
  if (!loc) return '';
  if (typeof loc === 'string') {
    try {
      const o = JSON.parse(loc);
      return typeof o?.city === 'string' ? o.city : loc;
    } catch {
      return loc;
    }
  }
  if (typeof loc === 'object' && loc !== null && 'city' in loc) {
    return String((loc as { city?: string }).city || '');
  }
  return '';
}

export function LiveTracker({ loadId, compact = false }: LiveTrackerProps) {
  // React Query: auto-refetch toutes les 15s, cache, retry, etc.
  const { data, isLoading, error: queryError, refetch } = useTracking(loadId);

  const tracking: TrackingData | null = data?.tracking || null;
  const loadRow = data?.load as { origin?: unknown; destination?: unknown } | undefined;
  const isSimulated = !!data?.simulated;
  const error = queryError ? (queryError as Error).message : (!tracking && !isLoading ? 'Tracking non disponible' : '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="text-center py-6 text-gray-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">{error || 'Tracking non disponible'}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
        <div className="relative">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-emerald-800">En transit - {tracking.progress}%</div>
          {tracking.speed && (
            <div className="text-xs text-emerald-600">{Math.round(tracking.speed)} km/h</div>
          )}
        </div>
        {tracking.eta && (
          <div className="text-xs text-emerald-700 font-medium">
            ETA: {new Date(tracking.eta).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    );
  }

  const originLabel = parseLocCity(loadRow?.origin) || 'Origine';
  const destLabel = parseLocCity(loadRow?.destination) || 'Destination';

  return (
    <div className="space-y-4">
      {isSimulated && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-800">
          <Activity className="w-4 h-4 shrink-0" />
          <span>
            <strong>Mode simulation</strong> — Pas de session GPS en base ; positions estimées sur la carte (RDC).
          </span>
        </div>
      )}

      <div className="relative">
        <TrackingMap
          origin={tracking.origin}
          destination={tracking.destination}
          currentPosition={tracking.currentPosition}
          route={tracking.route}
          progress={tracking.progress}
          status={tracking.status}
          speed={tracking.speed}
          originLabel={originLabel}
          destLabel={destLabel}
          height="300px"
        />
        <button
          type="button"
          onClick={() => refetch()}
          className="absolute top-3 right-3 z-[1100] p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-100"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center">
          <Navigation className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
          <div className="text-lg font-bold text-gray-900">{tracking.progress}%</div>
          <div className="text-xs text-gray-500">Progression</div>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <Truck className="w-4 h-4 mx-auto text-blue-500 mb-1" />
          <div className="text-lg font-bold text-gray-900">{tracking.speed ? Math.round(tracking.speed) : '—'}</div>
          <div className="text-xs text-gray-500">km/h</div>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <Clock className="w-4 h-4 mx-auto text-amber-500 mb-1" />
          <div className="text-lg font-bold text-gray-900">
            {tracking.eta ? new Date(tracking.eta).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </div>
          <div className="text-xs text-gray-500">ETA</div>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <MapPin className="w-4 h-4 mx-auto text-red-500 mb-1" />
          <div className="text-lg font-bold text-gray-900">{tracking.updates.length}</div>
          <div className="text-xs text-gray-500">Mises à jour</div>
        </div>
      </div>

      {/* Timeline des mises à jour */}
      {tracking.updates.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Historique des positions</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tracking.updates.slice().reverse().slice(0, 5).map((update: any, i: number) => (
              <div key={update.id || i} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span className="text-gray-500 w-14 flex-shrink-0">
                  {new Date(update.timestamp).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-gray-700">
                  {update.coordinates.lat.toFixed(4)}, {update.coordinates.lng.toFixed(4)}
                </span>
                {update.speed && (
                  <span className="text-gray-400 text-xs">{Math.round(update.speed)} km/h</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
