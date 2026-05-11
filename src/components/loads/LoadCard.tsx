'use client';

import React from 'react';
import { Load } from '@/types';
import { parseLoadLocation } from '@/lib/utils/load-location';
import { UrgencyBadge } from './UrgencyBadge';
import { UrgencyType } from '@/lib/constants/rdc-routes';
import { Heart, Package, Scale, Truck } from 'lucide-react';

// Traduction des types de remorque
const TRAILER_TYPE_FR: Record<string, string> = {
  'flatbed': 'Plateau',
  'van': 'Fourgon',
  'reefer': 'Frigorifique',
  'tanker': 'Citerne',
  'container': 'Conteneur',
  'lowboy': 'Surbaisse',
  'step-deck': 'Plateau surbaisse',
  'benne': 'Benne',
  'porte-char': 'Porte-char',
  '53ft': '53 pieds',
};

function translateTrailer(type: string): string {
  return TRAILER_TYPE_FR[type.toLowerCase()] || type;
}

interface LoadCardProps {
  load: Load;
  urgency?: UrgencyType;
  bids?: number;
  posted?: string;
  isFavorite?: boolean;
  onFavorite?: () => void;
  onClick?: () => void;
}

export const LoadCard = React.memo(function LoadCard({ load, urgency = 'normal', bids = 0, posted = '', isFavorite = false, onFavorite, onClick }: LoadCardProps) {
  const origin = parseLoadLocation(load.origin);
  const destination = parseLoadLocation(load.destination);

  // Calculate distance and duration if not provided
  const distance = load.distance 
    ? `${load.distance} km` 
    : 'Distance à calculer';
  
  const duration = load.duration || 'Durée à estimer';

  return (
    <div
      onClick={onClick}
      className="group bg-gradient-to-br from-indigo-950/80 via-indigo-900/60 to-indigo-800/40 rounded-2xl p-5 border border-indigo-500/20 cursor-pointer transition-all duration-300 hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 relative overflow-hidden"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 via-purple-600/0 to-emerald-600/0 group-hover:from-indigo-600/10 group-hover:via-purple-600/5 group-hover:to-emerald-600/10 transition-all duration-500" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-xs font-extrabold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-400/30">
                #{load.id.substring(0, 8).toUpperCase()}
              </span>
              <UrgencyBadge urgency={urgency} />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {(load.broker?.name || 'C').charAt(0)}
              </div>
              <div className="text-sm font-semibold text-slate-200 truncate">
                {load.broker?.name || 'Chargeur'}
              </div>
            </div>
          </div>
          <div className="text-right ml-3 flex flex-col items-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isFavorite
                  ? 'bg-red-500/20 text-red-400 border-2 border-red-400/40'
                  : 'bg-slate-800/50 text-slate-500 border-2 border-slate-700/50 hover:border-red-400/30'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <div>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
                ${load.price.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 font-medium">USD</div>
            </div>
          </div>
        </div>

        {/* Route - Enhanced */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/30 rounded-xl p-3.5 mb-3 border border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-indigo-400 border-2 border-indigo-300 shadow-lg shadow-indigo-500/50" />
              <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-400 via-indigo-500 to-emerald-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-emerald-300 shadow-lg shadow-emerald-500/50" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Départ</div>
                <div className="text-base font-bold text-slate-100 truncate">{origin.city || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Destination</div>
                <div className="text-base font-bold text-slate-100 truncate">{destination.city || 'N/A'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-300 font-semibold">{distance}</div>
              <div className="text-xs text-slate-500">{duration}</div>
            </div>
          </div>
        </div>

        {/* Meta - Enhanced */}
        <div className="flex flex-wrap gap-2 mb-3">
          {((load as any).cargoType || (load as any).cargo_type) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-500/20 rounded-lg border border-primary-400/30">
              <Package className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-xs font-medium text-primary-200">
                {String((load as any).cargoType || (load as any).cargo_type).replace(/_/g, ' ')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">{(load as any).trailer_type || load.trailerType ? translateTrailer((load as any).trailer_type || load.trailerType) : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">{load.weight ? `${load.weight}T` : 'N/A'}</span>
          </div>
          {posted && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50 ml-auto">
              <span className="text-xs text-slate-400">{posted}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-indigo-500/20">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Disponible</span>
          </div>
          <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
            <span className="text-xs text-indigo-300 font-bold">
              {(load as any).bidsCount ?? bids ?? 0} offres
            </span>
            <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </div>
  );
});

