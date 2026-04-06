'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import type { PODData, PODItem } from '@/components/documents/PODPrint';

// Lazy load jsPDF functions - only loaded when user clicks download/print
const lazyPOD = () => import('@/components/documents/PODPrint');
const downloadPODPDF = async (data: PODData) => (await lazyPOD()).downloadPODPDF(data);
const printPODPDF = async (data: PODData) => (await lazyPOD()).printPODPDF(data);
import {
  FileSignature, User, Phone, Package, Truck, Clock,
  Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle,
  Info, CheckCircle2, Eye, Download, Printer, Search,
  MapPin, DollarSign, Calendar, Shield, Loader2,
} from 'lucide-react';

const CONDITION_OPTIONS = [
  { value: 'good', label: 'Bon etat', emoji: '✅', desc: 'Marchandise intacte', ring: 'ring-emerald-500/20 border-emerald-500 bg-emerald-50', text: 'text-emerald-700' },
  { value: 'damaged', label: 'Endommage', emoji: '❌', desc: 'Degats constates', ring: 'ring-red-500/20 border-red-500 bg-red-50', text: 'text-red-700' },
  { value: 'partial', label: 'Partiel', emoji: '⚠️', desc: 'Livraison incomplete', ring: 'ring-amber-500/20 border-amber-500 bg-amber-50', text: 'text-amber-700' },
];

