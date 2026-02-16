'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, AlertCircle, Search } from 'lucide-react';
import { toErrorMessage } from '@/lib/api/error';

interface RateEstimate {
  origin: string;
  destination: string;
  cargoType: string;
  avgPricePerKm: number;
  minPricePerKm: number;
  maxPricePerKm: number;
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidence: 'high' | 'medium' | 'low';
  basedOn: number;
  currency: string;
}

interface MarketData {
  trend: string;
  trendPercent: number;
  avgLoadsPerWeek: number;
  avgTrucksAvailable: number;
  lastUpdated: string;
}

export function RateEstimator() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoType, setCargoType] = useState('general');
  const [weight, setWeight] = useState('');
  const [currency, setCurrency] = useState('CDF');
  const [estimate, setEstimate] = useState<RateEstimate | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const cities = ['Lubumbashi', 'Kolwezi', 'Likasi', 'Kipushi', 'Kasumbalesa', 'Fungurume', 'Kambove'];

  const cargoTypes = [
    { value: 'general', label: 'Général' },
    { value: 'minerais', label: 'Minerais' },
    { value: 'ciment', label: 'Ciment' },
    { value: 'carburant', label: 'Carburant' },
    { value: 'marchandises', label: 'Marchandises' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'equipements', label: 'Équipements' },
    { value: 'conteneur', label: 'Conteneur' },
  ];

  const fetchEstimate = async () => {
    if (!origin || !destination) {
      setError('Sélectionnez une origine et une destination');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        origin, destination, cargoType, currency,
        ...(weight ? { weight } : {}),
      });
      const response = await fetch(`/api/rates?${params}`);
      const data = await response.json();

      if (response.ok) {
        setEstimate(data.estimate);
        setMarket(data.market);
      } else {
        setError(toErrorMessage(data.error, 'Erreur lors de l\'estimation'));
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const confidenceColors = {
    high: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-700',
  };

  const confidenceLabels = {
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Faible',
  };

  return (
    <div className="space-y-6">
      {/* Formulaire */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          Estimation de tarif
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origine</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            >
              <option value="">Sélectionner...</option>
              {cities.map((c) => (
                <option key={c} value={c.toLowerCase()}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="">Sélectionner...</option>
              {cities.filter((c) => c.toLowerCase() !== origin).map((c) => (
                <option key={c} value={c.toLowerCase()}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de cargo</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={cargoType}
              onChange={(e) => setCargoType(e.target.value)}
            >
              {cargoTypes.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Optionnel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <div className="flex gap-2">
              {['CDF', 'USD'].map((c) => (
                <button
                  key={c}
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
          Estimer le tarif
        </Button>
      </div>

      {/* Résultats */}
      {estimate && (
        <div className="space-y-4">
          {/* Prix estimé */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
            <div className="text-sm opacity-80 mb-1">Prix estimé</div>
            <div className="text-4xl font-extrabold">
              {estimate.estimatedPrice.toLocaleString()} {estimate.currency}
            </div>
            <div className="text-sm opacity-80 mt-1">
              Fourchette: {estimate.priceRange.min.toLocaleString()} - {estimate.priceRange.max.toLocaleString()} {estimate.currency}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                estimate.confidence === 'high' ? 'bg-white/20' : estimate.confidence === 'medium' ? 'bg-amber-400/30' : 'bg-red-400/30'
              }`}>
                Confiance: {confidenceLabels[estimate.confidence]}
              </span>
              <span className="text-xs opacity-70">
                Basé sur {estimate.basedOn} chargement{estimate.basedOn !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center">
              <DollarSign className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
              <div className="text-lg font-bold text-gray-900">{estimate.avgPricePerKm.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{estimate.currency}/km (moy.)</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Min / Max par km</div>
              <div className="text-lg font-bold text-gray-900">
                {estimate.minPricePerKm.toLocaleString()} - {estimate.maxPricePerKm.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">{estimate.currency}/km</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Confiance</div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${confidenceColors[estimate.confidence]}`}>
                {confidenceLabels[estimate.confidence]}
              </span>
            </div>
          </div>

          {/* Tendance marché */}
          {market && (
            <div className="bg-white rounded-xl border p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Tendance du marché</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {market.trend === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-red-500" />
                  ) : market.trend === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <div className={`text-sm font-bold ${
                      market.trend === 'up' ? 'text-red-600' : market.trend === 'down' ? 'text-emerald-600' : 'text-gray-600'
                    }`}>
                      {market.trend === 'up' ? '+' : market.trend === 'down' ? '-' : ''}{market.trendPercent}%
                    </div>
                    <div className="text-xs text-gray-500">30 derniers jours</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">{market.avgLoadsPerWeek}</div>
                  <div className="text-xs text-gray-500">Chargements/sem.</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">{market.avgTrucksAvailable}</div>
                  <div className="text-xs text-gray-500">Camions dispo.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
