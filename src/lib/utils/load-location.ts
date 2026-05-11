/**
 * Normalise `loads.origin` / `loads.destination` (jsonb, string, double-encodage,
 * ou champ `city` contenant accidentellement un objet JSON sérialisé).
 */

export type ParsedLoadLocation = {
  city: string;
  province: string;
  country: string;
  address: string;
};

function asNonEmptyString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Si la valeur ressemble à un objet JSON, le parse et retourne ses champs utiles. */
function expandEmbeddedLocationJson(value: string): Partial<ParsedLoadLocation> {
  const t = value.trim();
  if (!t.startsWith('{')) return {};
  try {
    const inner = JSON.parse(t) as Record<string, unknown> | null;
    if (!inner || typeof inner !== 'object' || Array.isArray(inner)) return {};
    return {
      city: asNonEmptyString(inner.city),
      province: asNonEmptyString(inner.province),
      country: asNonEmptyString(inner.country),
      address: asNonEmptyString(inner.address),
    };
  } catch {
    return {};
  }
}

/** Décode jusqu’à 4 couches `string` → JSON (double-encodage API / legacy). */
function unwrapJsonLayers(raw: unknown): unknown {
  let v: unknown = raw;
  for (let i = 0; i < 4 && typeof v === 'string'; i++) {
    const t = v.trim();
    if (!t.startsWith('{') && !t.startsWith('[')) break;
    try {
      v = JSON.parse(v);
    } catch {
      break;
    }
  }
  return v;
}

/**
 * Parse une origine/destination chargement sans lever d’exception.
 */
export function parseLoadLocation(loc: unknown): ParsedLoadLocation {
  const empty: ParsedLoadLocation = { city: '', province: '', country: '', address: '' };
  if (loc == null || loc === '') return empty;

  const v = unwrapJsonLayers(loc);

  if (typeof v === 'string') {
    const t = v.trim();
    if (t.startsWith('{')) {
      const nested = expandEmbeddedLocationJson(t);
      if (nested.city || nested.province) {
        return {
          city: nested.city || '',
          province: nested.province || '',
          country: nested.country || '',
          address: nested.address || '',
        };
      }
    }
    return { city: t, province: '', country: '', address: '' };
  }

  if (typeof v !== 'object' || Array.isArray(v) || v === null) return empty;

  const o = v as Record<string, unknown>;
  let city = asNonEmptyString(o.city);
  let province = asNonEmptyString(o.province);
  let country = asNonEmptyString(o.country);
  let address = asNonEmptyString(o.address);

  const fromCity = expandEmbeddedLocationJson(city);
  if (fromCity.city) {
    city = fromCity.city;
    if (!province && fromCity.province) province = fromCity.province;
    if (!country && fromCity.country) country = fromCity.country;
    if (!address && fromCity.address) address = fromCity.address;
  }

  const fromProv = expandEmbeddedLocationJson(province);
  if (fromProv.city && !city) city = fromProv.city;
  if (fromProv.province) province = fromProv.province;
  if (!country && fromProv.country) country = fromProv.country;

  return { city, province, country, address };
}

/**
 * Libellé court comme les anciens `parseLocation` (TMS facturation, portail, etc.) :
 * ville si présente, sinon adresse, sinon « — ». La province n’est pas ajoutée ici.
 */
export function formatLoadLocationLine(loc: unknown): string {
  const p = parseLoadLocation(loc);
  return p.city || p.address || '—';
}

export function formatLoadRouteArrow(origin: unknown, destination: unknown): string {
  const a = formatLoadLocationLine(origin);
  const b = formatLoadLocationLine(destination);
  if (a === '—' && b === '—') return '—';
  return `${a} → ${b}`;
}
