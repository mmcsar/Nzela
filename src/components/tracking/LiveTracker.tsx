'use client';

import { MapPin, Navigation, Clock, Truck, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTracking } from '@/lib/react-query/hooks';

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

export function LiveTracker({ loadId, compact = false }: LiveTrackerProps) {
  // React Query: auto-refetch toutes les 15s, cache, retry, etc.
  const { data, isLoading, error: queryError, refetch } = useTracking(loadId);

  const tracking: TrackingData | null = data?.tracking || null;
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

  return (
    <div className="space-y-4">
      {/* Carte simulée */}
      <div className="relative bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border-2 border-blue-200 overflow-hidden" style={{ height: 300 }}>
        {/* Grille de fond */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />

        {/* Route line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
          <line x1="60" y1="240" x2="340" y2="60" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8 4" opacity="0.5" />
          {/* Progress line */}
          <line
            x1="60" y1="240"
            x2={60 + (340 - 60) * tracking.progress / 100}
            y2={240 + (60 - 240) * tracking.progress / 100}
            stroke="#10b981" strokeWidth="4"
          />
        </svg>

        {/* Origin marker */}
        <div className="absolute bottom-[40px] left-[40px] flex flex-col items-center">
          <div className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full mb-1 whitespace-nowrap font-medium">
            Origine
          </div>
          <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
        </div>

        {/* Destination marker */}
        <div className="absolute top-[40px] right-[40px] flex flex-col items-center">
          <div className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full mb-1 whitespace-nowrap font-medium">
            Destination
          </div>
          <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg" />
        </div>

        {/* Current position marker */}
        {tracking.status === 'active' && (
          <div
            className="absolute flex flex-col items-center transition-all duration-1000"
            style={{
              left: `${40 + (340 - 40) * tracking.progress / 100}px`,
              bottom: `${40 + (260 - 40) * tracking.progress / 100}px`,
              transform: 'translate(-50%, 50%)',
            }}
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-emerald-400 rounded-full animate-ping opacity-25" />
              <div className="w-6 h-6 bg-emerald-500 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
                <Truck className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
            tracking.status === 'active'
              ? 'bg-emerald-500 text-white'
              : tracking.status === 'completed'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-500 text-white'
          }`}>
            {tracking.status === 'active' ? '● EN DIRECT' : tracking.status === 'completed' ? 'LIVRÉ' : 'EN ATTENTE'}
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
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
