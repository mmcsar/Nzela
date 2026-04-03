import { Location } from '@/types';
import { ROUTES_RDC, Route } from '@/lib/constants/rdc-routes';
import { getCorridorCoords } from '@/lib/constants/corridor-cities';

/**
 * Calcul de distance entre deux coordonnées GPS (formule Haversine)
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Distance entre deux Location objects
 */
export function distanceBetweenLocations(origin: Location, destination: Location): number {
  if (origin.coordinates && destination.coordinates) {
    return haversineDistance(
      origin.coordinates.lat,
      origin.coordinates.lng,
      destination.coordinates.lat,
      destination.coordinates.lng
    );
  }

  // Fallback: chercher dans les routes connues
  const route = findRoute(origin.city, destination.city);
  if (route) {
    return parseRouteDistance(route.distance);
  }

  return 0;
}

/**
 * Trouver une route connue entre deux villes
 */
export function findRoute(from: string, to: string): Route | undefined {
  return ROUTES_RDC.find(
    (r) =>
      r.from.toLowerCase() === from.toLowerCase() &&
      r.to.toLowerCase() === to.toLowerCase()
  ) || ROUTES_RDC.find(
    (r) =>
      r.from.toLowerCase() === to.toLowerCase() &&
      r.to.toLowerCase() === from.toLowerCase()
  );
}

/**
 * Parser la distance d'une route (ex: "120 km" -> 120)
 */
export function parseRouteDistance(distance: string): number {
  const match = distance.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parser la durée d'une route (ex: "2h30" -> 150 minutes)
 */
export function parseRouteDuration(duration: string): number {
  const hours = duration.match(/(\d+)h/);
  const mins = duration.match(/(\d+)min/);
  let total = 0;
  if (hours) total += parseInt(hours[1], 10) * 60;
  if (mins) total += parseInt(mins[1], 10);
  return total;
}

/**
 * Estimer la durée de trajet en fonction de la distance
 * Vitesse moyenne en RDC: ~50 km/h (routes nationales)
 */
export function estimateDuration(distanceKm: number): string {
  const hours = Math.floor(distanceKm / 50);
  const mins = Math.round((distanceKm % 50) / 50 * 60);

  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}

/**
 * Vérifier si un point est dans un rayon donné
 */
export function isWithinRadius(
  center: Location,
  point: Location,
  radiusKm: number
): boolean {
  const distance = distanceBetweenLocations(center, point);
  return distance <= radiusKm;
}

/**
 * Coordonnées GPS des villes principales du Haut-Katanga et Lualaba
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Lubumbashi': { lat: -11.6642, lng: 27.4826 },
  'Likasi': { lat: -10.9833, lng: 26.7333 },
  'Kolwezi': { lat: -10.7148, lng: 25.4667 },
  'Kipushi': { lat: -11.7622, lng: 27.2500 },
  'Fungurume': { lat: -10.6167, lng: 26.3000 },
  'Kambove': { lat: -10.8833, lng: 26.5833 },
  'Kasumbalesa': { lat: -12.5833, lng: 28.5167 },
  'Kalemie': { lat: -5.9333, lng: 29.2000 },
  'Tenke': { lat: -10.5833, lng: 26.1833 },
  'Matadi': { lat: -5.8167, lng: 13.4500 },
};

/**
 * Obtenir les coordonnées d'une ville
 */
export function getCityCoordinates(city: string): { lat: number; lng: number } | undefined {
  const normalized = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  return (
    CITY_COORDINATES[normalized] ||
    CITY_COORDINATES[city] ||
    getCorridorCoords(city)
  );
}
