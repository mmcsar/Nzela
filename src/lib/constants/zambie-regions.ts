/**
 * Les 10 provinces de la Zambie – pour origine/destination des chargements et camions.
 */
export const REGIONS_ZAMBIA_IDS = [
  'zambie-central',
  'zambie-copperbelt',
  'zambie-eastern',
  'zambie-luapula',
  'zambie-lusaka',
  'zambie-muchinga',
  'zambie-northern',
  'zambie-north-western',
  'zambie-southern',
  'zambie-western',
] as const;

export type ZambiaRegionId = (typeof REGIONS_ZAMBIA_IDS)[number];

export const REGIONS_ZAMBIA_NAMES: Record<ZambiaRegionId, string> = {
  'zambie-central': 'Central (Zambie)',
  'zambie-copperbelt': 'Copperbelt (Zambie)',
  'zambie-eastern': 'Eastern (Zambie)',
  'zambie-luapula': 'Luapula (Zambie)',
  'zambie-lusaka': 'Lusaka (Zambie)',
  'zambie-muchinga': 'Muchinga (Zambie)',
  'zambie-northern': 'Northern (Zambie)',
  'zambie-north-western': 'North-Western (Zambie)',
  'zambie-southern': 'Southern (Zambie)',
  'zambie-western': 'Western (Zambie)',
};
