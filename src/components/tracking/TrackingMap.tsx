'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrackingMapProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  currentPosition?: { lat: number; lng: number };
  route?: { lat: number; lng: number }[];
  progress?: number;
  status?: string;
  speed?: number;
  heading?: number;
  originLabel?: string;
  destLabel?: string;
  height?: string;
}

export function TrackingMap({
  origin,
  destination,
  currentPosition,
  route = [],
  progress = 0,
  status = 'inactive',
  speed,
  originLabel = 'Origine',
  destLabel = 'Destination',
  height = '400px',
}: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap tiles (free, no API key)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Vue par défaut RDC (évite carte vide avant fitBounds ; CSP doit autoriser OSM)
    map.setView([-2.5, 23.5], 5);

    mapInstanceRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    queueMicrotask(() => setMapReady(true));

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Onglets / layout : recalculer la taille Leaflet quand le conteneur change
  useEffect(() => {
    const el = mapRef.current;
    const map = mapInstanceRef.current;
    if (!el || !map) return;
    const fix = () => {
      requestAnimationFrame(() => map.invalidateSize());
    };
    fix();
    const ro = new ResizeObserver(() => fix());
    ro.observe(el);
    return () => ro.disconnect();
  }, [mapReady]);

  // Update markers and route
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current || !mapReady) return;

    const map = mapInstanceRef.current;
    const layers = markersRef.current;
    layers.clearLayers();

    // ── Custom icons ──
    const originIcon = L.divIcon({
      html: `<div style="background:#2563eb;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const destIcon = L.divIcon({
      html: `<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const truckIcon = L.divIcon({
      html: `<div style="background:#059669;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(5,150,105,0.5);display:flex;align-items:center;justify-content:center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0"><path d="M1 3h15v13H1V3zM16 8h4l3 4v5h-3M7 18a2 2 0 100-4 2 2 0 000 4zM17 18a2 2 0 100-4 2 2 0 000 4z"/></svg>
      </div>`,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    // ── Origin marker ──
    L.marker([origin.lat, origin.lng], { icon: originIcon })
      .bindPopup(`<strong>${originLabel}</strong><br/>Depart`)
      .addTo(layers);

    // ── Destination marker ──
    L.marker([destination.lat, destination.lng], { icon: destIcon })
      .bindPopup(`<strong>${destLabel}</strong><br/>Arrivee`)
      .addTo(layers);

    // ── Route line (dashed for remaining, solid for completed) ──
    if (route.length >= 2) {
      const routePoints: L.LatLngExpression[] = route.map(p => [p.lat, p.lng]);
      
      // Full route dashed
      L.polyline(routePoints, {
        color: '#94a3b8',
        weight: 3,
        dashArray: '8 6',
        opacity: 0.5,
      }).addTo(layers);

      // Completed route solid
      if (currentPosition && status === 'active') {
        const completedPoints = route.filter((_, i) => i < route.length * (progress / 100));
        if (completedPoints.length >= 2) {
          L.polyline(
            completedPoints.map(p => [p.lat, p.lng] as L.LatLngExpression),
            { color: '#059669', weight: 4, opacity: 0.8 }
          ).addTo(layers);
        }
      }
    } else {
      // Direct line if no route points
      L.polyline(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        { color: '#94a3b8', weight: 3, dashArray: '8 6', opacity: 0.5 }
      ).addTo(layers);
    }

    // ── Current position (truck) ──
    if (currentPosition && status === 'active') {
      const truckMarker = L.marker([currentPosition.lat, currentPosition.lng], { icon: truckIcon })
        .bindPopup(`<strong>Position actuelle</strong><br/>${progress}% du trajet<br/>${speed ? Math.round(speed) + ' km/h' : ''}`)
        .addTo(layers);

      // Pulsing circle around truck
      L.circleMarker([currentPosition.lat, currentPosition.lng], {
        radius: 25,
        color: '#059669',
        fillColor: '#059669',
        fillOpacity: 0.1,
        weight: 1,
        opacity: 0.3,
      }).addTo(layers);
    }

    // ── Fit bounds ──
    const bounds = L.latLngBounds([
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ]);
    if (currentPosition) {
      bounds.extend([currentPosition.lat, currentPosition.lng]);
    }
    try {
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    } catch {
      map.setView([origin.lat, origin.lng], 8);
    }
    requestAnimationFrame(() => map.invalidateSize());

  }, [origin, destination, currentPosition, route, progress, status, speed, originLabel, destLabel, mapReady]);

  return (
    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
      <div ref={mapRef} style={{ height, width: '100%' }} />
      
      {/* Status overlay */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
          status === 'active'
            ? 'bg-emerald-500/90 text-white'
            : status === 'completed'
              ? 'bg-blue-500/90 text-white'
              : 'bg-gray-500/90 text-white'
        }`}>
          {status === 'active' ? '● EN DIRECT' : status === 'completed' ? '✓ LIVRE' : '○ EN ATTENTE'}
        </div>
      </div>

      {/* Progress bar */}
      {status === 'active' && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 z-[1000]">
          <div
            className="h-full bg-emerald-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
