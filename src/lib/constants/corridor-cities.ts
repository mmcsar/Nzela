/**
 * Villes du corridor transport Haut-Katanga / Lualaba (RDC) et Copperbelt + axes (Zambie).
 * Utilisé par calculateurs tarifs / carburant et listes d’alertes.
 */

/** RDC — sud-est & axes principaux */
export const CITIES_RDC = [
  'Bukavu',
  'Fungurume',
  'Goma',
  'Jadotville',
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
