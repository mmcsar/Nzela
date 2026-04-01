'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, AlertCircle, Search, Route, CalendarRange } from 'lucide-react';
import { toErrorMessage } from '@/lib/api/error';
import { CitySelectOptions } from '@/components/rates/CitySelectOptions';

interface RateEstimate {
  origin: string;
  destination: string;
  cargoType: string;
  distanceKm: number;
  distanceSource: 'known_route' | 'approximate';
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
  currency: string;
  weightFactorApplied: boolean;
}

interface MarketData {
  trend: string;
  trendPercent: number;
  avgLoadsPerWeek: number;
  avgTrucksAvailable: number;
  lastUpdated: string;
}

export function RateEstimator() {
  const t = useTranslations('estimators');
  const locale = useLocale();
  const localeTag = locale === 'en' ? 'en-US' : 'fr-FR';
  const seasonLocale = locale === 'en' ? 'en' : 'fr';

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoType, setCargoType] = useState('general');
  const [weight, setWeight] = useState('');
  const [currency, setCurrency] = useState('CDF');
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [estimate, setEstimate] = useState<RateEstimate | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        v: i + 1,
        label: new Date(2000, i, 1).toLocaleDateString(localeTag, { month: 'long' }),
      })),
    [localeTag],
  );

  const cargoTypes = useMemo(
    () =>
      [
        { value: 'general', labelKey: 'cargoGeneral' as const },
        { value: 'minerais', labelKey: 'cargoMinerals' as const },
        { value: 'ciment', labelKey: 'cargoCement' as const },
        { value: 'carburant', labelKey: 'cargoFuel' as const },
        { value: 'marchandises', labelKey: 'cargoGoods' as const },
        { value: 'agriculture', labelKey: 'cargoAgri' as const },
        { value: 'equipements', labelKey: 'cargoEquip' as const },
        { value: 'conteneur', labelKey: 'cargoContainer' as const },
      ] as const,
    [],
  );

  const fetchEstimate = async () => {
    if (!origin || !destination) {
      setError(t('errorOriginDest'));
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        origin,
        destination,
        cargoType,
        currency,
        month: String(month),
        locale: seasonLocale,
        ...(weight ? { weight } : {}),
      });
      const response = await fetch(`/api/rates?${params}`);
      const data = await response.json();

      if (response.ok) {
        setEstimate(data.estimate);
        setMarket(data.market);
      } else {
        setError(toErrorMessage(data.error, t('errorEstimate')));
      }
    } catch (err) {
      setError(t('errorConnection'));
    } finally {
      setIsLoading(false);
    }
  };

  const confidenceColors = {
    high: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-700',
  };

  const confidenceLabel = (c: 'high' | 'medium' | 'low') =>
    c === 'high' ? t('confidenceHigh') : c === 'medium' ? t('confidenceMedium') : t('confidenceLow');

  const fmt = (n: number, cur: string) =>
    cur === 'USD'
      ? n.toLocaleString(localeTag, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : n.toLocaleString(localeTag);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          {t('rateTitle')}
        </h3>
        <p className="text-sm text-gray-500">{t('rateIntro')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('origin')}</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            >
              <option value="">{t('selectPlaceholder')}</option>
              <CitySelectOptions />
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('destination')}</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="">{t('selectPlaceholder')}</option>
              <CitySelectOptions excludeSlug={origin} />
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoType')}</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={cargoType}
              onChange={(e) => setCargoType(e.target.value)}
            >
              {cargoTypes.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {t(ct.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5" />
              {t('monthSeason')}
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            >
              {monthOptions.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('weightKg')}</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={t('weightPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('currency')}</label>
            <div className="flex gap-2">
              {['CDF', 'USD'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    currency === c
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <Button onClick={fetchEstimate} isLoading={isLoading} className="w-full">
          <Search className="w-4 h-4 mr-2" />
          {t('estimateButton')}
        </Button>
      </div>

      {estimate && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
            <div className="text-sm opacity-80 mb-1">{t('estimatedPrice')}</div>
            <div className="text-4xl font-extrabold">
              {fmt(estimate.estimatedPrice, estimate.currency)} {estimate.currency}
            </div>
            <div className="text-sm opacity-80 mt-1">
              {t('priceRange')}: {fmt(estimate.priceRange.min, estimate.currency)} — {fmt(estimate.priceRange.max, estimate.currency)}{' '}
              {estimate.currency}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  estimate.confidence === 'high'
                    ? 'bg-white/20'
                    : estimate.confidence === 'medium'
                      ? 'bg-amber-400/30'
                      : 'bg-red-400/30'
                }`}
              >
                {t('confidence')}: {confidenceLabel(estimate.confidence)}
              </span>
              <span className="text-xs opacity-70">
                {estimate.basedOn > 0
                  ? t('basedOnReal', { count: estimate.basedOn })
                  : t('basedOnHeuristic')}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4 text-sm text-gray-700 space-y-2">
            <div className="flex items-start gap-2">
              <Route className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium text-gray-900">{t('distance')}</span> : {estimate.distanceKm} km
                {estimate.distanceSource === 'approximate' && (
                  <span className="text-amber-700"> {t('approxSegment')}</span>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarRange className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium text-gray-900">{t('season')}</span> : {estimate.seasonLabel} (×{estimate.seasonFactor})
              </div>
            </div>
            {estimate.weightFactorApplied && (
              <p className="text-amber-800 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                {t('weightSurcharge')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center">
              <DollarSign className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
              <div className="text-lg font-bold text-gray-900">{fmt(estimate.avgPricePerKm, estimate.currency)}</div>
              <div className="text-xs text-gray-500">{t('perKmAvg', { currency: estimate.currency })}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">{t('minMaxPerKm')}</div>
              <div className="text-lg font-bold text-gray-900">
                {fmt(estimate.minPricePerKm, estimate.currency)} — {fmt(estimate.maxPricePerKm, estimate.currency)}
              </div>
              <div className="text-xs text-gray-500">{estimate.currency}/km</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">{t('confidence')}</div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${confidenceColors[estimate.confidence]}`}>
                {confidenceLabel(estimate.confidence)}
              </span>
            </div>
          </div>

          {market && (
            <div className="bg-white rounded-xl border p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('marketTrend')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {market.trend === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-red-500" />
                  ) : market.trend === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <div
                      className={`text-sm font-bold ${
                        market.trend === 'up' ? 'text-red-600' : market.trend === 'down' ? 'text-emerald-600' : 'text-gray-600'
                      }`}
                    >
                      {market.trend === 'up' ? '+' : market.trend === 'down' ? '−' : '≈'}
                      {market.trend === 'stable' ? '0' : market.trendPercent}%
                    </div>
                    <div className="text-xs text-gray-500">{t('vsPrevMonth')}</div>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-sm font-bold text-gray-900">{market.avgLoadsPerWeek}</div>
                  <div className="text-xs text-gray-500">{t('loadsPerWeek')}</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-sm font-bold text-gray-900">{market.avgTrucksAvailable}</div>
                  <div className="text-xs text-gray-500">{t('trucksAvailable')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
