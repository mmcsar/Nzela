/**
 * Estimation de tarifs transport (RDC, corridor Zambie) : distance référence, type de marchandise, saison.
 */

import { ROUTES_RDC } from '@/lib/constants/rdc-routes';
import { CORRIDOR_CITIES_ALL } from '@/lib/constants/corridor-cities';
import { cdfToUsd } from '@/lib/utils/pricing';

/** Villes proposées dans les estimateurs (RDC + Zambie) */
export const ESTIMATOR_CITIES = CORRIDOR_CITIES_ALL;

function parseKm(distanceStr: string): number {
  const m = distanceStr.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function normCity(c: string): string {
  return c.trim().toLowerCase();
}

/** Paire origine|destination -> km (bidirectionnel) */
function buildDistanceMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of ROUTES_RDC) {
    const km = parseKm(r.distance);
    if (km <= 0) continue;
    const a = normCity(r.from);
    const b = normCity(r.to);
    map.set(`${a}|${b}`, km);
    map.set(`${b}|${a}`, km);
  }
  return map;
}

const DISTANCE_MAP = buildDistanceMap();

export type DistanceSource = 'known_route' | 'approximate';

export function getRouteDistanceKm(origin: string, destination: string): { km: number; source: DistanceSource } {
  const key = `${normCity(origin)}|${normCity(destination)}`;
  const km = DISTANCE_MAP.get(key);
  if (km != null && km > 0) return { km, source: 'known_route' };
  // Ordre de grandeur si villes connues mais pas la paire : moyenne des tronçons depuis l'origine
  const fromOrigin = [...DISTANCE_MAP.entries()]
    .filter(([k]) => k.startsWith(`${normCity(origin)}|`))
    .map(([, v]) => v);
  if (fromOrigin.length > 0) {
    const avg = Math.round(fromOrigin.reduce((s, n) => s + n, 0) / fromOrigin.length);
    return { km: Math.max(avg, 120), source: 'approximate' };
  }
  return { km: 250, source: 'approximate' };
}

/** Barème indicatif CDF / km selon type (aligné sur pricing.ts) */
const CARGO_CDF_PER_KM: Record<string, number> = {
  general: 2500,
  minerais: 3500,
  ciment: 2800,
  carburant: 4000,
  marchandises: 2500,
  agriculture: 2200,
  equipements: 3200,
  conteneur: 3000,
};

export type SeasonLocale = 'fr' | 'en';

const SEASON_LABELS: Record<SeasonLocale, { normal: string; rainy: string; peakRain: string; peak: string; calm: string }> = {
  fr: {
    normal: 'Saison normale',
    rainy: 'Saison des pluies (+4 % route)',
    peakRain: 'Pluies + activité élevée (+6 %)',
    peak: 'Activité élevée (+2 %)',
    calm: 'Période calme (-2 %)',
  },
  en: {
    normal: 'Normal season',
    rainy: 'Rainy season (+4 % road)',
    peakRain: 'Rainy + high activity (+6 %)',
    peak: 'High activity (+2 %)',
    calm: 'Quiet period (-2 %)',
  },
};

/** Facteur saisonnier (route / demande) — 1 = neutre */
export function getSeasonFactor(month: number, locale: SeasonLocale = 'fr'): { factor: number; label: string } {
  const L = SEASON_LABELS[locale];
  const m = Math.min(12, Math.max(1, month));
  const rainy = [11, 12, 1, 2, 3, 4].includes(m);
  const peak = [10, 11, 12].includes(m);

  let factor = 1;
  let label = L.normal;

  if (rainy) {
    factor *= 1.04;
    label = L.rainy;
  }
  if (peak) {
    factor *= 1.02;
    label = rainy ? L.peakRain : L.peak;
  }
  if (!rainy && !peak && [6, 7, 8].includes(m)) {
    factor *= 0.98;
    label = L.calm;
  }

  return { factor: Math.round(factor * 1000) / 1000, label };
}

export interface TripEstimateInput {
  origin: string;
  destination: string;
  cargoType: string;
  weightKg?: number;
  currency: 'CDF' | 'USD';
  /** Mois 1–12 pour la saison (défaut : mois courant côté serveur) */
  month?: number;
  /** Libellés de saison (API / estimateurs) */
  locale?: SeasonLocale;
  /** Prix / km observés sur la route (CDF), si disponible */
  dbPricePerKmSamples?: number[];
}

