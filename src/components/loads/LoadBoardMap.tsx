'use client';

import { useEffect, useRef, useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LoadBoardSkeleton } from '@/components/loads/LoadBoardSkeleton';

const CITY_COORDS: Record<string, [number, number]> = {
  lubumbashi: [-11.6647, 27.4794],
  kolwezi: [-10.7166, 25.4667],
  likasi: [-10.9836, 26.7386],
  kipushi: [-11.7636, 27.2506],
  fungurume: [-10.55, 26.3],
  kalemie: [-5.9475, 29.1948],
  kamina: [-8.7386, 24.9914],
  kinshasa: [-4.4419, 15.2663],
  'mbuji-mayi': [-6.15, 23.6],
  kananga: [-5.8967, 22.4167],
  kisangani: [0.5153, 25.191],
  bukavu: [-2.5083, 28.8608],
  goma: [-1.6792, 29.2306],
  matadi: [-5.8167, 13.45],
  boma: [-5.85, 13.05],
  kasumbalesa: [-12.5983, 28.5253],
  sakania: [-12.7333, 28.5667],
  solwezi: [-12.172, 25.868],
  ndola: [-12.9587, 28.6366],
  kitwe: [-12.8024, 28.2132],
  chililabombwe: [-12.55, 27.87],
  chingola: [-12.54, 27.85],
  chipata: [-13.64, 32.65],
  livingstone: [-17.85, 25.85],
  lusaka: [-15.4167, 28.2833],
  mufulira: [-12.55, 28.24],
};

const STATUS_COLORS: Record<string, string> = {
  available: '#059669',
  booked: '#3b82f6',
  'in-transit': '#d97706',
  delivered: '#8b5cf6',
  completed: '#6b7280',
};

const MAX_ROUTE_ANIMATIONS = 18;

