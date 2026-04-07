/** Tirets « exotiques » (copier-coller PDF, Word) → U+002D */
const UNICODE_HYPHENS = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;

/** Caractères invisibles fréquents dans les collages */
const INVISIBLE = /[\u200B-\u200D\uFEFF\u00AD]/g;

/**
 * Normalise un RCCM pour affichage / saisie : majuscules, espaces unifiés, tiret ASCII.
 */
export function normalizeRccm(value: string): string {
  if (!value) return '';
  return value
    .replace(INVISIBLE, '')
    .replace(UNICODE_HYPHENS, '-')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

/**
 * Compare deux RCCM de façon tolérante :
 * - même normalisation (tirets unicode, espaces) ;
 * - si encore différent, comparaison « compacte » (tous les espaces retirés), utile pour
 *   LSHI 17-B-6981 vs LSHI17-B-6981.
 */
export function rccmEquals(stored: string, entered: string): boolean {
  const a = normalizeRccm(stored);
  const b = normalizeRccm(entered);
  if (a === b) return true;
  const ca = a.replace(/\s/g, '');
  const cb = b.replace(/\s/g, '');
  return ca.length > 0 && ca === cb;
}
