'use client';

import { useEffect, useMemo } from 'react';
import { REGIONS_BY_COUNTRY, getRegionName } from '@/lib/constants/country-regions';
import {
  SUPPORTED_COUNTRIES,
  type SupportedCountryCode,
  inferCountryCodeFromProvince,
} from '@/lib/constants/supported-countries';

const ANY = '';
const EMPTY_REGIONS: readonly string[] = [];

export type CorridorCountryRegionPickerProps = {
  value: string;
  onChange: (regionId: string) => void;
  countryLabel: string;
  regionLabel: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

function regionList(cc: SupportedCountryCode): readonly string[] {
  return REGIONS_BY_COUNTRY[cc];
}

function countryFromValue(value: string, allowEmpty: boolean): typeof ANY | SupportedCountryCode {
  if (allowEmpty && value === '') return ANY;
  const inferred = inferCountryCodeFromProvince(value);
  return inferred === ANY ? 'cd' : inferred;
}

/**
 * Pays puis province/région : les corridor (Zambie, ZA, Tanzanie, Angola) sont visibles
 * sans faire défiler toute la liste RDC dans un seul &lt;select&gt;.
 */
export function CorridorCountryRegionPicker({
  value,
  onChange,
  countryLabel,
  regionLabel,
  allowEmpty = false,
  emptyLabel = '',
}: CorridorCountryRegionPickerProps) {
  const country = useMemo(
    () => countryFromValue(value, allowEmpty),
    [allowEmpty, value],
  );

  const regions: readonly string[] =
    country === ANY ? EMPTY_REGIONS : regionList(country);

  useEffect(() => {
    if (country === ANY || !regions.length) return;
    if (regions.includes(value)) return;
    const first = regions[0];
    if (first) onChange(first);
  }, [country, regions, value, onChange]);

  const regionValue =
    country === ANY ? '' : regions.includes(value) ? value : (regions[0] ?? '');

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{countryLabel}</label>
        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={country}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === ANY) {
              onChange('');
              return;
            }
            const cc = raw as SupportedCountryCode;
            const first = regionList(cc)[0];
            if (first) onChange(first);
          }}
        >
          {allowEmpty ? <option value={ANY}>{emptyLabel}</option> : null}
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      {country !== ANY ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{regionLabel}</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={regionValue}
            onChange={(e) => onChange(e.target.value)}
          >
            {regions.map((rid) => (
              <option key={rid} value={rid}>
                {getRegionName(country as SupportedCountryCode, rid)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
