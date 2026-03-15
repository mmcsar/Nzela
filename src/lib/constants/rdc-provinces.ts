import { REGIONS_ZAMBIA_IDS, REGIONS_ZAMBIA_NAMES } from './zambie-regions';

/**
 * Liste des 26 provinces de la RDC – source unique pour toute la plateforme.
 * Nzela couvre toute la RDC.
 */
export const PROVINCES_RDC_IDS = [
  'haut-katanga',
  'lualaba',
  'haut-lomami',
  'tanganyika',
  'kinshasa',
  'kongo-central',
  'kasai',
  'kasai-central',
  'kasai-oriental',
  'lomami',
  'sankuru',
  'maniema',
  'sud-kivu',
  'nord-kivu',
  'ituri',
  'tshopo',
  'bas-uele',
  'haut-uele',
  'mongala',
  'nord-ubangi',
  'sud-ubangi',
  'equateur',
  'tshuapa',
  'kwango',
  'kwilu',
  'mai-ndombe',
] as const;

export type ProvinceId = (typeof PROVINCES_RDC_IDS)[number];

export const PROVINCES_RDC_NAMES: Record<ProvinceId, string> = {
  'haut-katanga': 'Haut-Katanga',
  lualaba: 'Lualaba',
  'haut-lomami': 'Haut-Lomami',
  tanganyika: 'Tanganyika',
  kinshasa: 'Kinshasa',
  'kongo-central': 'Kongo-Central',
  kasai: 'Kasai',
  'kasai-central': 'Kasai-Central',
  'kasai-oriental': 'Kasai-Oriental',
  lomami: 'Lomami',
  sankuru: 'Sankuru',
  maniema: 'Maniema',
  'sud-kivu': 'Sud-Kivu',
  'nord-kivu': 'Nord-Kivu',
  ituri: 'Ituri',
  tshopo: 'Tshopo',
  'bas-uele': 'Bas-Uélé',
  'haut-uele': 'Haut-Uélé',
  mongala: 'Mongala',
  'nord-ubangi': 'Nord-Ubangi',
  'sud-ubangi': 'Sud-Ubangi',
  equateur: 'Équateur',
  tshuapa: 'Tshuapa',
  kwango: 'Kwango',
  kwilu: 'Kwilu',
  'mai-ndombe': 'Mai-Ndombe',
};

/** Nombre de provinces (26). */
export const PROVINCES_RDC_COUNT = PROVINCES_RDC_IDS.length;

/** Toutes les régions (RDC + Zambie) pour origine/destination loads et camions */
export const ALL_REGION_IDS = [...PROVINCES_RDC_IDS, ...REGIONS_ZAMBIA_IDS] as const;
export type AllRegionId = (typeof ALL_REGION_IDS)[number];
export const ALL_REGION_NAMES: Record<AllRegionId, string> = {
  ...PROVINCES_RDC_NAMES,
  ...REGIONS_ZAMBIA_NAMES,
};
