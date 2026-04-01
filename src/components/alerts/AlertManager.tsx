'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Bell, Plus, Trash2, RefreshCw, MapPin, Package,
  BellRing, BellOff, Mail, Smartphone, Check
} from 'lucide-react';
import { CitySelectOptions } from '@/components/rates/CitySelectOptions';

interface LoadAlert {
  id: string;
  name: string;
  criteria: any;
  frequency: string;
  channels: string[];
  isActive: boolean;
  matchCount: number;
  matches?: number;
  recentMatches?: any[];
  createdAt: string;
}

interface AlertManagerProps {
  onAlertMatch?: (loadId: string) => void;
}

export function AlertManager({ onAlertMatch }: AlertManagerProps) {
  const [alerts, setAlerts] = useState<LoadAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destCity, setDestCity] = useState('');
  const [cargoTypes, setCargoTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [frequency, setFrequency] = useState('instant');
  const [channels, setChannels] = useState<string[]>(['push']);

  const allCargoTypes = ['minerais', 'ciment', 'carburant', 'marchandises', 'agriculture', 'equipements', 'conteneur'];

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts?check=true');
      const data = await response.json();
      if (response.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async () => {
    if (!name) return;
    setIsCreating(true);

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          criteria: {
            originCity: originCity || undefined,
            destinationCity: destCity || undefined,
            cargoTypes: cargoTypes.length > 0 ? cargoTypes : undefined,
            minPrice: minPrice ? parseInt(minPrice) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
          },
          frequency,
          channels,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        resetForm();
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts?id=${alertId}`, { method: 'DELETE' });
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const toggleCargoType = (type: string) => {
    setCargoTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const resetForm = () => {
    setName('');
    setOriginCity('');
    setDestCity('');
    setCargoTypes([]);
    setMinPrice('');
    setMaxPrice('');
    setFrequency('instant');
    setChannels(['push']);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BellRing className="w-5 h-5 text-primary-600" />
          Alertes chargement
        </h3>
        <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Créer une alerte
        </Button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border-2 border-primary-200 p-5 space-y-4">
          <h4 className="font-medium text-gray-800">Nouvelle alerte</h4>

          <Input
            label="Nom de l'alerte"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Minerais depuis Lubumbashi"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville d&apos;origine</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={originCity} onChange={(e) => setOriginCity(e.target.value)}>
                <option value="">Toutes</option>
                <CitySelectOptions valueMode="display" />
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville de destination</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={destCity} onChange={(e) => setDestCity(e.target.value)}>
                <option value="">Toutes</option>
                <CitySelectOptions valueMode="display" excludeSlug={originCity || undefined} />
              </select>
            </div>
          </div>

          {/* Types de cargo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Types de cargo</label>
            <div className="flex flex-wrap gap-2">
              {allCargoTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleCargoType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    cargoTypes.includes(type)
                      ? 'bg-primary-100 text-primary-700 border-primary-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix min (CDF)" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
            <Input label="Prix max (CDF)" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Illimité" />
          </div>

          {/* Fréquence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fréquence</label>
            <div className="flex gap-2">
              {[
                { value: 'instant', label: 'Instantané' },
                { value: 'hourly', label: 'Chaque heure' },
                { value: 'daily', label: 'Quotidien' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-colors ${
                    frequency === f.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canaux */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Canaux de notification</label>
            <div className="flex gap-3">
              {[
                { id: 'push', label: 'Push', icon: Bell },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'sms', label: 'SMS', icon: Smartphone },
              ].map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-colors ${
                    channels.includes(ch.id)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <ch.icon className="w-4 h-4" />
                  {ch.label}
                  {channels.includes(ch.id) && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }} className="flex-1">
              Annuler
            </Button>
            <Button onClick={createAlert} isLoading={isCreating} className="flex-1">
              Créer l&apos;alerte
            </Button>
          </div>
        </div>
      )}

      {/* Liste des alertes */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
          <BellOff className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucune alerte configurée</p>
          <p className="text-xs text-gray-400 mt-1">Recevez des notifications quand un chargement correspond à vos critères</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    {alert.isActive ? (
                      <BellRing className="w-4 h-4 text-primary-600" />
                    ) : (
                      <BellOff className="w-4 h-4 text-gray-400" />
                    )}
                    {alert.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    {alert.criteria.originCity && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        De: {alert.criteria.originCity}
                      </span>
                    )}
                    {alert.criteria.destinationCity && (
                      <span className="flex items-center gap-0.5">
                        → {alert.criteria.destinationCity}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {alert.criteria.cargoTypes?.map((type: string) => (
                  <span key={type} className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                    {type}
                  </span>
                ))}
                <span className="px-2 py-0.5 bg-blue-50 rounded-full text-[10px] text-blue-600 font-medium">
                  {alert.frequency === 'instant' ? 'Instantané' : alert.frequency === 'hourly' ? 'Chaque heure' : 'Quotidien'}
                </span>
              </div>

              {alert.matches !== undefined && alert.matches > 0 && (
                <div className="mt-2 px-3 py-1.5 bg-emerald-50 rounded-lg text-xs text-emerald-700 font-medium">
                  <Package className="w-3 h-3 inline mr-1" />
                  {alert.matches} chargement{alert.matches > 1 ? 's' : ''} correspondant{alert.matches > 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