/** Pour champs <input type="datetime-local" /> */
function toDatetimeLocalInput(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PODPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);
  const supabase = useMemo(() => createClient(), []);

  const [loads, setLoads] = useState<any[]>([]);
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [isLoadingLoads, setIsLoadingLoads] = useState(true);
  const [loadsError, setLoadsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  /** Panneau détails transport ouvert par défaut ; tout est facultatif sauf le récepteur (étape 2). */
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [freeMode, setFreeMode] = useState(false); // POD sans chargement lie

  // Le formulaire s'affiche si un load est selectionne OU si mode libre
  const formVisible = !!selectedLoadId || freeMode;

  // Formulaire POD
  const [form, setForm] = useState({
    receiverName: '',
    receiverPhone: '',
    condition: 'good' as 'good' | 'damaged' | 'partial',
    conditionNotes: '',
    notes: '',
    driverName: '',
    truckNumber: '',
    /** Identification transport (PDF : N° Licence, Immatric., Permis) */
    licenseNumber: '',
    mcNumber: '',
    driverLicense: '',
    shipperTimeIn: '',
    shipperTimeOut: '',
    receiverTimeIn: '',
    receiverTimeOut: '',
    /** Saisie manuelle ramassage / livraison (datetime-local), sinon valeurs du chargement */
    pickupDateOverride: '',
    deliveryDateOverride: '',
    freightCharges: '',
    // Champs mode libre
    shipperName: '',
    originCity: '',
    originProvince: '',
    destCity: '',
    destProvince: '',
    weight: '',
    items: [{ description: '', quantity: 1, weight: 0, grossWeight: 0, specialMarks: '' }] as PODItem[],
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadEligibleLoads = useCallback(async () => {
    try {
      setLoadsError(null);
      const { data } = await supabase
        .from('loads')
        .select(`
          id,
          origin,
          destination,
          cargo_type,
          status,
          created_at,
          pickup_date,
          delivery_date,
          weight,
          price,
          workflow_step_data,
          broker:brokers(name, phone, address)
        `)
        .in('status', ['in-transit', 'delivered', 'completed', 'booked'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setLoads(data);
    } catch (error) {
      console.error('Erreur chargement loads:', error);
      setLoadsError('Impossible de charger les chargements. Verifiez la connexion puis reessayez.');
    } finally {
      setIsLoadingLoads(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadEligibleLoads();
  }, [loadEligibleLoads]);

  useEffect(() => {
    if (selectedLoadId) {
      const load = loads.find(l => l.id === selectedLoadId);
      setSelectedLoad(load || null);
      const updates: Partial<typeof form> = {};
      if (load?.price) updates.freightCharges = String(load.price);
      if (load?.pickup_date) updates.pickupDateOverride = toDatetimeLocalInput(load.pickup_date);
      if (load?.delivery_date) updates.deliveryDateOverride = toDatetimeLocalInput(load.delivery_date);
      // Pré-remplir depuis les données saisies aux étapes du workflow (ex: Livré)
      const stepData = load?.workflow_step_data as Record<string, { receiverName?: string; receiverPhone?: string; deliveryTime?: string; pickupTime?: string }> | undefined;
      const delivered = stepData?.delivered;
      if (delivered?.receiverName) updates.receiverName = delivered.receiverName;
      if (delivered?.receiverPhone) updates.receiverPhone = delivered.receiverPhone;
      if (delivered?.deliveryTime) updates.receiverTimeIn = delivered.deliveryTime;
      if (Object.keys(updates).length > 0) {
        setForm(prev => ({ ...prev, ...updates }));
      }
    } else {
      setSelectedLoad(null);
    }
  }, [selectedLoadId, loads]);

  const parseLocation = (loc: any) => {
    if (!loc) return { city: '', province: '', address: '' };
    if (typeof loc === 'string') { try { return JSON.parse(loc); } catch { return { city: '', province: '' }; } }
    return loc;
  };

  // ── Signature ──
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // ── Form helpers ──
  const updateForm = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const updateItem = (index: number, field: string, value: any) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, weight: 0, grossWeight: 0, specialMarks: '' }] }));

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  // ── Build POD data ──
  const buildPODData = (): PODData => {
    const origin = selectedLoad ? parseLocation(selectedLoad.origin) : { city: form.originCity, province: form.originProvince };
    const dest = selectedLoad ? parseLocation(selectedLoad.destination) : { city: form.destCity, province: form.destProvince };
    const signature = canvasRef.current ? canvasRef.current.toDataURL('image/png') : undefined;
    const controlNum = selectedLoadId ? selectedLoadId.substring(0, 8).toUpperCase() : `POD-${Date.now().toString(36).toUpperCase().substring(0, 6)}`;

    const safeIso = (local: string, fallback: string | undefined) => {
      if (!local?.trim()) return fallback;
      const d = new Date(local);
      return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
    };
    const pickupIso = safeIso(form.pickupDateOverride, selectedLoad?.pickup_date);
    const deliveryIso = safeIso(form.deliveryDateOverride, selectedLoad?.delivery_date || new Date().toISOString());

    return {
      loadId: selectedLoadId || undefined,
      controlNumber: controlNum,
      invoiceNumber: selectedLoadId ? `INV-${selectedLoadId.substring(0, 6).toUpperCase()}` : '',
      companyName: selectedLoad?.broker?.name || form.shipperName || 'NZELA TRANSPORT',
      companyPhone: selectedLoad?.broker?.phone || '',
      companyAddress: selectedLoad?.broker?.address || '',
      companyCity: origin.city,
      companyProvince: origin.province,
      licenseNumber: form.licenseNumber || undefined,
      mcNumber: form.mcNumber || undefined,
      driverLicense: form.driverLicense || undefined,
      driverName: form.driverName,
      truckNumber: form.truckNumber,
      pickupDate: pickupIso,
      deliveryDate: deliveryIso,
      shipperTimeIn: form.shipperTimeIn,
      shipperTimeOut: form.shipperTimeOut,
      receiverTimeIn: form.receiverTimeIn,
      receiverTimeOut: form.receiverTimeOut,
      shipperName: selectedLoad?.broker?.name || form.shipperName || '',
      shipperCity: origin.city,
      shipperProvince: origin.province,
      consigneeName: form.receiverName,
      consigneeCity: dest.city,
      consigneeProvince: dest.province,
      consigneePhone: form.receiverPhone,
      referenceNumber: selectedLoadId?.substring(0, 12) || '',
      items: form.items.filter(i => i.description),
      totalWeight: selectedLoad?.weight || (form.weight ? Number(form.weight) : form.items.reduce((s, i) => s + (i.weight || 0), 0)),
      receiverName: form.receiverName,
      condition: form.condition,
      conditionNotes: form.conditionNotes,
      notes: form.notes,
      freightCharges: form.freightCharges ? Number(form.freightCharges) : selectedLoad?.price,
      paymentTerms: 'Prepaye',
      receiverSignature: signature,
    };
  };

  // ── Submit POD ──
  const submitPOD = async () => {
    if (!form.receiverName.trim()) return;
    // En mode libre, pas besoin de selectedLoadId
    if (!freeMode && !selectedLoadId) return;
    setIsSubmitting(true);

    try {
      const signature = canvasRef.current ? canvasRef.current.toDataURL('image/png') : '';

      // Si on a un loadId, on enregistre en base
      if (selectedLoadId) {
        await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loadId: selectedLoadId,
            type: 'pod',
            receiverName: form.receiverName,
            signature,
            notes: form.notes,
            condition: form.condition,
            conditionNotes: form.conditionNotes,
            metadata: {
              driverName: form.driverName,
              truckNumber: form.truckNumber,
              licenseNumber: form.licenseNumber,
              mcNumber: form.mcNumber,
              driverLicense: form.driverLicense,
              pickupDateOverride: form.pickupDateOverride,
              deliveryDateOverride: form.deliveryDateOverride,
              receiverPhone: form.receiverPhone,
              items: form.items,
              freightCharges: form.freightCharges,
            },
          }),
        });
      }

      // Dans tous les cas, generer et telecharger le PDF
      const podData = buildPODData();
      podData.receiverSignature = signature;
      downloadPODPDF(podData);
      setSubmitted(true);
    } catch (error) {
      console.error('Erreur soumission POD:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setSelectedLoadId('');
    setSelectedLoad(null);
    setFreeMode(false);
    setShowAdvanced(true);
    setForm({
      receiverName: '', receiverPhone: '', condition: 'good', conditionNotes: '', notes: '',
      driverName: '', truckNumber: '', licenseNumber: '', mcNumber: '', driverLicense: '',
      shipperTimeIn: '', shipperTimeOut: '', receiverTimeIn: '', receiverTimeOut: '',
      pickupDateOverride: '', deliveryDateOverride: '', freightCharges: '',
      shipperName: '', originCity: '', originProvince: '', destCity: '', destProvince: '', weight: '',
      items: [{ description: '', quantity: 1, weight: 0, grossWeight: 0, specialMarks: '' }],
    });
    clearSignature();
  };

  // ── Input classes ──
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all bg-white';

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Ecran de succes ──
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">POD soumis avec succes !</h2>
        <p className="text-gray-500 mb-6">La preuve de livraison a ete enregistree et le PDF a ete telecharge.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { const data = buildPODData(); printPODPDF(data); }}>
            <Printer className="w-4 h-4 mr-2" /> Imprimer
          </Button>
          <Button variant="outline" onClick={() => { const data = buildPODData(); downloadPODPDF(data); }}>
            <Download className="w-4 h-4 mr-2" /> Re-telecharger
          </Button>
          <Button onClick={resetForm}>
            <Plus className="w-4 h-4 mr-2" /> Nouveau POD
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <FileSignature className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Preuve de Livraison (POD)</h1>
            <p className="text-sm text-gray-500">Proof of Delivery - Bordereau de reception</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span className="text-[11px] font-medium text-emerald-700">Document officiel</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════ */}
      {/* ETAPE 1 : CHOISIR LE CHARGEMENT OU MODE LIBRE */}
      {/* ══════════════════════════════════════ */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
            {freeMode ? 'Mode libre — POD sans chargement' : 'Selectionner le chargement'}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Choix : load existant OU mode libre */}
          {!freeMode ? (
            <>
              {isLoadingLoads ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                </div>
              ) : (
                <>
                  {loadsError && (
                    <div className="border border-amber-200 bg-amber-50 text-amber-800 text-sm rounded-lg px-3 py-2">
                      {loadsError}
                    </div>
                  )}
                  <select
                    value={selectedLoadId}
                    onChange={(e) => setSelectedLoadId(e.target.value)}
                    className={`${inputCls} text-base`}
                  >
                    <option value="">-- Choisir un chargement --</option>
                    {loads.map(load => {
                      const o = parseLocation(load.origin);
                      const d = parseLocation(load.destination);
                      return (
                        <option key={load.id} value={load.id}>
                          {o.city} → {d.city} | {load.cargo_type || 'Chargement'} | {load.weight ? `${load.weight}kg` : ''} | {load.status}
                        </option>
                      );
                    })}
                  </select>

                  {/* Separateur OU */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-xs font-bold text-gray-400 uppercase">ou</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>

                  {/* Bouton mode libre */}
                  <button
                    type="button"
                    onClick={() => {
                      setFreeMode(true);
                      setForm((p) => ({
                        ...p,
                        deliveryDateOverride: p.deliveryDateOverride || toDatetimeLocalInput(new Date().toISOString()),
                      }));
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl text-emerald-700 font-semibold text-sm transition-all hover:border-emerald-400"
                  >
                    <Plus className="w-4 h-4" />
                    Creer un POD libre (sans chargement lie)
                  </button>
                </>
              )}

              {/* Infos du load selectionne */}
              {selectedLoad && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: MapPin, label: 'Origine', value: parseLocation(selectedLoad.origin).city || '—' },
                    { icon: MapPin, label: 'Destination', value: parseLocation(selectedLoad.destination).city || '—' },
                    { icon: Package, label: 'Poids', value: selectedLoad.weight ? `${selectedLoad.weight.toLocaleString()} kg` : '—' },
                    { icon: DollarSign, label: 'Prix', value: selectedLoad.price ? `${selectedLoad.price.toLocaleString()} CDF` : '—' },
                  ].map(info => (
                    <div key={info.label} className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                      <info.icon className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase font-bold">{info.label}</div>
                        <div className="text-xs font-semibold text-gray-800">{info.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Mode libre : champs manuels */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Mode libre active — Remplissez les informations manuellement
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom expediteur *</label>
                  <input value={form.shipperName} onChange={e => setForm(p => ({ ...p, shipperName: e.target.value }))} className={inputCls} placeholder="Nom de l'entreprise expeditrice" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Poids total (kg)</label>
                  <input type="number" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} className={inputCls} placeholder="Ex: 25000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ville d&apos;origine *</label>
                  <input value={form.originCity} onChange={e => setForm(p => ({ ...p, originCity: e.target.value }))} className={inputCls} placeholder="Ex: Lubumbashi" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Province d&apos;origine</label>
                  <input value={form.originProvince} onChange={e => setForm(p => ({ ...p, originProvince: e.target.value }))} className={inputCls} placeholder="Ex: Haut-Katanga" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ville de destination *</label>
                  <input value={form.destCity} onChange={e => setForm(p => ({ ...p, destCity: e.target.value }))} className={inputCls} placeholder="Ex: Kinshasa" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Province de destination</label>
                  <input value={form.destProvince} onChange={e => setForm(p => ({ ...p, destProvince: e.target.value }))} className={inputCls} placeholder="Ex: Kinshasa" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setFreeMode(false); setForm(p => ({ ...p, shipperName: '', originCity: '', originProvince: '', destCity: '', destProvince: '', weight: '' })); }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                ← Revenir a la selection d&apos;un chargement
              </button>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════ */}
      {/* ETAPE 2 : DESTINATAIRE */}
      {/* ══════════════════════════════════════ */}
      {formVisible && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
              Destinataire / Recepteur
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <User className="w-3 h-3 text-gray-400" /> Nom complet du recepteur *
              </label>
              <input className={inputCls} value={form.receiverName} onChange={(e) => updateForm('receiverName', e.target.value)} placeholder="Nom complet..." />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <Phone className="w-3 h-3 text-gray-400" /> Telephone
              </label>
              <input type="tel" className={inputCls} value={form.receiverPhone} onChange={(e) => updateForm('receiverPhone', e.target.value)} placeholder="+243 ..." />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ETAPE 3 : ETAT MARCHANDISE */}
      {/* ══════════════════════════════════════ */}
      {formVisible && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
              Etat de la marchandise
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateForm('condition', opt.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.condition === opt.value ? `${opt.ring} ring-2` : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-1">{opt.emoji}</div>
                  <div className={`text-xs font-bold ${form.condition === opt.value ? opt.text : 'text-gray-700'}`}>{opt.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {form.condition !== 'good' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Details des dommages / manquants *
                </div>
                <textarea
                  className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none bg-white"
                  value={form.conditionNotes}
                  onChange={(e) => updateForm('conditionNotes', e.target.value)}
                  rows={3}
                  placeholder="Decrire les dommages ou articles manquants..."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ETAPE 4 : ARTICLES */}
      {/* ══════════════════════════════════════ */}
      {formVisible && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">4</span>
              Articles / Marchandises
            </h2>
            <button onClick={addItem} className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">
              <Plus className="w-3.5 h-3.5" /> Ajouter ligne
            </button>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-2.5 text-[10px] font-bold text-gray-500 uppercase">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantite</div>
                <div className="col-span-2">Poids (kg)</div>
                <div className="col-span-2">Marques</div>
                <div className="col-span-1"></div>
              </div>

              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2.5">
                  <div className="col-span-12 sm:col-span-5">
                    <input className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/40 outline-none" value={item.description || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description..." />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input type="number" className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/40 outline-none" value={item.quantity || ''} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} placeholder="1" />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input type="number" className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/40 outline-none" value={item.weight || ''} onChange={(e) => updateItem(idx, 'weight', Number(e.target.value))} placeholder="kg" />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <input className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/40 outline-none" value={item.specialMarks || ''} onChange={(e) => updateItem(idx, 'specialMarks', e.target.value)} placeholder="RAS" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {form.items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ETAPE 5 : AVANCE (toggle) */}
      {/* ══════════════════════════════════════ */}
      {formVisible && (
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl py-3 px-4 transition-colors shadow-sm"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showAdvanced ? 'Masquer les détails transport (facultatif)' : 'Afficher les détails transport (facultatif)'}
        </button>
      )}

      {formVisible && showAdvanced && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-5 py-3 border-b">
            <h2 className="text-sm font-bold text-blue-800 flex items-center gap-2">
              <Info className="w-4 h-4" /> Identification, dates &amp; heures <span className="font-normal text-blue-600">(facultatif)</span>
            </h2>
            <p className="text-[11px] text-blue-700/80 mt-1">
              Rien d&apos;obligatoire ici : les dates viennent du chargement quand elles existent. Complétez seulement si vous devez corriger ou ajouter licence, permis, heures d&apos;entrée/sortie — le PDF utilise ce qui est disponible.
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Identification transport</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5"><User className="w-3 h-3" /> Nom du chauffeur</label>
                  <input className={inputCls} value={form.driverName} onChange={(e) => updateForm('driverName', e.target.value)} placeholder="Jean Mukendi..." />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5"><Truck className="w-3 h-3" /> N° Camion / Plaque</label>
                  <input className={inputCls} value={form.truckNumber} onChange={(e) => updateForm('truckNumber', e.target.value)} placeholder="KN-1234-AB" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5">N° Licence (transport)</label>
                  <input className={inputCls} value={form.licenseNumber} onChange={(e) => updateForm('licenseNumber', e.target.value)} placeholder="Ex. licence exploitant" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5">N° Immatriculation</label>
                  <input className={inputCls} value={form.mcNumber} onChange={(e) => updateForm('mcNumber', e.target.value)} placeholder="Immat. véhicule / remorque" />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-semibold text-gray-600 mb-1.5">Permis chauffeur N°</label>
                  <input className={inputCls} value={form.driverLicense} onChange={(e) => updateForm('driverLicense', e.target.value)} placeholder="N° permis de conduire" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Dates &amp; heures</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5"><Calendar className="w-3 h-3" /> Ramassage</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={form.pickupDateOverride}
                    onChange={(e) => updateForm('pickupDateOverride', e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Optionnel : prérempli depuis le chargement — modifiez seulement si nécessaire.</p>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5"><Calendar className="w-3 h-3" /> Livraison</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={form.deliveryDateOverride}
                    onChange={(e) => updateForm('deliveryDateOverride', e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Optionnel : date du chargement ou maintenant (mode libre) — ajustez si besoin.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Exp. Entrée</label>
                  <input type="time" className={inputCls} value={form.shipperTimeIn} onChange={(e) => updateForm('shipperTimeIn', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Exp. Sortie</label>
                  <input type="time" className={inputCls} value={form.shipperTimeOut} onChange={(e) => updateForm('shipperTimeOut', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Dest. Entrée</label>
                  <input type="time" className={inputCls} value={form.receiverTimeIn} onChange={(e) => updateForm('receiverTimeIn', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Dest. Sortie</label>
                  <input type="time" className={inputCls} value={form.receiverTimeOut} onChange={(e) => updateForm('receiverTimeOut', e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5"><DollarSign className="w-3 h-3" /> Frais de transport (CDF)</label>
              <input type="number" className={inputCls} value={form.freightCharges} onChange={(e) => updateForm('freightCharges', e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ETAPE 6 : SIGNATURE */}
      {/* ══════════════════════════════════════ */}
      {formVisible && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">5</span>
              Signature du recepteur
            </h2>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-xs text-gray-500">Le destinataire doit signer ci-dessous pour confirmer la reception.</p>
            <div className="border-2 border-dashed border-emerald-300 rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={180}
                className="w-full cursor-crosshair touch-none"
                style={{ height: '150px' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <button onClick={clearSignature} className="text-xs text-gray-500 hover:text-red-500 font-medium">
              Effacer la signature
            </button>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5"><Info className="w-3 h-3" /> Notes</label>
              <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none text-sm" value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} rows={2} placeholder="Observations..." />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ACTIONS */}
      {/* ══════════════════════════════════════ */}
      {formVisible && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => { const data = buildPODData(); printPODPDF(data); }}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" /> Apercu PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => { const data = buildPODData(); downloadPODPDF(data); }}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" /> Telecharger PDF
            </Button>
            <Button
              onClick={submitPOD}
              disabled={!form.receiverName.trim() || isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Envoi en cours...' : 'Signer et soumettre le POD'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
