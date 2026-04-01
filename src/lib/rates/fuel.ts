/**
 * Estimation coût carburant (diesel) — indicatif
 */

export const DEFAULT_PRICE_CDF_PER_LITER = 3200;

export const TRUCK_CONSUMPTION_PRESETS: { id: string; label: string; litersPer100Km: number }[] = [
  { id: 'semi', label: 'Semi-remorque (charge)', litersPer100Km: 38 },
  { id: 'porteur', label: 'Porteur / 6×4', litersPer100Km: 32 },
  { id: 'citerne', label: 'Citerne', litersPer100Km: 36 },
  { id: 'plateau', label: 'Plateau / conteneur', litersPer100Km: 35 },
  { id: 'frigo', label: 'Frigorifique', litersPer100Km: 40 },
];

export interface FuelEstimateInput {
  distanceKm: number;
  litersPer100Km: number;
  priceCdfPerLiter: number;
  roundTrip: boolean;
}

export interface FuelEstimateResult {
  effectiveDistanceKm: number;
  litersTotal: number;
  costCDF: number;
  litersPer100Km: number;
  priceCdfPerLiter: number;
}

export function estimateFuelCost(input: FuelEstimateInput): FuelEstimateResult {
  const d = Math.max(0, input.distanceKm) * (input.roundTrip ? 2 : 1);
  const liters = (d * input.litersPer100Km) / 100;
  const cost = Math.round(liters * input.priceCdfPerLiter);
  return {
    effectiveDistanceKm: Math.round(d * 10) / 10,
    litersTotal: Math.round(liters * 10) / 10,
    costCDF: cost,
    litersPer100Km: input.litersPer100Km,
    priceCdfPerLiter: input.priceCdfPerLiter,
  };
}
