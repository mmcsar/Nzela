'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, Package, ArrowRight } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Coordonnees des villes RDC
const CITY_COORDS: Record<string, [number, number]> = {
  'lubumbashi': [-11.6647, 27.4794],
  'kolwezi': [-10.7166, 25.4667],
  'likasi': [-10.9836, 26.7386],
  'kipushi': [-11.7636, 27.2506],
  'fungurume': [-10.5500, 26.3000],
  'kalemie': [-5.9475, 29.1948],
  'kamina': [-8.7386, 24.9914],
  'kinshasa': [-4.4419, 15.2663],
  'mbuji-mayi': [-6.1500, 23.6000],
  'kananga': [-5.8967, 22.4167],
  'kisangani': [0.5153, 25.1910],
  'bukavu': [-2.5083, 28.8608],
  'goma': [-1.6792, 29.2306],
  'matadi': [-5.8167, 13.4500],
  'boma': [-5.8500, 13.0500],
  'kasumbalesa': [-12.5983, 28.5253],
  'sakania': [-12.7333, 28.5667],
  'solwezi': [-12.1720, 25.8680],
  'ndola': [-12.9587, 28.6366],
  'kitwe': [-12.8024, 28.2132],
};

function getCityCoords(cityName: string): [number, number] | null {
  if (!cityName) return null;
  const key = cityName.toLowerCase().trim();
  return CITY_COORDS[key] || null;
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
}

export default function LoadBoardMap({ loads, onSelectLoad }: LoadBoardMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const mapLoads = useMemo(() => {
    return loads
      .map(load => {
        const originCoords = getCityCoords(load.origin_city);
        const destCoords = getCityCoords(load.destination_city);
        if (!originCoords || !destCoords) return null;
        return { ...load, originCoords, destCoords };
      })
      .filter(Boolean) as (LoadRow & { originCoords: [number, number]; destCoords: [number, number] })[];
  }, [loads]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Init map centree sur le Katanga
    const map = L.map(mapContainerRef.current, {
      center: [-11.0, 27.0],
      zoom: 7,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous layers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Couleurs par statut
    const statusColors: Record<string, string> = {
      available: '#059669',
      booked: '#3b82f6',
      'in-transit': '#d97706',
      delivered: '#8b5cf6',
      completed: '#6b7280',
    };

    // Ajouter les loads sur la carte
    mapLoads.forEach(load => {
      const color = statusColors[load.status] || '#059669';

      // Marker origine (cercle vert)
      const originMarker = L.circleMarker(load.originCoords, {
        radius: 6,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9,
      }).addTo(map);

      // Marker destination (cercle rouge)
      const destMarker = L.circleMarker(load.destCoords, {
        radius: 5,
        fillColor: '#ef4444',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8,
      }).addTo(map);

      // Ligne de route
      const polyline = L.polyline([load.originCoords, load.destCoords], {
        color: color,
        weight: 2,
        opacity: 0.6,
        dashArray: '6 4',
      }).addTo(map);

      // Popup
      const popupContent = `
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;">
            ${load.origin_city} → ${load.destination_city}
          </div>
          <div style="font-size:11px;color:#666;margin-bottom:6px;">
            ${load.trailer_type || 'N/A'} · ${load.weight ? load.weight + ' kg' : 'N/A'}
          </div>
          <div style="font-size:14px;font-weight:800;color:#059669;">
            ${load.price ? load.price.toLocaleString() + ' CDF' : 'Prix N/A'}
          </div>
          ${load.broker_name ? `<div style="font-size:10px;color:#999;margin-top:4px;">Courtier: ${load.broker_name}</div>` : ''}
          <div style="margin-top:8px;">
            <button onclick="window.__nzela_select_load_${load.id.replace(/-/g, '_')}()" style="background:#4f46e5;color:white;border:none;padding:4px 12px;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">
              Voir details
            </button>
          </div>
        </div>
      `;

      // Register global callback for the popup button
      (window as any)[`__nzela_select_load_${load.id.replace(/-/g, '_')}`] = () => {
        onSelectLoad(load);
      };

      originMarker.bindPopup(popupContent);
      polyline.bindPopup(popupContent);
    });

    // Auto-fit bounds
    if (mapLoads.length > 0) {
      const allCoords = mapLoads.flatMap(l => [l.originCoords, l.destCoords]);
      const bounds = L.latLngBounds(allCoords.map(c => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [mapLoads, onSelectLoad]);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <div ref={mapContainerRef} className="w-full h-[500px]" />
      </div>

      {/* Legende */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
        <span className="font-bold uppercase">Legende:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Reserve
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> En transit
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Destination
        </span>
        <span className="text-gray-300">|</span>
        <span>{mapLoads.length} chargement{mapLoads.length !== 1 ? 's' : ''} sur la carte</span>
        {loads.length - mapLoads.length > 0 && (
          <span className="text-amber-600">({loads.length - mapLoads.length} sans coordonnees)</span>
        )}
      </div>
    </div>
  );
}
