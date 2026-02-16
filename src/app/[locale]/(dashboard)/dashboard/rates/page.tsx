'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw, Search, Route, DollarSign, Scale, Package } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RateData {
  month: string;
  label: string;
  avgPrice: number;
  avgPricePerKm: number;
  minPrice: number;
  maxPrice: number;
  loadCount: number;
  avgWeight: number;
  avgDistance: number;
}

interface TopRoute {
  route: string;
  avgPrice: number;
  count: number;
}

export default function RateHistoryPage() {
  const { isLoading: authLoading } = useRequireRole(['broker', 'company', 'admin']);
  const [rates, setRates] = useState<RateData[]>([]);
  const [topRoutes, setTopRoutes] = useState<TopRoute[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [months, setMonths] = useState(6);

  const fetchRates = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ months: months.toString() });
      if (origin) params.set('origin', origin);
      if (destination) params.set('destination', destination);

      const res = await fetch(`/api/rates?${params}`);
      const data = await res.json();
      setRates(data.rates || []);
      setTopRoutes(data.topRoutes || []);
      setSummary(data.summary || null);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [months, origin, destination]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  if (authLoading) return <div className="flex justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-primary-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            Historique des Tarifs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Analysez l&apos;evolution des prix de transport par route</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Origine</label>
            <input type="text" value={origin} onChange={e => setOrigin(e.target.value)}
              placeholder="Toutes origines" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Destination</label>
            <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
              placeholder="Toutes destinations" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Periode</label>
            <select value={months} onChange={e => setMonths(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500/40 outline-none">
              <option value={3}>3 mois</option>
              <option value={6}>6 mois</option>
              <option value={12}>12 mois</option>
            </select>
          </div>
          <Button onClick={fetchRates} isLoading={isLoading} size="sm">
            <Search className="w-4 h-4 mr-1" /> Analyser
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] text-gray-500 uppercase font-bold">Total loads</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{summary.totalLoads}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-gray-500 uppercase font-bold">Prix moyen</span>
            </div>
            <div className="text-2xl font-black text-emerald-700">{summary.avgPrice?.toLocaleString()} <span className="text-sm font-normal">CDF</span></div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Scale className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-gray-500 uppercase font-bold">Fourchette</span>
            </div>
            <div className="text-sm font-bold text-gray-700">{summary.minPrice?.toLocaleString()} - {summary.maxPrice?.toLocaleString()} <span className="text-xs font-normal">CDF</span></div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-1.5 mb-1">
              {summary.trend > 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
               summary.trend < 0 ? <TrendingDown className="w-4 h-4 text-red-500" /> :
               <Minus className="w-4 h-4 text-gray-400" />}
              <span className="text-[10px] text-gray-500 uppercase font-bold">Tendance</span>
            </div>
            <div className={`text-2xl font-black ${summary.trend > 0 ? 'text-emerald-700' : summary.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {summary.trend > 0 ? '+' : ''}{Math.round(summary.trend)}%
            </div>
          </div>
        </div>
      )}

      {/* Graphique prix moyen */}
      {rates.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-4">Evolution du prix moyen</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} CDF`} />
                <Legend />
                <Line type="monotone" dataKey="avgPrice" name="Prix moyen" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="minPrice" name="Prix min" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="maxPrice" name="Prix max" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Graphique volume */}
      {rates.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-4">Volume de chargements par mois</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="loadCount" name="Chargements" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top routes */}
      {topRoutes.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Route className="w-5 h-5 text-primary-600" />
            Routes les plus populaires
          </h2>
          <div className="space-y-2">
            {topRoutes.map((route, i) => (
              <div key={route.route} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 3 ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                }`}>{i + 1}</span>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-800">{route.route}</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">{route.avgPrice.toLocaleString()} CDF</span>
                <span className="text-xs text-gray-400">{route.count} load{route.count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Etat vide */}
      {!isLoading && rates.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Pas de donnees disponibles</h3>
          <p className="text-sm text-gray-500 mt-2">Les tarifs apparaitront ici a mesure que des chargements sont publies sur la plateforme.</p>
        </div>
      )}
    </div>
  );
}
