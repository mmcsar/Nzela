import { PROVINCES_RDC_IDS, PROVINCES_RDC_NAMES } from './rdc-provinces';
import { REGIONS_ZAMBIA_IDS, REGIONS_ZAMBIA_NAMES } from './zambie-regions';
import type { SupportedCountryCode } from './supported-countries';

const REGIONS_SOUTH_AFRICA_IDS = [
  'za-eastern-cape',
  'za-free-state',
  'za-gauteng',
  'za-kwazulu-natal',
  'za-limpopo',
  'za-mpumalanga',
  'za-north-west',
  'za-northern-cape',
  'za-western-cape',
] as const;

const REGIONS_SOUTH_AFRICA_NAMES: Record<(typeof REGIONS_SOUTH_AFRICA_IDS)[number], string> = {
  'za-eastern-cape': 'Eastern Cape (Afrique du Sud)',
  'za-free-state': 'Free State (Afrique du Sud)',
  'za-gauteng': 'Gauteng (Afrique du Sud)',
  'za-kwazulu-natal': 'KwaZulu-Natal (Afrique du Sud)',
  'za-limpopo': 'Limpopo (Afrique du Sud)',
  'za-mpumalanga': 'Mpumalanga (Afrique du Sud)',
  'za-north-west': 'North West (Afrique du Sud)',
  'za-northern-cape': 'Northern Cape (Afrique du Sud)',
  'za-western-cape': 'Western Cape (Afrique du Sud)',
};

const REGIONS_TANZANIA_IDS = [
  'tz-arusha',
  'tz-dar-es-salaam',
  'tz-dodoma',
  'tz-geita',
  'tz-kagera',
  'tz-kigoma',
  'tz-kilimanjaro',
  'tz-mbeya',
  'tz-morogoro',
  'tz-mwanza',
] as const;

const REGIONS_TANZANIA_NAMES: Record<(typeof REGIONS_TANZANIA_IDS)[number], string> = {
  'tz-arusha': 'Arusha (Tanzanie)',
  'tz-dar-es-salaam': 'Dar es Salaam (Tanzanie)',
  'tz-dodoma': 'Dodoma (Tanzanie)',
  'tz-geita': 'Geita (Tanzanie)',
  'tz-kagera': 'Kagera (Tanzanie)',
  'tz-kigoma': 'Kigoma (Tanzanie)',
  'tz-kilimanjaro': 'Kilimanjaro (Tanzanie)',
  'tz-mbeya': 'Mbeya (Tanzanie)',
  'tz-morogoro': 'Morogoro (Tanzanie)',
  'tz-mwanza': 'Mwanza (Tanzanie)',
};

const REGIONS_ANGOLA_IDS = [
  'ao-benguela',
  'ao-bie',
  'ao-cabinda',
  'ao-cunene',
  'ao-huambo',
  'ao-huila',
  'ao-luanda',
  'ao-lunda-norte',
  'ao-lunda-sul',
  'ao-moxico',
] as const;

const REGIONS_ANGOLA_NAMES: Record<(typeof REGIONS_ANGOLA_IDS)[number], string> = {
  'ao-benguela': 'Benguela (Angola)',
  'ao-bie': 'Bié (Angola)',
  'ao-cabinda': 'Cabinda (Angola)',
  'ao-cunene': 'Cunene (Angola)',
  'ao-huambo': 'Huambo (Angola)',
  'ao-huila': 'Huíla (Angola)',
  'ao-luanda': 'Luanda (Angola)',
  'ao-lunda-norte': 'Lunda Norte (Angola)',
  'ao-lunda-sul': 'Lunda Sul (Angola)',
  'ao-moxico': 'Moxico (Angola)',
};

export const REGIONS_BY_COUNTRY: Record<SupportedCountryCode, readonly string[]> = {
  cd: PROVINCES_RDC_IDS,
  zm: REGIONS_ZAMBIA_IDS,
  za: REGIONS_SOUTH_AFRICA_IDS,
  tz: REGIONS_TANZANIA_IDS,
  ao: REGIONS_ANGOLA_IDS,
};

export const REGION_NAMES_BY_COUNTRY: Record<SupportedCountryCode, Record<string, string>> = {
  cd: PROVINCES_RDC_NAMES as Record<string, string>,
  zm: REGIONS_ZAMBIA_NAMES as Record<string, string>,
  za: REGIONS_SOUTH_AFRICA_NAMES as Record<string, string>,
  tz: REGIONS_TANZANIA_NAMES as Record<string, string>,
  ao: REGIONS_ANGOLA_NAMES as Record<string, string>,
};

export const CITY_SUGGESTIONS_BY_COUNTRY: Record<SupportedCountryCode, readonly string[]> = {
  cd: ['Lubumbashi', 'Kolwezi', 'Kinshasa', 'Goma', 'Bukavu'],
  zm: ['Lusaka', 'Ndola', 'Kitwe', 'Livingstone', 'Kasama'],
  za: ['Johannesburg', 'Pretoria', 'Durban', 'Cape Town', 'Port Elizabeth'],
  tz: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Mbeya'],
  ao: ['Luanda', 'Benguela', 'Lobito', 'Huambo', 'Lubango'],
};

export function getDefaultRegionForCountry(country: SupportedCountryCode): string {
  return REGIONS_BY_COUNTRY[country][0] || '';
}

export function getRegionName(country: SupportedCountryCode, regionId: string): string {
  return REGION_NAMES_BY_COUNTRY[country][regionId] || regionId;
}

/** Tous les IDs province/région du corridor (RDC, Zambie, Afrique du Sud, Tanzanie, Angola). */
export const ALL_CORRIDOR_REGION_IDS = [
  ...REGIONS_BY_COUNTRY.cd,
  ...REGIONS_BY_COUNTRY.zm,
  ...REGIONS_BY_COUNTRY.za,
  ...REGIONS_BY_COUNTRY.tz,
  ...REGIONS_BY_COUNTRY.ao,
] as const;

export type AllCorridorRegionId = (typeof ALL_CORRIDOR_REGION_IDS)[number];

export const ALL_CORRIDOR_REGION_NAMES: Record<string, string> = {
  ...REGION_NAMES_BY_COUNTRY.cd,
  ...REGION_NAMES_BY_COUNTRY.zm,
  ...REGION_NAMES_BY_COUNTRY.za,
  ...REGION_NAMES_BY_COUNTRY.tz,
  ...REGION_NAMES_BY_COUNTRY.ao,
};
