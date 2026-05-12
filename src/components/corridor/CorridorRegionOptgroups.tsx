'use client';

import { REGIONS_BY_COUNTRY, getRegionName } from '@/lib/constants/country-regions';
import { SUPPORTED_COUNTRIES, type SupportedCountryCode } from '@/lib/constants/supported-countries';

type Props = {
  /** Première option (ex. destination camion optionnelle) */
  emptyOption?: { value: string; label: string };
};

/**
 * Liste complète corridor : un seul &lt;select&gt; avec libellés de pays (optgroup),
 * pour éviter de croire que seules les provinces RDC existent.
 */
export function CorridorRegionOptgroups({ emptyOption }: Props) {
  return (
    <>
      {emptyOption ? <option value={emptyOption.value}>{emptyOption.label}</option> : null}
      {SUPPORTED_COUNTRIES.map((country) => (
        <optgroup key={country.code} label={country.label}>
          {REGIONS_BY_COUNTRY[country.code as SupportedCountryCode].map((regionId) => (
            <option key={regionId} value={regionId}>
              {getRegionName(country.code, regionId)}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
