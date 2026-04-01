'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Fuel, Route, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DEFAULT_PRICE_CDF_PER_LITER,
  TRUCK_CONSUMPTION_PRESETS,
  estimateFuelCost,
} from '@/lib/rates/fuel';
import { getRouteDistanceKm } from '@/lib/rates/estimate-trip';
import { CitySelectOptions } from '@/components/rates/CitySelectOptions';
import { cdfToUsd } from '@/lib/utils/pricing';

const VEHICLE_PRESET_KEYS: Record<string, 'vehicleSemi' | 'vehiclePorteur' | 'vehicleCiterne' | 'vehiclePlateau' | 'vehicleFrigo'> = {
  semi: 'vehicleSemi',
  porteur: 'vehiclePorteur',
  citerne: 'vehicleCiterne',
  plateau: 'vehiclePlateau',
  frigo: 'vehicleFrigo',
};

export function FuelEstimator() {
  const t = useTranslations('estimators');
  const locale = useLocale();
  const localeTag = locale === 'en' ? 'en-US' : 'fr-FR';

  const [mode, setMode] = useState<'route' | 'manual'>('route');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distanceManual, setDistanceManual] = useState('300');
  const [presetId, setPresetId] = useState(TRUCK_CONSUMPTION_PRESETS[0].id);
  const [litersPer100, setLitersPer100] = useState(String(TRUCK_CONSUMPTION_PRESETS[0].litersPer100Km));
  const [priceLiter, setPriceLiter] = useState(String(DEFAULT_PRICE_CDF_PER_LITER));
  const [roundTrip, setRoundTrip] = useState(false);
  const [showUsd, setShowUsd] = useState(false);

  const routeInfo = useMemo(() => {
    if (!origin || !destination) return null;
    return getRouteDistanceKm(origin, destination);
  }, [origin, destination]);

  const distanceKm = useMemo(() => {
    if (mode === 'manual') {
      const n = parseFloat(distanceManual.replace(',', '.'));
      return Number.isFinite(n) && n > 0 ? n : 0;
    }
    if (!origin || !destination) return 0;
    return routeInfo!.km;
  }, [mode, origin, destination, distanceManual, routeInfo]);

  const lPer100 = useMemo(() => {
    const n = parseFloat(litersPer100.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 35;
  }, [litersPer100]);

  const priceL = useMemo(() => {
    const n = parseFloat(priceLiter.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_PRICE_CDF_PER_LITER;
  }, [priceLiter]);

  const result = useMemo(() => {
    if (distanceKm <= 0) return null;
    return estimateFuelCost({
      distanceKm,
      litersPer100Km: lPer100,
      priceCdfPerLiter: priceL,
      roundTrip,
    });
  }, [distanceKm, lPer100, priceL, roundTrip]);

  const applyPreset = (id: string) => {
    setPresetId(id);
    const p = TRUCK_CONSUMPTION_PRESETS.find((x) => x.id === id);
    if (p) setLitersPer100(String(p.litersPer100Km));
  };

  const litersMatchesPreset = TRUCK_CONSUMPTION_PRESETS.some(
    (p) => Math.abs(parseFloat(litersPer100.replace(',', '.')) - p.litersPer100Km) < 0.15,
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Fuel className="w-5 h-5 text-amber-600" />
          {t('fuelTitle')}
        </h3>
        <p className="text-sm text-gray-500">{t('fuelIntro')}</p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('route')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              mode === 'route' ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-600'
            }`}
          >
            <Route className="w-3.5 h-3.5 inline mr-1" />
            {t('byCities')}
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              mode === 'manual' ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-600'
            }`}
          >
            {t('manualDistance')}
          </button>
        </div>

        {mode === 'route' ? (
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
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('distanceKm')}</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full max-w-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={distanceManual}
              onChange={(e) => setDistanceManual(e.target.value)}
              placeholder={t('distancePlaceholder')}
            />
          </div>
        )}

        {mode === 'route' && origin && destination && routeInfo && (
          <p className="text-sm text-gray-600">
            {t('distanceKept')} <strong>{routeInfo.km} km</strong>
            {routeInfo.source === 'approximate' && (
              <span className="text-amber-700"> {t('approxRoute')}</span>
            )}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicleType')}</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={presetId}
              onChange={(e) => applyPreset(e.target.value)}
            >
              {TRUCK_CONSUMPTION_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(VEHICLE_PRESET_KEYS[p.id])} ({t('litersPer100Fmt', { n: p.litersPer100Km })})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('consumption')}</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={litersPer100}
              onChange={(e) => setLitersPer100(e.target.value)}
            />
            {!litersMatchesPreset && (
              <p className="text-xs text-amber-700 mt-1">{t('customConsumption')}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('dieselPrice')}</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={priceLiter}
              onChange={(e) => setPriceLiter(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 mt-6 md:mt-8 cursor-pointer">
            <input
              type="checkbox"
              checked={roundTrip}
              onChange={(e) => setRoundTrip(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <RotateCcw className="w-4 h-4 text-gray-500" />
              {t('roundTrip')}
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{t('display')}</span>
          <Button type="button" size="sm" variant={showUsd ? 'primary' : 'outline'} onClick={() => setShowUsd(false)}>
            CDF
          </Button>
          <Button type="button" size="sm" variant={showUsd ? 'outline' : 'primary'} onClick={() => setShowUsd(true)}>
            USD
          </Button>
        </div>
      </div>

      {result && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-6 text-white space-y-4">
          <div className="text-sm opacity-90">{t('fuelCostEst')}</div>
          <div className="text-3xl md:text-4xl font-extrabold">
            {showUsd
              ? `${cdfToUsd(result.costCDF).toLocaleString(localeTag, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
              : `${result.costCDF.toLocaleString(localeTag)} CDF`}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm opacity-95">
            <div>
              <div className="opacity-75">{t('distance')}</div>
              <div className="font-semibold">{result.effectiveDistanceKm} km</div>
            </div>
            <div>
              <div className="opacity-75">{t('volumeDiesel')}</div>
              <div className="font-semibold">{result.litersTotal} L</div>
            </div>
            <div>
              <div className="opacity-75">{t('consoShort')}</div>
              <div className="font-semibold">{lPer100} L/100 km</div>
            </div>
            <div>
              <div className="opacity-75">{t('cdfPerKmFuel')}</div>
              <div className="font-semibold">
                {Math.round(result.costCDF / result.effectiveDistanceKm).toLocaleString(localeTag)}
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <p className="text-sm text-gray-400">
          {mode === 'route' && (!origin || !destination) && t('pickRoute')}
          {mode === 'manual' && !parseFloat(distanceManual.replace(',', '.')) && t('enterDistance')}
        </p>
      )}
    </div>
  );
}
