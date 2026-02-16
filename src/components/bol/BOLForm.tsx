'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { BOL, BOLItem, Load, Truck } from '@/types';
import { truckTypeFr } from '@/lib/utils/translate-fr';
import { Plus, Trash2, Save, X } from 'lucide-react';

const bolSchema = z.object({
  loadId: z.string().min(1, 'Le chargement est requis'),
  truckId: z.string().min(1, 'Le camion est requis'),
  // Expediteur
  shipperName: z.string().min(1, 'Nom expediteur requis'),
  shipperAddress: z.string().min(1, 'Adresse requise'),
  shipperCity: z.string().min(1, 'Ville requise'),
  shipperPhone: z.string().optional(),
  // Destinataire
  consigneeName: z.string().min(1, 'Nom destinataire requis'),
  consigneeAddress: z.string().min(1, 'Adresse requise'),
  consigneeCity: z.string().min(1, 'Ville requise'),
  consigneePhone: z.string().optional(),
  // Transporteur
  carrierName: z.string().min(1, 'Nom transporteur requis'),
  carrierScac: z.string().optional(),
  // Tiers payeur
  thirdPartyName: z.string().optional(),
  thirdPartyAddress: z.string().optional(),
  // Instructions
  specialInstructions: z.string().optional(),
  freightTerms: z.string().optional(),
  codAmount: z.string().optional(),
  feeTerms: z.string().optional(),
  // Articles
  items: z.array(z.object({
    customerOrderNo: z.string().optional(),
    description: z.string().min(1, 'Description requise'),
    quantity: z.number().min(1, 'Min 1'),
    packageType: z.string().optional(),
    weight: z.number().min(0),
    value: z.number().min(0),
    palletSlip: z.boolean().optional(),
    nmfcNo: z.string().optional(),
    freightClass: z.string().optional(),
    hazmat: z.boolean().optional(),
  })).min(1, 'Au moins un article requis'),
  // Dates
  pickupDate: z.string().min(1, 'Date requise'),
  deliveryDate: z.string().min(1, 'Date requise'),
  // Chargement
  trailerLoaded: z.string().optional(),
  freightCounted: z.string().optional(),
});

type BOLFormData = z.infer<typeof bolSchema>;

interface BOLFormProps {
  loadId?: string;
  truckId?: string;
  onSuccess?: (bol: BOL) => void;
}

