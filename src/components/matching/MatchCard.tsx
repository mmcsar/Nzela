'use client';

import { Truck, Package, MapPin, Calendar, DollarSign, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MatchCardProps {
  match: {
    score: number;
    reasons: string[];
    estimatedRevenue: number;
    distanceKm: number;
    load: any;
    truck: any;
  };
  onViewLoad?: () => void;
  onViewTruck?: () => void;
  onContact?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-gray-500';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'bg-blue-50 border-blue-200';
  if (score >= 40) return 'bg-amber-50 border-amber-200';
  return 'bg-gray-50 border-gray-200';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  return 'Faible';
}

export function MatchCard({ match, onViewLoad, onViewTruck, onContact }: MatchCardProps) {
  const { score, reasons, estimatedRevenue, distanceKm, load, truck } = match;

  const loadOrigin = load?.origin ? (typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin) : {};
  const loadDest = load?.destination ? (typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination) : {};
  const truckLoc = truck?.current_location ? (typeof truck.current_location === 'string' ? JSON.parse(truck.current_location) : truck.current_location) : {};

  return (
    <div className={`rounded-xl border-2 p-5 transition-all hover:shadow-lg ${getScoreBg(score)}`}>
      {/* Header avec score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm ${getScoreColor(score)} bg-white border`}>
            <Zap className="w-4 h-4" />
            {score}% - {getScoreLabel(score)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Revenu estimé</div>
          <div className="text-lg font-bold text-emerald-600">
            {estimatedRevenue.toLocaleString()} CDF
          </div>
        </div>
      </div>

      {/* Contenu: Load + Truck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Chargement */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-sm text-gray-700">Chargement</span>
            {load?.broker?.name && (
              <span className="text-xs text-gray-400 ml-auto">{load.broker.name}</span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-green-500" />
              <span>{loadOrigin.city || 'N/A'}</span>
              <span className="text-gray-400">→</span>
              <span>{loadDest.city || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              <span>{load?.price?.toLocaleString() || 0} CDF</span>
              <span className="text-gray-400">|</span>
              <span>{load?.weight || 0} kg</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>{load?.pickup_date ? new Date(load.pickup_date).toLocaleDateString('fr-CD') : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Camion */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-sm text-gray-700">Camion</span>
            {truck?.company?.name && (
              <span className="text-xs text-gray-400 ml-auto">{truck.company.name}</span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-green-500" />
              <span>{truckLoc.city || 'N/A'}</span>
              <span className="text-gray-400">|</span>
              <span>{truck?.type || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              <span>{truck?.price_per_km?.toLocaleString() || 0} CDF/km</span>
              <span className="text-gray-400">|</span>
              <span>{truck?.capacity?.toLocaleString() || 0} kg</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>{truck?.available_date ? new Date(truck.available_date).toLocaleDateString('fr-CD') : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raisons du match */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {reasons.map((reason, i) => (
          <span key={i} className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border">
            {reason}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onViewLoad && (
          <Button variant="outline" size="sm" onClick={onViewLoad}>
            Voir chargement
          </Button>
        )}
        {onViewTruck && (
          <Button variant="outline" size="sm" onClick={onViewTruck}>
            Voir camion
          </Button>
        )}
        {onContact && (
          <Button variant="primary" size="sm" onClick={onContact} className="ml-auto">
            Contacter
          </Button>
        )}
      </div>
    </div>
  );
}