export interface TripEstimateResult {
  origin: string;
  destination: string;
  cargoType: string;
  distanceKm: number;
  distanceSource: DistanceSource;
  seasonMonth: number;
  seasonLabel: string;
  seasonFactor: number;
  avgPricePerKm: number;
  minPricePerKm: number;
  maxPricePerKm: number;
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidence: 'high' | 'medium' | 'low';
  basedOn: number;
  currency: 'CDF' | 'USD';
  weightFactorApplied: boolean;
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function toDisplayAmount(cdf: number, currency: 'CDF' | 'USD'): number {
  if (currency === 'USD') return cdfToUsd(cdf);
  return Math.round(cdf);
}

export function estimateTrip(input: TripEstimateInput): TripEstimateResult {
  const { km, source } = getRouteDistanceKm(input.origin, input.destination);
  const month = input.month ?? new Date().getMonth() + 1;
  const loc = input.locale ?? 'fr';
  const { factor: seasonFactor, label: seasonLabel } = getSeasonFactor(month, loc);

  const basePerKm =
    CARGO_CDF_PER_KM[input.cargoType.toLowerCase()] ?? CARGO_CDF_PER_KM.general;

  const samples = input.dbPricePerKmSamples?.filter((n) => n > 0) ?? [];
  const hasDb = samples.length >= 3;

  let avgPricePerKmCdf: number;
  let minPpk: number;
  let maxPpk: number;
  let confidence: 'high' | 'medium' | 'low';
  let basedOn: number;

  if (hasDb) {
    const dbMean = mean(samples);
    const dbMin = Math.min(...samples);
    const dbMax = Math.max(...samples);
    const heur = basePerKm * seasonFactor;
    // Mélange barème / données réelles
    if (samples.length >= 8) {
      avgPricePerKmCdf = Math.round(dbMean * 0.85 + heur * 0.15);
      minPpk = Math.round(dbMin * 0.92);
      maxPpk = Math.round(dbMax * 1.08);
      confidence = 'high';
    } else {
      avgPricePerKmCdf = Math.round(dbMean * 0.65 + heur * 0.35);
      minPpk = Math.round(Math.min(dbMin, heur * 0.85));
      maxPpk = Math.round(Math.max(dbMax, heur * 1.15));
      confidence = 'medium';
    }
    basedOn = samples.length;
  } else if (samples.length > 0) {
    const heur = basePerKm * seasonFactor;
    avgPricePerKmCdf = Math.round(mean(samples) * 0.4 + heur * 0.6);
    minPpk = Math.round(heur * 0.75);
    maxPpk = Math.round(heur * 1.25);
    confidence = 'low';
    basedOn = samples.length;
  } else {
    avgPricePerKmCdf = Math.round(basePerKm * seasonFactor);
    minPpk = Math.round(basePerKm * seasonFactor * 0.78);
    maxPpk = Math.round(basePerKm * seasonFactor * 1.22);
    confidence = source === 'known_route' ? 'medium' : 'low';
    basedOn = 0;
  }

  const w = input.weightKg;
  let weightMult = 1;
  let weightFactorApplied = false;
  if (w != null && w > 15000) {
    weightMult = 1.2;
    weightFactorApplied = true;
  } else if (w != null && w > 8000) {
    weightMult = 1.08;
    weightFactorApplied = true;
  }

  const totalCdf = Math.max(
    Math.round(km * avgPricePerKmCdf * weightMult),
    50_000,
  );
  const minTotal = Math.max(Math.round(km * minPpk * weightMult), 45_000);
  const maxTotal = Math.max(Math.round(km * maxPpk * weightMult), totalCdf);

  const cur = input.currency;
  return {
    origin: input.origin,
    destination: input.destination,
    cargoType: input.cargoType,
    distanceKm: km,
    distanceSource: source,
    seasonMonth: month,
    seasonLabel,
    seasonFactor,
    avgPricePerKm: toDisplayAmount(avgPricePerKmCdf, cur),
    minPricePerKm: toDisplayAmount(minPpk, cur),
    maxPricePerKm: toDisplayAmount(maxPpk, cur),
    estimatedPrice: toDisplayAmount(totalCdf, cur),
    priceRange: {
      min: toDisplayAmount(minTotal, cur),
      max: toDisplayAmount(maxTotal, cur),
    },
    confidence,
    basedOn,
    currency: cur,
    weightFactorApplied,
  };
}
