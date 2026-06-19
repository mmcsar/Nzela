'use client';

import { ArrowRight } from 'lucide-react';

export type LoadRouteVisualVariant = 'table' | 'card' | 'drawer';

export type LoadRouteVisualProps = {
  originCity: string;
  originProvince?: string;
  destinationCity: string;
  destinationProvince?: string;
  originAbbr?: string;
  destAbbr?: string;
  /** Affiché à droite si pas de destination (ex. camion ouvert) */
  destinationPlaceholder?: string;
  variant?: LoadRouteVisualVariant;
  distance?: number;
  className?: string;
};

function CityBlock({
  city,
  abbr,
  province,
  tone,
  align = 'left',
  size = 'sm',
  muted = false,
}: {
  city: string;
  abbr?: string;
  province?: string;
  tone: 'origin' | 'dest';
  align?: 'left' | 'right';
  size?: 'sm' | 'md';
  muted?: boolean;
}) {
  const titleColor = muted
    ? 'text-gray-500 italic'
    : tone === 'origin'
      ? 'text-blue-700'
      : 'text-emerald-700';
  const meta = abbr || province;
  const titleSize = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <div className={`truncate font-semibold leading-tight ${titleSize} ${titleColor}`}>{city || '—'}</div>
      {meta && (
        <div className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wide text-gray-400">
          {meta}
        </div>
      )}
    </div>
  );
}

/**
 * Pont animé : trait + flux + pastille voyageuse + flèche à la fin.
 * Villes au-dessus (pas de pastilles aux extrémités du trait).
 */
function RouteBridge({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`lb-route-bridge flex items-center gap-0.5 ${wide ? 'w-full' : 'min-w-[3.5rem] flex-1'}`} aria-hidden>
      <div className={`lb-route-track relative h-[2px] flex-1 sm:h-[3px] ${wide ? '' : 'min-w-[2.5rem]'}`}>
        <span className="lb-route-bed absolute inset-0 rounded-full" />
        <span className="lb-route-flow absolute inset-0 overflow-hidden rounded-full">
          <span className="lb-route-flow-inner block h-full w-full" />
        </span>
        <span className="lb-route-packet absolute top-1/2 -translate-y-1/2" />
      </div>
      <ArrowRight className="h-3 w-3 shrink-0 text-emerald-500 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
    </div>
  );
}

/** Villes en haut, pont animé en dessous — évite l’effet « pastille-trait-pastille » */
function RouteStack({
  originCity,
  originAbbr,
  originProvince,
  destinationCity,
  destAbbr,
  destinationProvince,
  destinationPlaceholder,
  size = 'sm',
}: {
  originCity: string;
  originAbbr?: string;
  originProvince?: string;
  destinationCity: string;
  destAbbr?: string;
  destinationProvince?: string;
  destinationPlaceholder?: string;
  size?: 'sm' | 'md';
}) {
  const hasDest = Boolean(destinationCity?.trim());
  const destCity = hasDest ? destinationCity : destinationPlaceholder || '—';

  return (
    <div className="lb-route-stack w-full min-w-0">
      <div className="grid grid-cols-2 gap-2">
        <CityBlock city={originCity} abbr={originAbbr} province={originProvince} tone="origin" size={size} />
        <CityBlock
          city={destCity}
          abbr={hasDest ? destAbbr : undefined}
          province={hasDest ? destinationProvince : undefined}
          tone="dest"
          align="right"
          size={size}
          muted={!hasDest}
        />
      </div>
      <div className="mt-1.5 px-0.5 sm:mt-2">
        <RouteBridge wide />
      </div>
    </div>
  );
}

export function LoadRouteVisual({
  originCity,
  originProvince,
  destinationCity,
  destinationProvince,
  originAbbr,
  destAbbr,
  destinationPlaceholder,
  variant = 'card',
  distance,
  className = '',
}: LoadRouteVisualProps) {
  if (variant === 'table') {
    return (
      <div className={`lb-route-table min-w-[10.5rem] max-w-[14rem] ${className}`}>
        <RouteStack
          originCity={originCity}
          originAbbr={originAbbr}
          destinationCity={destinationCity}
          destAbbr={destAbbr}
          destinationPlaceholder={destinationPlaceholder}
          size="sm"
        />
      </div>
    );
  }

  if (variant === 'drawer') {
    return (
      <div
        className={`lb-route-drawer rounded-xl border border-blue-100/80 bg-gradient-to-br from-blue-50/50 to-emerald-50/50 p-3.5 sm:p-4 ${className}`}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-3">
          <div className="rounded-lg border border-blue-100/90 bg-white/90 px-3 py-2.5 shadow-sm">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Origine</div>
            <CityBlock city={originCity} abbr={originAbbr} province={originProvince} tone="origin" size="md" />
          </div>
          <div className="pb-2 sm:pb-2.5">
            <RouteBridge />
          </div>
          <div className="rounded-lg border border-emerald-100/90 bg-white/90 px-3 py-2.5 text-right shadow-sm">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Destination</div>
            {destinationCity?.trim() ? (
              <CityBlock
                city={destinationCity}
                abbr={destAbbr}
                province={destinationProvince}
                tone="dest"
                align="right"
                size="md"
              />
            ) : (
              <CityBlock
                city={destinationPlaceholder || '—'}
                tone="dest"
                align="right"
                size="md"
                muted
              />
            )}
          </div>
        </div>
        {distance != null && distance > 0 && (
          <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-white/60 pt-3 text-sm text-gray-600">
            <span className="font-bold text-primary-600">{distance}</span>
            <span className="text-xs uppercase text-gray-400">km</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`lb-route-card ${className}`}>
      <RouteStack
        originCity={originCity}
        originAbbr={originAbbr}
        originProvince={originProvince}
        destinationCity={destinationCity}
        destAbbr={destAbbr}
        destinationProvince={destinationProvince}
        destinationPlaceholder={destinationPlaceholder}
        size="sm"
      />
    </div>
  );
}
