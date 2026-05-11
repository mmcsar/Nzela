export const SUPPORTED_COUNTRIES = [
  { code: 'cd', label: 'RDC', phonePrefix: '+243', currency: 'CDF' },
  { code: 'zm', label: 'Zambie', phonePrefix: '+260', currency: 'ZMW' },
  { code: 'za', label: 'Afrique du Sud', phonePrefix: '+27', currency: 'ZAR' },
  { code: 'tz', label: 'Tanzanie', phonePrefix: '+255', currency: 'TZS' },
  { code: 'ao', label: 'Angola', phonePrefix: '+244', currency: 'AOA' },
] as const;

export type SupportedCountryCode = (typeof SUPPORTED_COUNTRIES)[number]['code'];

export const COUNTRY_BY_CODE: Record<SupportedCountryCode, (typeof SUPPORTED_COUNTRIES)[number]> =
  SUPPORTED_COUNTRIES.reduce((acc, country) => {
    acc[country.code] = country;
    return acc;
  }, {} as Record<SupportedCountryCode, (typeof SUPPORTED_COUNTRIES)[number]>);

export function inferCountryCodeFromProvince(province?: string): SupportedCountryCode {
  const normalized = (province || '').toLowerCase();
  if (normalized.startsWith('zambie-')) return 'zm';
  if (normalized.startsWith('za-')) return 'za';
  if (normalized.startsWith('tz-')) return 'tz';
  if (normalized.startsWith('ao-')) return 'ao';
  return 'cd';
}
