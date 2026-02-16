'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Bell, BellOff, Plus, Trash2, Search, RefreshCw, Zap, X, CheckCircle, MapPin } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';

const TRAILER_OPTS = [
  { value: 'flatbed', label: 'Plateau' },
  { value: 'van', label: 'Fourgon' },
  { value: 'reefer', label: 'Frigorifique' },
  { value: 'tanker', label: 'Citerne' },
  { value: 'container', label: 'Conteneur' },
  { value: 'benne', label: 'Benne' },
];

interface Alert {
  id: string;
  name: string;
  criteria: any;
  frequency: string;
  is_active: boolean;
  match_count: number;
  matches?: number;
  recentMatches?: any[];
  created_at: string;
}

export default function LoadAlertsPage() {
  const { isLoading: authLoading } = useRequireRole(['broker', 'company', 'admin']);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', originCity: '', destinationCity: '',
    trailerTypes: [] as string[],
    minPrice: '', maxPrice: '', minWeight: '', maxWeight: '',
    frequency: 'instant',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/alerts?check=true');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          criteria: {
            originCity: formData.originCity || null,
            destinationCity: formData.destinationCity || null,
            trailerTypes: formData.trailerTypes,
            minPrice: formData.minPrice ? Number(formData.minPrice) : null,
            maxPrice: formData.maxPrice ? Number(formData.maxPrice) : null,
            minWeight: formData.minWeight ? Number(formData.minWeight) : null,
            maxWeight: formData.maxWeight ? Number(formData.maxWeight) : null,
          },
          frequency: formData.frequency,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', originCity: '', destinationCity: '', trailerTypes: [], minPrice: '', maxPrice: '', minWeight: '', maxWeight: '', frequency: 'instant' });
        fetchAlerts();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const toggleAlert = async (id: string, active: boolean) => {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !active }),
    });
    fetchAlerts();
  };

  const deleteAlert = async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    fetchAlerts();
  };

  const toggleTrailer = (val: string) => {
    setFormData(prev => ({
      ...prev,
      trailerTypes: prev.trailerTypes.includes(val)
        ? prev.trailerTypes.filter(t => t !== val)
        : [...prev.trailerTypes, val],
    }));
  };

  if (authLoading) return <div className="flex justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-primary-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-600" />
            Alertes Personnalisees
          </h1>
          <p className="text-sm text-gray-500 mt-1">Recevez une notification quand un chargement correspond a vos criteres</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAlerts} className="p-2 border rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Nouvelle alerte</Button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Creer une alerte</h2>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;alerte *</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Lubumbashi vers Kolwezi - Plateau"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500/40 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville d&apos;origine</label>
              <input type="text" value={formData.originCity} onChange={e => setFormData({...formData, originCity: e.target.value})}
                placeholder="Lubumbashi, Likasi..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville de destination</label>
              <input type="text" value={formData.destinationCity} onChange={e => setFormData({...formData, destinationCity: e.target.value})}
                placeholder="Kolwezi, Fungurume..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Types de remorque</label>
            <div className="flex flex-wrap gap-2">
              {TRAILER_OPTS.map(t => (
                <button key={t.value} onClick={() => toggleTrailer(t.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    formData.trailerTypes.includes(t.value) ? 'bg-primary-50 text-primary-700 border-primary-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prix min (CDF)</label>
              <input type="number" value={formData.minPrice} onChange={e => setFormData({...formData, minPrice: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prix max (CDF)</label>
              <input type="number" value={formData.maxPrice} onChange={e => setFormData({...formData, maxPrice: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Poids min (kg)</label>
              <input type="number" value={formData.minWeight} onChange={e => setFormData({...formData, minWeight: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Poids max (kg)</label>
              <input type="number" value={formData.maxWeight} onChange={e => setFormData({...formData, maxWeight: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequence</label>
            <select value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}
              className="px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500/40 outline-none">
              <option value="instant">Instantane</option>
              <option value="hourly">Toutes les heures</option>
              <option value="daily">Quotidien</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={createAlert} isLoading={saving}>
              <Zap className="w-4 h-4 mr-1" /> Creer l&apos;alerte
            </Button>
          </div>
        </div>
      )}

      {/* Liste des alertes */}
      {isLoading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Aucune alerte configuree</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Creez votre premiere alerte pour etre notifie des que de nouveaux chargements correspondent a vos criteres.
          </p>
          <Button className="mt-4" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Creer une alerte</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`bg-white rounded-xl border p-5 transition-all ${alert.is_active ? 'border-primary-200' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{alert.name}</h3>
                    {alert.is_active && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">Actif</span>
                    )}
                    {(alert.matches ?? 0) > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-200 animate-pulse">
                        {alert.matches} correspondance{(alert.matches ?? 0) > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Criteres */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {alert.criteria?.originCity && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600">
                        <MapPin className="w-3 h-3" /> De: {alert.criteria.originCity}
                      </span>
                    )}
                    {alert.criteria?.destinationCity && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600">
                        <MapPin className="w-3 h-3" /> Vers: {alert.criteria.destinationCity}
                      </span>
                    )}
                    {alert.criteria?.trailerTypes?.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-blue-50 rounded text-[11px] text-blue-600 capitalize">{t}</span>
                    ))}
                    {alert.criteria?.minPrice && (
                      <span className="px-2 py-0.5 bg-green-50 rounded text-[11px] text-green-600">Min: {Number(alert.criteria.minPrice).toLocaleString()} CDF</span>
                    )}
                    {alert.criteria?.maxPrice && (
                      <span className="px-2 py-0.5 bg-green-50 rounded text-[11px] text-green-600">Max: {Number(alert.criteria.maxPrice).toLocaleString()} CDF</span>
                    )}
                  </div>

                  {/* Correspondances recentes */}
                  {alert.recentMatches && alert.recentMatches.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Correspondances recentes</p>
                      {alert.recentMatches.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs text-gray-600 bg-amber-50/50 px-2 py-1 rounded">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span className="font-medium">{m.origin_city} → {m.destination_city}</span>
                          <span className="text-gray-400">|</span>
                          <span className="font-semibold text-emerald-700">{Number(m.price).toLocaleString()} CDF</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <button onClick={() => toggleAlert(alert.id, alert.is_active)}
                    className={`p-2 rounded-lg transition-colors ${alert.is_active ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-green-50 text-green-600'}`}
                    title={alert.is_active ? 'Desactiver' : 'Activer'}>
                    {alert.is_active ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteAlert(alert.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
