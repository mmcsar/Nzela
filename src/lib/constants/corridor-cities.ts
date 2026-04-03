/**
 * Villes du corridor transport Haut-Katanga / Lualaba (RDC) et Copperbelt + axes (Zambie).
 * Utilisé par calculateurs tarifs / carburant et listes d’alertes.
 */

/** RDC — sud-est & axes principaux (Likasi ; « Jadotville » = ancien nom, retiré des listes) */
export const CITIES_RDC = [
  'Bukavu',
  'Fungurume',
  'Goma',
  'Kalemie',
  'Kambove',
  'Kaniama',
  'Kasumbalesa',
  'Kipushi',
  'Kolwezi',
  'Kongolo',
  'Likasi',
  'Lubumbashi',
  'Manono',
  'Moba',
  'Mutshatsha',
  'Sakania',
  'Tenke',
  'Uvira',
] as const;

/** Zambie — Copperbelt, Lusaka, axes nord / sud */
export const CITIES_ZAMBIA = [
  'Chililabombwe',
  'Chingola',
  'Chipata',
  'Kitwe',
  'Livingstone',
  'Lusaka',
  'Mufulira',
  'Ndola',
  'Solwezi',
] as const;

export type CityRdc = (typeof CITIES_RDC)[number];
export type CityZm = (typeof CITIES_ZAMBIA)[number];

/** Liste plate (valeurs uniques pour les <select>) */
export const CORRIDOR_CITIES_ALL: readonly string[] = [...CITIES_RDC, ...CITIES_ZAMBIA];

/** Slug pour value HTML : minuscules, sans accents courants */
export function cityToValue(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Coordonnées GPS (WGS84) — RDC + Zambie (corridor).
 * Utilisé pour distance haversine (carburant / tarifs) quand la paire n’est pas dans ROUTES_RDC.
 * `jadotville` conservé comme alias → Likasi (données historiques / saisies).
 */
export const CORRIDOR_COORDS: Record<string, { lat: number; lng: number }> = {
  // RDC
  bukavu: { lat: -2.5083, lng: 28.8608 },
  fungurume: { lat: -10.6167, lng: 26.3 },
  goma: { lat: -1.6792, lng: 29.2228 },
  kalemie: { lat: -5.9333, lng: 29.2 },
  kaniama: { lat: -7.0, lng: 24.2 },
  kasumbalesa: { lat: -12.6167, lng: 28.5167 },
  kipushi: { lat: -11.7667, lng: 27.25 },
  kolwezi: { lat: -10.7148, lng: 25.4667 },
  kongolo: { lat: -5.3833, lng: 27.0 },
  likasi: { lat: -10.9833, lng: 26.7333 },
  jadotville: { lat: -10.9833, lng: 26.7333 },
  lubumbashi: { lat: -11.6642, lng: 27.4826 },
  manono: { lat: -7.3833, lng: 27.45 },
  moba: { lat: -5.5167, lng: 29.0 },
  mutshatsha: { lat: -10.8, lng: 26.0 },
  sakania: { lat: -12.7333, lng: 28.5667 },
  kambove: { lat: -10.8833, lng: 26.5833 },
  tenke: { lat: -10.5833, lng: 26.1833 },
  uvira: { lat: -3.4, lng: 29.15 },
  // Zambie
  chililabombwe: { lat: -12.55, lng: 27.87 },
  chingola: { lat: -12.54, lng: 27.85 },
  chipata: { lat: -13.64, lng: 32.65 },
  kitwe: { lat: -12.8024, lng: 28.2132 },
  livingstone: { lat: -17.85, lng: 25.85 },
  lusaka: { lat: -15.4167, lng: 28.2833 },
  mufulira: { lat: -12.55, lng: 28.24 },
  ndola: { lat: -12.9587, lng: 28.6366 },
  solwezi: { lat: -12.39, lng: 26.07 },
};

export function getCorridorCoords(city: string): { lat: number; lng: number } | undefined {
  if (!city?.trim()) return undefined;
  const v = cityToValue(city);
  return CORRIDOR_COORDS[v];
}
