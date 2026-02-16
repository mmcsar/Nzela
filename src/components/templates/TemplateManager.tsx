'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Copy, Plus, Play, Clock, RefreshCw, MapPin,
  Package, Repeat, Trash2, Star
} from 'lucide-react';

interface LoadTemplate {
  id: string;
  name: string;
  origin: any;
  destination: any;
  trailerType: string;
  weight: number;
  cargoType?: string;
  price?: number;
  notes?: string;
  usageCount: number;
  createdAt: string;
}

interface TemplateManagerProps {
  onUseTemplate?: (load: any) => void;
}

export function TemplateManager({ onUseTemplate }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<LoadTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUsing, setIsUsing] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [originCity, setOriginCity] = useState('Lubumbashi');
  const [destCity, setDestCity] = useState('Kolwezi');
  const [trailerType, setTrailerType] = useState('flatbed');
  const [weight, setWeight] = useState('');
  const [cargoType, setCargoType] = useState('general');
  const [price, setPrice] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('weekly');

  const cities = ['Lubumbashi', 'Kolwezi', 'Likasi', 'Kipushi', 'Kasumbalesa', 'Fungurume', 'Kambove'];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!name) return;
    setIsCreating(true);

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          origin: { city: originCity, province: 'haut-katanga', address: '' },
          destination: { city: destCity, province: 'lualaba', address: '' },
          trailerType,
          weight: parseInt(weight) || 0,
          cargoType,
          price: parseInt(price) || 0,
          recurring: isRecurring ? { frequency } : undefined,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        resetForm();
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const applyTemplate = async (templateId: string) => {
    setIsUsing(templateId);
    try {
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      const data = await response.json();
      if (response.ok && data.load) {
        onUseTemplate?.(data.load);
        fetchTemplates(); // Refresh pour mettre à jour le compteur
      }
    } catch (error) {
      console.error('Error using template:', error);
    } finally {
      setIsUsing(null);
    }
  };

  const resetForm = () => {
    setName('');
    setOriginCity('Lubumbashi');
    setDestCity('Kolwezi');
    setTrailerType('flatbed');
    setWeight('');
    setCargoType('general');
    setPrice('');
    setIsRecurring(false);
  };

  const getOriginCity = (origin: any) => {
    if (typeof origin === 'string') {
      try { return JSON.parse(origin).city || ''; } catch { return origin; }
    }
    return origin?.city || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Copy className="w-5 h-5 text-primary-600" />
          Modèles de chargement
        </h3>
        <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Nouveau modèle
        </Button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border-2 border-primary-200 p-5 space-y-4">
          <h4 className="font-medium text-gray-800">Créer un modèle</h4>
          <Input label="Nom du modèle" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Minerais Lushi → Kolwezi" required />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origine</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={originCity} onChange={(e) => setOriginCity(e.target.value)}>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={destCity} onChange={(e) => setDestCity(e.target.value)}>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type remorque</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={trailerType} onChange={(e) => setTrailerType(e.target.value)}>
                <option value="flatbed">Plateau</option>
                <option value="dry-van">Fourgon</option>
                <option value="tanker">Citerne</option>
                <option value="reefer">Réfrigéré</option>
              </select>
            </div>
            <Input label="Poids (kg)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Input label="Prix (CDF)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>

          {/* Récurrence */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="recurring" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Repeat className="w-4 h-4" />
              Chargement récurrent
            </label>
            {isRecurring && (
              <select className="ml-auto px-3 py-1.5 border rounded-lg text-sm" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="biweekly">Bi-hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }} className="flex-1">
              Annuler
            </Button>
            <Button onClick={createTemplate} isLoading={isCreating} className="flex-1">
              Créer le modèle
            </Button>
          </div>
        </div>
      )}

      {/* Liste des templates */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
          <Copy className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucun modèle créé</p>
          <p className="text-xs text-gray-400">Créez un modèle pour poster rapidement vos chargements habituels</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-xl border p-4 hover:border-primary-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{tpl.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {getOriginCity(tpl.origin)} → {getOriginCity(tpl.destination)}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Star className="w-3 h-3" />
                  {tpl.usageCount} utilisation{tpl.usageCount !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span className="px-2 py-0.5 bg-gray-100 rounded-full">{tpl.trailerType}</span>
                {tpl.weight > 0 && <span>{tpl.weight.toLocaleString()} kg</span>}
                {tpl.price && tpl.price > 0 && <span className="font-medium text-gray-700">{tpl.price.toLocaleString()} CDF</span>}
              </div>

              <Button
                size="sm"
                onClick={() => applyTemplate(tpl.id)}
                isLoading={isUsing === tpl.id}
                className="w-full"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Utiliser ce modèle
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
