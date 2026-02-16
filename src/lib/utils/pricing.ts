/**
 * Utilitaires de calcul de prix pour la plateforme Nzela
 * Monnaies: CDF (Franc Congolais) et USD
 */

// Taux de change approximatif (à mettre à jour via API)
const CDF_TO_USD = 0.00036; // 1 CDF ≈ 0.00036 USD
const USD_TO_CDF = 2780;    // 1 USD ≈ 2780 CDF

/**
 * Convertir CDF en USD
 */
export function cdfToUsd(amountCDF: number): number {
  return Math.round(amountCDF * CDF_TO_USD * 100) / 100;
}

/**
 * Convertir USD en CDF
 */
export function usdToCdf(amountUSD: number): number {
  return Math.round(amountUSD * USD_TO_CDF);
}

/**
 * Formater un prix en CDF
 */
export function formatCDF(amount: number): string {
  return new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formater un prix en USD
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formater un prix avec la devise appropriée
 */
export function formatPrice(amount: number, currency: 'CDF' | 'USD' = 'CDF'): string {
  return currency === 'CDF' ? formatCDF(amount) : formatUSD(amount);
}

/**
 * Calculer le prix par km
 */
export function calculatePricePerKm(totalPrice: number, distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return Math.round(totalPrice / distanceKm);
}

/**
 * Estimer le prix d'un trajet en fonction de la distance et du type de cargo
 * Barème indicatif en CDF/km
 */
const PRICE_PER_KM_BY_CARGO: Record<string, number> = {
  'Minerais': 3500,
  'Ciment': 2800,
  'Carburant': 4000,
  'Marchandises': 2500,
  'Équipements': 3200,
  'Alimentaire': 2200,
  'Bois': 2000,
  'Conteneur': 3000,
  'Matériaux de construction': 2600,
  'Produits chimiques': 4500,
};

export function estimatePrice(distanceKm: number, cargoType?: string, weight?: number): number {
  const basePricePerKm = cargoType
    ? (PRICE_PER_KM_BY_CARGO[cargoType] || 2500)
    : 2500;

  let price = distanceKm * basePricePerKm;

  // Majoration pour les charges lourdes (> 15 tonnes)
  if (weight && weight > 15000) {
    price *= 1.2;
  }

  // Minimum 50 000 CDF
  return Math.max(Math.round(price), 50000);
}

/**
 * Plans d'abonnement avec prix
 */
export const SUBSCRIPTION_PLANS = {
  standard: {
    name: 'Standard',
    priceCDF: 139000,
    priceUSD: 50,
    features: [
      'Recherche et publication illimitees',
      'Alertes de correspondance',
      'Load Board et Truck Board',
      'Messagerie et contact direct',
      'POD / BOL et outils essentiels',
    ],
  },
} as const;

/**
 * Calculer les frais de commission de la plateforme
 * Commission: 5% sur chaque transaction
 */
export function calculateCommission(amount: number, rate: number = 0.05): number {
  return Math.round(amount * rate);
}

/**
 * Calculer le montant net après commission
 */
export function calculateNetAmount(amount: number, commissionRate: number = 0.05): number {
  return amount - calculateCommission(amount, commissionRate);
}
