'use client';

import { useTranslations } from 'next-intl';
import { CITIES_RDC, CITIES_ZAMBIA, cityToValue } from '@/lib/constants/corridor-cities';

type Props = {
  /** Slug `cityToValue` à exclure (ex. origine pour la destination) — uniquement si valueMode = slug */
  excludeSlug?: string;
  /** `slug` : valeur minuscule pour API distance (estimateurs). `display` : nom affiché = valeur (modèles, alertes). */
  valueMode?: 'slug' | 'display';
};

/**
 * Options groupées RDC / Zambie pour les listes origine–destination des estimateurs.
 */
export function CitySelectOptions({ excludeSlug, valueMode = 'slug' }: Props) {
  const t = useTranslations('estimators');
  const val = (c: string) => (valueMode === 'display' ? c : cityToValue(c));
  const keep = (city: string) =>
    !excludeSlug || (valueMode === 'display' ? city !== excludeSlug : cityToValue(city) !== excludeSlug);

  return (
    <>
      <optgroup label={t('optgroupRdc')}>
        {CITIES_RDC.filter(keep).map((c) => (
          <option key={c} value={val(c)}>
            {c}
          </option>
        ))}
      </optgroup>
      <optgroup label={t('optgroupZambia')}>
        {CITIES_ZAMBIA.filter(keep).map((c) => (
          <option key={c} value={val(c)}>
            {c}
          </option>
        ))}
      </optgroup>
    </>
  );
}