export function BOLForm({ loadId, truckId, onSuccess }: BOLFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loads, setLoads] = useState<Load[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BOLFormData>({
    resolver: zodResolver(bolSchema),
    defaultValues: {
      loadId: loadId || '',
      truckId: truckId || '',
      shipperName: '', shipperAddress: '', shipperCity: '', shipperPhone: '',
      consigneeName: '', consigneeAddress: '', consigneeCity: '', consigneePhone: '',
      carrierName: '', carrierScac: '',
      thirdPartyName: '', thirdPartyAddress: '',
      specialInstructions: '', freightTerms: 'Prepaye', codAmount: '', feeTerms: '',
      items: [{ customerOrderNo: '', description: '', quantity: 1, packageType: 'Palette', weight: 0, value: 0, palletSlip: false, nmfcNo: '', freightClass: '70', hazmat: false }],
      pickupDate: '',
      deliveryDate: '',
      trailerLoaded: 'Par expediteur',
      freightCounted: 'Par expediteur',
    },
  });

  const items = watch('items') || [];

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('role, broker_id, company_id')
        .eq('id', user.id)
        .single();

      const isAdmin = userData?.role === 'admin';
      const isBroker = !!userData?.broker_id;

      // ── Charger les loads ──
      let loadsQuery = supabase
        .from('loads')
        .select('*')
        .in('status', ['available', 'booked'])
        .order('created_at', { ascending: false })
        .limit(100);

      // Si broker, filtrer par son broker_id; si admin, voir tout
      if (isBroker && !isAdmin) {
        loadsQuery = loadsQuery.eq('broker_id', userData.broker_id);
      }

      const { data: loadsData } = await loadsQuery;
      if (loadsData) setLoads(loadsData as Load[]);

      // ── Charger les camions ──
      let trucksQuery = supabase
        .from('trucks')
        .select('*, company:companies(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      // Si pas admin: disponibles + reserves (pour BOL, on peut assigner un truck deja reserve)
      if (!isAdmin) {
        trucksQuery = trucksQuery.in('status', ['available', 'booked']);
      }

      const { data: trucksData } = await trucksQuery;
      if (trucksData) setTrucks(trucksData as Truck[]);

      // ── Auto-remplir expediteur avec le broker ──
      if (isBroker && userData.broker_id) {
        const { data: broker } = await supabase
          .from('brokers')
          .select('*')
          .eq('id', userData.broker_id)
          .single();

        if (broker) {
          setValue('shipperName', broker.name);
          setValue('shipperAddress', broker.address);
          setValue('shipperCity', broker.city);
          setValue('shipperPhone', broker.phone);
        }
      }
    };
    loadData();
  }, [setValue, supabase]);

  useEffect(() => {
    if (loadId && loads.length > 0) {
      const load = loads.find((l) => l.id === loadId) as any;
      if (load) {
        const pickupRaw = load.pickupDate || load.pickup_date;
        const deliveryRaw = load.deliveryDate || load.delivery_date;
        if (pickupRaw) setValue('pickupDate', new Date(pickupRaw).toISOString().slice(0, 16));
        if (deliveryRaw) setValue('deliveryDate', new Date(deliveryRaw).toISOString().slice(0, 16));
        const dest = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;
        if (dest) {
          setValue('consigneeCity', dest.city || '');
          setValue('consigneeAddress', dest.address || '');
        }
      }
    }
  }, [loadId, loads, setValue]);

  const addItem = () => {
    setValue('items', [...items, { customerOrderNo: '', description: '', quantity: 1, packageType: 'Palette', weight: 0, value: 0, palletSlip: false, nmfcNo: '', freightClass: '70', hazmat: false }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setValue('items', items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setValue('items', updated);
  };

  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);

  const onSubmit = async (data: BOLFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecte');

      const load = loads.find((l) => l.id === data.loadId);
      const truck = trucks.find((t) => t.id === data.truckId);
      if (!load || !truck) throw new Error('Chargement ou camion introuvable');

      const bolNumber = `BOL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { data: bol, error: bolError } = await supabase
        .from('bols')
        .insert({
          bol_number: bolNumber,
          load_id: data.loadId,
          truck_id: data.truckId,
          shipper: {
            name: data.shipperName,
            address: data.shipperAddress,
            city: data.shipperCity,
            phone: data.shipperPhone,
            province: 'haut-katanga',
          },
          carrier: {
            name: data.carrierName,
            scac: data.carrierScac,
          },
          consignee: {
            name: data.consigneeName,
            address: data.consigneeAddress,
            city: data.consigneeCity,
            phone: data.consigneePhone,
          },
          origin: load.origin,
          destination: load.destination,
          items: data.items,
          total_weight: totalWeight,
          total_value: totalValue,
          pickup_date: data.pickupDate,
          delivery_date: data.deliveryDate,
          special_instructions: data.specialInstructions,
          status: 'draft',
        })
        .select()
        .single();

      if (bolError) throw bolError;

      if (onSuccess) {
        onSuccess(bol as BOL);
      } else {
        router.push(`/dashboard/broker/bol/${bol.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STYLE CLASSES ───
  const labelCls = 'block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-0.5';
  const inputCls = 'w-full px-2 py-1.5 text-sm border border-gray-300 bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none';
  const sectionTitle = 'bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 text-center';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* BORDEREAU DE CHARGEMENT - FORMULAIRE D'EXPEDITION */}
      {/* ════════════════════════════════════════════ */}
      <div className="border-2 border-gray-900 bg-white">

        {/* Titre */}
        <div className="bg-gray-900 text-white text-center py-3">
          <h1 className="text-xl font-black tracking-wide">BORDEREAU DE CHARGEMENT - FORMULAIRE D&apos;EXPEDITION</h1>
          <p className="text-[10px] text-gray-300 mt-0.5">BILL OF LADING - SHIPPING FORM | Republique Democratique du Congo</p>
        </div>

        {/* ── Selection Load / Truck ── */}
        <div className="grid grid-cols-2 border-b-2 border-gray-900">
          <div className="p-3 border-r border-gray-300">
            <label className={labelCls}>Chargement *</label>
            <select className={inputCls} {...register('loadId')} onChange={(e) => {
              setValue('loadId', e.target.value);
              const load = loads.find((l) => l.id === e.target.value) as any;
              if (load) {
                const pickupRaw = load.pickupDate || load.pickup_date;
                const deliveryRaw = load.deliveryDate || load.delivery_date;
                if (pickupRaw) setValue('pickupDate', new Date(pickupRaw).toISOString().slice(0, 16));
                if (deliveryRaw) setValue('deliveryDate', new Date(deliveryRaw).toISOString().slice(0, 16));
                const dest = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;
                if (dest) { setValue('consigneeCity', dest.city || ''); setValue('consigneeAddress', dest.address || ''); }
              }
            }}>
              <option value="">-- Selectionner --</option>
              {loads.map((load: any) => {
                const o = typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin;
                const d = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;
                const w = load.weight || 0;
                return <option key={load.id} value={load.id}>{o?.city || '?'} → {d?.city || '?'} ({w}T)</option>;
              })}
            </select>
            {errors.loadId && <p className="text-[10px] text-red-600 mt-0.5">{errors.loadId.message}</p>}
          </div>
          <div className="p-3">
            <label className={labelCls}>Camion / Vehicule *</label>
            <select
              className={inputCls}
              {...register('truckId', {
                onChange: (e) => {
                  const val = e.target.value;
                  setValue('truckId', val, { shouldValidate: true });
                  const truck = trucks.find((t) => t.id === val) as any;
                  if (truck?.company) setValue('carrierName', truck.company.name || '');
                },
              })}
            >
              <option value="">-- Selectionner --</option>
              {trucks.map((truck: any) => {
                const locRaw = truck.current_location ?? truck.currentLocation;
                const loc = typeof locRaw === 'string' ? (() => { try { return JSON.parse(locRaw); } catch { return {}; } })() : (locRaw || {});
                const cap = truck.capacity ?? truck.max_weight ?? 0;
                const typeRaw = truck.type ?? truck.trailer_type ?? '';
                const typeLabel = truckTypeFr(typeRaw) || 'Camion';
                const compName = truck.company?.name ? ` - ${truck.company.name}` : '';
                return (
                  <option key={truck.id} value={truck.id}>
                    {typeLabel} | {loc?.city ?? 'N/A'} ({cap} kg){compName}
                  </option>
                );
              })}
            </select>
            {trucks.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-1">Aucun camion disponible. Les entreprises doivent publier des camions sur le Truck Board.</p>
            )}
            {errors.truckId && <p className="text-[10px] text-red-600 mt-0.5">{errors.truckId.message}</p>}
          </div>
        </div>

        {/* ── EXPEDITEUR / N° BOL ── */}
        <div className="grid grid-cols-2 border-b border-gray-900">
          <div className="border-r border-gray-900">
            <div className={sectionTitle}>Expedier de (Expediteur)</div>
            <div className="p-3 space-y-2">
              <div>
                <label className={labelCls}>Nom / Societe</label>
                <input className={inputCls} {...register('shipperName')} />
              </div>
              <div>
                <label className={labelCls}>Adresse</label>
                <input className={inputCls} {...register('shipperAddress')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Ville</label>
                  <input className={inputCls} {...register('shipperCity')} />
                </div>
                <div>
                  <label className={labelCls}>Telephone</label>
                  <input className={inputCls} {...register('shipperPhone')} />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className={sectionTitle}>Numero du Bordereau</div>
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-2">Genere automatiquement a la creation</p>
              <div className="border-2 border-dashed border-gray-300 p-4 text-center text-gray-400 text-sm">
                ESPACE CODE-BARRES
              </div>
            </div>
          </div>
        </div>

        {/* ── DESTINATAIRE / TRANSPORTEUR ── */}
        <div className="grid grid-cols-2 border-b border-gray-900">
          <div className="border-r border-gray-900">
            <div className={sectionTitle}>*Expedier a (Destinataire)</div>
            <div className="p-3 space-y-2">
              <div>
                <label className={labelCls}>Nom / Societe</label>
                <input className={inputCls} {...register('consigneeName')} />
              </div>
              <div>
                <label className={labelCls}>Adresse</label>
                <input className={inputCls} {...register('consigneeAddress')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Ville</label>
                  <input className={inputCls} {...register('consigneeCity')} />
                </div>
                <div>
                  <label className={labelCls}>Telephone</label>
                  <input className={inputCls} {...register('consigneePhone')} />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className={sectionTitle}>Nom du Transporteur</div>
            <div className="p-3 space-y-2">
              <div>
                <label className={labelCls}>Transporteur</label>
                <input className={inputCls} {...register('carrierName')} />
              </div>
              <div>
                <label className={labelCls}>SCAC / Immatriculation</label>
                <input className={inputCls} {...register('carrierScac')} placeholder="Ex: RCCM-LUB-001" />
              </div>
            </div>
          </div>
        </div>

        {/* ── TIERS PAYEUR / SCAC ── */}
        <div className="grid grid-cols-2 border-b border-gray-900">
          <div className="border-r border-gray-900">
            <div className={sectionTitle}>Frais de transport a facturer a un tiers</div>
            <div className="p-3 grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Nom</label>
                <input className={inputCls} {...register('thirdPartyName')} />
              </div>
              <div>
                <label className={labelCls}>Adresse</label>
                <input className={inputCls} {...register('thirdPartyAddress')} />
              </div>
            </div>
          </div>
          <div>
            <div className={sectionTitle}>Conditions de fret</div>
            <div className="p-3 space-y-2">
              <div>
                <label className={labelCls}>Conditions</label>
                <select className={inputCls} {...register('freightTerms')}>
                  <option value="Prepaye">Prepaye</option>
                  <option value="A percevoir">A percevoir</option>
                  <option value="Tiers payeur">Tiers payeur</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── INSTRUCTIONS SPECIALES ── */}
        <div className="border-b border-gray-900 p-3">
          <label className={labelCls}>Instructions speciales :</label>
          <textarea className={`${inputCls} resize-none`} rows={2} {...register('specialInstructions')} placeholder="Ex: Marchandise fragile, maintenir au sec..." />
        </div>

        {/* ── INFORMATION COMMANDE CLIENT ── */}
        <div className={sectionTitle}>Information commande client</div>

        {/* Table Header */}
        <div className="grid grid-cols-12 border-b border-gray-900 text-[10px] font-bold uppercase bg-gray-100">
          <div className="col-span-2 px-2 py-1.5 border-r border-gray-300">N° Commande</div>
          <div className="col-span-4 px-2 py-1.5 border-r border-gray-300">Description marchandise</div>
          <div className="col-span-1 px-2 py-1.5 border-r border-gray-300 text-center">Nb Colis</div>
          <div className="col-span-1 px-2 py-1.5 border-r border-gray-300 text-center">Type</div>
          <div className="col-span-1 px-2 py-1.5 border-r border-gray-300 text-center">Poids (kg)</div>
          <div className="col-span-1 px-2 py-1.5 border-r border-gray-300 text-center">Palette</div>
          <div className="col-span-1 px-2 py-1.5 border-r border-gray-300 text-center">Classe</div>
          <div className="col-span-1 px-2 py-1.5 text-center">Action</div>
        </div>

        {/* Item Rows */}
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 border-b border-gray-300 text-sm">
            <div className="col-span-2 border-r border-gray-300">
              <input className="w-full px-2 py-1.5 text-xs outline-none" value={item.customerOrderNo || ''} onChange={(e) => updateItem(i, 'customerOrderNo', e.target.value)} placeholder="CMD-001" />
            </div>
            <div className="col-span-4 border-r border-gray-300">
              <input className="w-full px-2 py-1.5 text-xs outline-none" value={item.description || ''} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Description de la marchandise" />
            </div>
            <div className="col-span-1 border-r border-gray-300">
              <input className="w-full px-2 py-1.5 text-xs text-center outline-none" type="number" min={1} value={item.quantity || 1} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} />
            </div>
            <div className="col-span-1 border-r border-gray-300">
              <select className="w-full px-1 py-1.5 text-[10px] outline-none bg-transparent" value={item.packageType || 'Palette'} onChange={(e) => updateItem(i, 'packageType', e.target.value)}>
                <option>Palette</option>
                <option>Carton</option>
                <option>Sac</option>
                <option>Fut</option>
                <option>Vrac</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="col-span-1 border-r border-gray-300">
              <input className="w-full px-2 py-1.5 text-xs text-center outline-none" type="number" min={0} value={item.weight || 0} onChange={(e) => updateItem(i, 'weight', Number(e.target.value))} />
            </div>
            <div className="col-span-1 border-r border-gray-300 flex items-center justify-center">
              <input type="checkbox" className="w-4 h-4" checked={item.palletSlip || false} onChange={(e) => updateItem(i, 'palletSlip', e.target.checked)} />
            </div>
            <div className="col-span-1 border-r border-gray-300">
              <input className="w-full px-2 py-1.5 text-xs text-center outline-none" value={item.freightClass || '70'} onChange={(e) => updateItem(i, 'freightClass', e.target.value)} />
            </div>
            <div className="col-span-1 flex items-center justify-center">
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add + Grand Total */}
        <div className="border-b border-gray-900">
          <div className="flex items-center justify-between px-3 py-2">
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold">
              <Plus className="w-3.5 h-3.5" /> Ajouter un article
            </button>
            <div className="flex items-center gap-6 text-sm">
              <span className="font-bold">Total poids : <span className="text-primary-700">{totalWeight.toLocaleString()} kg</span></span>
              <span className="font-bold">Total valeur : <span className="text-primary-700">{totalValue.toLocaleString()} CDF</span></span>
            </div>
          </div>
        </div>

        {/* ── INFORMATION TRANSPORTEUR ── */}
        <div className={sectionTitle}>Information transporteur</div>

        <div className="grid grid-cols-2 border-b border-gray-900">
          <div className="border-r border-gray-900 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Montant contre remboursement (CDF)</label>
                <input className={inputCls} {...register('codAmount')} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>Modalites de paiement</label>
                <select className={inputCls} {...register('feeTerms')}>
                  <option value="">-- Selectionner --</option>
                  <option value="A percevoir">A percevoir</option>
                  <option value="Prepaye">Prepaye</option>
                  <option value="Cheque accepte">Cheque accepte</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date de ramassage *</label>
                <input type="datetime-local" className={inputCls} {...register('pickupDate')} />
                {errors.pickupDate && <p className="text-[10px] text-red-600">{errors.pickupDate.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Date de livraison *</label>
                <input type="datetime-local" className={inputCls} {...register('deliveryDate')} />
                {errors.deliveryDate && <p className="text-[10px] text-red-600">{errors.deliveryDate.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ── MENTIONS LEGALES ── */}
        <div className="border-b border-gray-900 px-3 py-2">
          <p className="text-[9px] text-gray-500 leading-tight">
            <strong>Note :</strong> La limitation de responsabilite pour perte ou dommage a cette expedition peut etre applicable. Voir 49 USC § 14706(c)(1)(A) et (B). Le transporteur ne fera pas la livraison de cette expedition sans paiement des frais de transport et de tous les autres frais legaux.
          </p>
        </div>

        {/* ── SIGNATURES ── */}
        <div className="grid grid-cols-2 border-b border-gray-900">
          <div className="border-r border-gray-900 p-3">
            <div className="flex items-center gap-4 mb-2">
              <label className={labelCls}>Remorque chargee par :</label>
              <label className="flex items-center gap-1 text-xs">
                <input type="radio" value="Par expediteur" {...register('trailerLoaded')} /> Expediteur
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="radio" value="Par chauffeur" {...register('trailerLoaded')} /> Chauffeur
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className={labelCls}>Fret compte par :</label>
              <label className="flex items-center gap-1 text-xs">
                <input type="radio" value="Par expediteur" {...register('freightCounted')} /> Expediteur
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="radio" value="Par chauffeur" {...register('freightCounted')} /> Chauffeur
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="radio" value="Par palettes" {...register('freightCounted')} /> Palettes
              </label>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Signature Expediteur / Date</label>
                <div className="border border-gray-300 h-12 mt-1 bg-gray-50"></div>
              </div>
              <div>
                <label className={labelCls}>Signature Transporteur / Date</label>
                <div className="border border-gray-300 h-12 mt-1 bg-gray-50"></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CERTIFICATION ── */}
        <div className="px-3 py-2">
          <p className="text-[9px] text-gray-500 leading-tight">
            Le soussigne certifie que les matieres ci-dessus designees sont correctement classifiees, emballees, marquees et etiquetees, et sont en bon etat pour le transport conformement aux reglementations applicables du Ministere des Transports de la RDC.
          </p>
        </div>
      </div>

      {/* ── BOUTONS ── */}
      <div className="flex gap-3 mt-6">
        <Button type="submit" isLoading={isLoading} className="flex-1 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Creer le Bordereau
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <X className="w-4 h-4" /> Annuler
        </Button>
      </div>
    </form>
  );
}