function getCityCoords(cityName: string): [number, number] | null {
  if (!cityName) return null;
  return CITY_COORDS[cityName.toLowerCase().trim()] ?? null;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function interpolateCoord(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

type AnimHandle = { cancel: () => void };

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot() {
  return prefersReducedMotion();
}

function getReducedMotionServerSnapshot() {
  return false;
}

interface LoadRow {
  id: string;
  origin_city: string;
  destination_city: string;
  origin_province: string;
  destination_province: string;
  price: number;
  weight: number;
  trailer_type: string;
  status: string;
  broker_name: string;
}

interface LoadBoardMapProps {
  loads: LoadRow[];
  onSelectLoad: (load: LoadRow) => void;
  loadingLabel?: string;
}

export default function LoadBoardMap({ loads, onSelectLoad, loadingLabel }: LoadBoardMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const animHandlesRef = useRef<AnimHandle[]>([]);
  const onSelectRef = useRef(onSelectLoad);
  const [mapReady, setMapReady] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    onSelectRef.current = onSelectLoad;
  }, [onSelectLoad]);

  const mapLoads = useMemo(() => {
    return loads
      .map((load) => {
        const originCoords = getCityCoords(load.origin_city);
        const destCoords = getCityCoords(load.destination_city);
        if (!originCoords || !destCoords) return null;
        return { ...load, originCoords, destCoords };
      })
      .filter(Boolean) as (LoadRow & { originCoords: [number, number]; destCoords: [number, number] })[];
  }, [loads]);

  const clearAnimations = useCallback(() => {
    animHandlesRef.current.forEach((handle) => handle.cancel());
    animHandlesRef.current = [];
  }, []);

  const startPulse = useCallback((map: L.Map, coords: [number, number], color: string): AnimHandle => {
    const pulse = L.circleMarker(coords, {
      radius: 10,
      fillColor: color,
      color: 'transparent',
      weight: 0,
      fillOpacity: 0.22,
      interactive: false,
    }).addTo(map);

    let phase = 0;
    let rafId = 0;

    const tick = () => {
      phase += 0.045;
      const scale = 0.85 + Math.sin(phase) * 0.2;
      pulse.setRadius(8 * scale);
      pulse.setStyle({ fillOpacity: 0.12 + (Math.sin(phase) + 1) * 0.1 });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return {
      cancel: () => {
        cancelAnimationFrame(rafId);
        map.removeLayer(pulse);
      },
    };
  }, []);

  const startTravel = useCallback(
    (map: L.Map, from: [number, number], to: [number, number], color: string, delayMs: number): AnimHandle => {
      const traveler = L.circleMarker(from, {
        radius: 4,
        fillColor: '#34d399',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
        interactive: false,
        className: 'lb-map-traveler',
      }).addTo(map);

      const duration = 3800 + (delayMs % 900);
      let rafId = 0;
      let startedAt: number | null = null;

      const tick = (ts: number) => {
        if (startedAt === null) startedAt = ts + delayMs;
        const elapsed = ts - startedAt;
        if (elapsed < 0) {
          rafId = requestAnimationFrame(tick);
          return;
        }
        const t = (elapsed % duration) / duration;
        const pos = interpolateCoord(from, to, t);
        traveler.setLatLng(pos);
        traveler.setStyle({
          fillColor: color,
          fillOpacity: 0.85 + Math.sin(t * Math.PI) * 0.15,
        });
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);

      return {
        cancel: () => {
          cancelAnimationFrame(rafId);
          map.removeLayer(traveler);
        },
      };
    },
    [],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-11.0, 27.0],
      zoom: 7,
      zoomControl: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    });

    tileLayer.on('load', () => setMapReady(true));
    tileLayer.addTo(map);
    mapRef.current = map;

    const readyFallback = window.setTimeout(() => setMapReady(true), 1200);

    return () => {
      window.clearTimeout(readyFallback);
      clearAnimations();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [clearAnimations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clearAnimations();

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    const reducedMotion = prefersReducedMotion();

    mapLoads.forEach((load, index) => {
      const color = STATUS_COLORS[load.status] || STATUS_COLORS.available;
      const callbackName = `__nzela_select_load_${load.id.replace(/-/g, '_')}`;

      (window as unknown as Record<string, () => void>)[callbackName] = () => {
        onSelectRef.current(load);
      };

      const popupContent = `
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;">
            ${load.origin_city} → ${load.destination_city}
          </div>
          <div style="font-size:11px;color:#666;margin-bottom:6px;">
            ${load.trailer_type || 'N/A'} · ${load.weight ? `${load.weight} kg` : 'N/A'}
          </div>
          <div style="font-size:14px;font-weight:800;color:#059669;">
            ${load.price ? `${load.price.toLocaleString()} CDF` : 'Prix N/A'}
          </div>
          ${load.broker_name ? `<div style="font-size:10px;color:#999;margin-top:4px;">Courtier: ${load.broker_name}</div>` : ''}
          <div style="margin-top:8px;">
            <button onclick="window.${callbackName}()" style="background:#059669;color:white;border:none;padding:4px 12px;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">
              Voir détails
            </button>
          </div>
        </div>
      `;

      const originMarker = L.circleMarker(load.originCoords, {
        radius: 6,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.92,
      }).addTo(map);

      L.circleMarker(load.destCoords, {
        radius: 5,
        fillColor: '#ef4444',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.85,
      }).addTo(map);

      const polyline = L.polyline([load.originCoords, load.destCoords], {
        color,
        weight: 2.5,
        opacity: 0.62,
        dashArray: '8 6',
        className: reducedMotion ? 'lb-map-route-static' : 'lb-map-route-line',
      }).addTo(map);

      originMarker.bindPopup(popupContent);
      polyline.bindPopup(popupContent);

      if (!reducedMotion) {
        animHandlesRef.current.push(startPulse(map, load.originCoords, color));
        if (index < MAX_ROUTE_ANIMATIONS) {
          animHandlesRef.current.push(
            startTravel(map, load.originCoords, load.destCoords, color, index * 220),
          );
        }
      }
    });

    if (mapLoads.length > 0) {
      const allCoords = mapLoads.flatMap((l) => [l.originCoords, l.destCoords]);
      const bounds = L.latLngBounds(allCoords.map((c) => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, { padding: [36, 36], animate: !prefersReducedMotion() });
    }

    return () => {
      clearAnimations();
      mapLoads.forEach((load) => {
        const callbackName = `__nzela_select_load_${load.id.replace(/-/g, '_')}`;
        delete (window as unknown as Record<string, unknown>)[callbackName];
      });
    };
  }, [mapLoads, clearAnimations, startPulse, startTravel]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        {!mapReady && (
          <div className="absolute inset-0 z-10">
            <LoadBoardSkeleton variant="map" embedded label={loadingLabel} />
          </div>
        )}
        <div
          ref={mapContainerRef}
          className={`h-[min(56vh,500px)] w-full transition-opacity duration-500 sm:h-[500px] ${
            mapReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
        <span className="font-bold uppercase">Légende :</span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Réservé
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> En transit
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Destination
        </span>
        {!reducedMotion && (
          <span className="flex items-center gap-1 text-primary-600">
            <span className="lb-map-legend-dot h-2 w-2 rounded-full bg-emerald-400" /> Flux en direct
          </span>
        )}
        <span className="text-gray-300">|</span>
        <span>
          {mapLoads.length} chargement{mapLoads.length !== 1 ? 's' : ''} sur la carte
        </span>
        {loads.length - mapLoads.length > 0 && (
          <span className="text-amber-600">({loads.length - mapLoads.length} sans coordonnées)</span>
        )}
      </div>
    </div>
  );
}
