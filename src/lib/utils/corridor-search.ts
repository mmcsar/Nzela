import { ALL_CORRIDOR_REGION_NAMES } from '@/lib/constants/country-regions';
import { SUPPORTED_COUNTRIES, inferCountryCodeFromProvince } from '@/lib/constants/supported-countries';

/**
 * Chaîne pour recherche plein texte sur origine/destination (pays FR, codes ISO courts,
 * id province, libellé région affiché sur le corridor).
 */
export function corridorLocationSearchBlob(countryCode?: string, provinceId?: string): string {
  const tokens: string[] = [];
  const cc = (countryCode || '').trim().toLowerCase();
  const pid = (provinceId || '').trim().toLowerCase();

  if (cc) tokens.push(cc);
  if (pid) {
    tokens.push(pid);
    tokens.push(pid.replace(/-/g, ' '));
  }

  const meta = SUPPORTED_COUNTRIES.find((c) => c.code === cc);
  if (meta) {
    tokens.push(meta.label.toLowerCase());
    tokens.push(meta.currency.toLowerCase());
  }

  const regionLabel = pid ? ALL_CORRIDOR_REGION_NAMES[pid] : undefined;
  if (regionLabel) tokens.push(regionLabel.toLowerCase());

  // Synonymes / anglais utiles pour la barre de recherche
  if (cc === 'zm' || regionLabel?.toLowerCase().includes('zambie')) {
    tokens.push('zambia');
  }
  if (cc === 'za' || regionLabel?.toLowerCase().includes('afrique du sud')) {
    tokens.push('south africa', 'afrique-du-sud', 'rsa');
  }
  if (cc === 'tz' || regionLabel?.toLowerCase().includes('tanzanie')) {
    tokens.push('tanzania');
  }
  if (cc === 'ao' || regionLabel?.toLowerCase().includes('angola')) {
    tokens.push('angola');
  }
  if (cc === 'cd') {
    tokens.push('rdc', 'drc', 'congo');
  }

  return tokens.filter(Boolean).join(' ');
}

/** Pays déduit uniquement si une province / région est renseignée (évite d’imputer RDC partout). */
export function countryCodeForSearchProvince(province?: string): string | undefined {
  if (!province?.trim()) return undefined;
  return inferCountryCodeFromProvince(province);
}
