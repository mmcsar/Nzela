'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import {
  FileText, Upload, Download, Eye, Camera, FileSignature,
  File, Image, RefreshCw, Plus, Trash2, Printer, Truck,
  User, MapPin, Package, Clock, Phone, CheckCircle2,
  ChevronDown, ChevronUp, AlertTriangle, Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadPODPDF, printPODPDF, type PODData, type PODItem } from './PODPrint';

interface Document {
  id: string;
  loadId: string;
  type: string;
  name: string;
  mimeType?: string;
  size?: number;
  uploadedAt: string;
  status?: string;
  metadata?: any;
}

interface DocumentManagerProps {
  loadId: string;
  canUpload?: boolean;
}

const DOC_TYPE_ICONS: Record<string, any> = {
  bol: FileText,
  pod: FileSignature,
  invoice: File,
  photo: Image,
  insurance: FileText,
  permit: FileText,
  contract: FileText,
};

const DOC_TYPE_LABELS: Record<string, string> = {
  bol: 'Connaissement (BOL)',
  pod: 'Preuve de livraison (POD)',
  invoice: 'Facture',
  photo: 'Photo',
  insurance: 'Assurance',
  permit: 'Permis',
  contract: 'Contrat',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  bol: 'bg-blue-100 text-blue-600',
  pod: 'bg-emerald-100 text-emerald-600',
  invoice: 'bg-purple-100 text-purple-600',
  photo: 'bg-amber-100 text-amber-600',
  insurance: 'bg-gray-100 text-gray-600',
  permit: 'bg-red-100 text-red-600',
  contract: 'bg-indigo-100 text-indigo-600',
};

const CONDITION_OPTIONS = [
  { value: 'good', label: 'Bon etat', color: 'emerald', icon: '✓', desc: 'Marchandise intacte' },
  { value: 'damaged', label: 'Endommage', color: 'red', icon: '✗', desc: 'Degats constates' },
  { value: 'partial', label: 'Partiel', color: 'amber', icon: '~', desc: 'Livraison incomplete' },
];

export function DocumentManager({ loadId, canUpload = true }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPODForm, setShowPODForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadData, setLoadData] = useState<any>(null);

  // POD form fields
  const [podForm, setPodForm] = useState({
    receiverName: '',
    receiverPhone: '',
    condition: 'good' as 'good' | 'damaged' | 'partial',
    conditionNotes: '',
    notes: '',
    // Avance
    driverName: '',
    truckNumber: '',
    shipperTimeIn: '',
    shipperTimeOut: '',
    receiverTimeIn: '',
    receiverTimeOut: '',
    freightCharges: '',
    nbPieces: '',
    // Items
    items: [{ description: '', quantity: 1, weight: 0, grossWeight: 0, specialMarks: '' }] as PODItem[],
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents?loadId=${loadId}`);
      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadId]);

  const fetchLoadData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('loads')
        .select('*, broker:brokers(name, phone, address)')
        .eq('id', loadId)
        .single();
      if (data) setLoadData(data);
    } catch { /* ignore */ }
  }, [loadId, supabase]);

  useEffect(() => {
    fetchDocuments();
    fetchLoadData();
  }, [fetchDocuments, fetchLoadData]);

  // ── Signature pad ──
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
    ctx.lineWidth = 2;
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

  // ── Update form ──
  const updateForm = (field: string, value: any) => {
    setPodForm(prev => ({ ...prev, [field]: value }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setPodForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setPodForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, weight: 0, grossWeight: 0, specialMarks: '' }],
    }));
  };

  const removeItem = (index: number) => {
    if (podForm.items.length <= 1) return;
    setPodForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // ── Build POD data for PDF ──
  const buildPODData = (): PODData => {
    let origin = { city: '', province: '' };
    let dest = { city: '', province: '' };
    let brokerName = '';
    let brokerPhone = '';
    let brokerAddress = '';

    if (loadData) {
      try {
        origin = typeof loadData.origin === 'string' ? JSON.parse(loadData.origin) : (loadData.origin || {});
        dest = typeof loadData.destination === 'string' ? JSON.parse(loadData.destination) : (loadData.destination || {});
      } catch { /* */ }
      brokerName = loadData.broker?.name || '';
      brokerPhone = loadData.broker?.phone || '';
      brokerAddress = loadData.broker?.address || '';
    }

    return {
      loadId,
      controlNumber: loadId.substring(0, 8).toUpperCase(),
      invoiceNumber: `INV-${loadId.substring(0, 6).toUpperCase()}`,
      companyName: brokerName || 'NZELA TRANSPORT',
      companyPhone: brokerPhone,
      companyAddress: brokerAddress,
      companyCity: origin.city,
      companyProvince: origin.province,
      driverName: podForm.driverName,
      truckNumber: podForm.truckNumber,
      pickupDate: loadData?.pickup_date,
      deliveryDate: loadData?.delivery_date || new Date().toISOString(),
      shipperTimeIn: podForm.shipperTimeIn,
      shipperTimeOut: podForm.shipperTimeOut,
      receiverTimeIn: podForm.receiverTimeIn,
      receiverTimeOut: podForm.receiverTimeOut,
      shipperName: brokerName,
      shipperCity: origin.city,
      shipperProvince: origin.province,
      consigneeName: podForm.receiverName,
      consigneeCity: dest.city,
      consigneeProvince: dest.province,
      consigneePhone: podForm.receiverPhone,
      referenceNumber: loadData?.id?.substring(0, 12) || '',
      items: podForm.items.filter(i => i.description),
      totalWeight: loadData?.weight || podForm.items.reduce((s, i) => s + (i.weight || 0), 0),
      receiverName: podForm.receiverName,
      condition: podForm.condition,
      conditionNotes: podForm.conditionNotes,
      notes: podForm.notes,
      freightCharges: podForm.freightCharges ? Number(podForm.freightCharges) : loadData?.price,
      paymentTerms: 'Prepaye',
      receiverSignature: canvasRef.current ? canvasRef.current.toDataURL('image/png') : undefined,
    };
  };

  // ── Submit POD ──
  const submitPOD = async () => {
    if (!podForm.receiverName.trim()) return;
    setIsSubmitting(true);

    const canvas = canvasRef.current;
    const signature = canvas ? canvas.toDataURL('image/png') : '';

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadId,
          type: 'pod',
          receiverName: podForm.receiverName,
          signature,
          notes: podForm.notes,
          condition: podForm.condition,
          conditionNotes: podForm.conditionNotes,
          metadata: {
            driverName: podForm.driverName,
            truckNumber: podForm.truckNumber,
            receiverPhone: podForm.receiverPhone,
            items: podForm.items,
            freightCharges: podForm.freightCharges,
          },
        }),
      });

      if (response.ok) {
        // Telecharger le PDF automatiquement
        const podData = buildPODData();
        podData.receiverSignature = signature;
        downloadPODPDF(podData);

        // Reset
        setShowPODForm(false);
        setPodForm({
          receiverName: '', receiverPhone: '', condition: 'good', conditionNotes: '', notes: '',
          driverName: '', truckNumber: '', shipperTimeIn: '', shipperTimeOut: '',
          receiverTimeIn: '', receiverTimeOut: '', freightCharges: '', nbPieces: '',
          items: [{ description: '', quantity: 1, weight: 0, grossWeight: 0, specialMarks: '' }],
        });
        clearSignature();
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error submitting POD:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Quick download existing POD ──
  const downloadExistingPOD = (doc: Document) => {
    const podData = buildPODData();
    if (doc.metadata) {
      podData.receiverName = doc.metadata.receiverName || podData.receiverName;
      podData.condition = doc.metadata.condition || podData.condition;
      podData.notes = doc.metadata.notes || podData.notes;
    }
    downloadPODPDF(podData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  // ── Render form field helper ──
  const FormField = ({ label, icon: Icon, children, className = '' }: { label: string; icon?: any; children: React.ReactNode; className?: string }) => (
    <div className={className}>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
        {Icon && <Icon className="w-3 h-3 text-gray-400" />}
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all bg-white';

  return (
    <div className="space-y-4">
      {/* ── En-tete ── */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600" />
          Documents ({documents.length})
        </h3>
        {canUpload && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowPODForm(true)}>
              <FileSignature className="w-4 h-4 mr-1" />
              Creer POD
            </Button>
            {documents.some(d => d.type === 'pod') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { const podData = buildPODData(); downloadPODPDF(podData); }}
              >
                <Download className="w-4 h-4 mr-1" />
                Telecharger POD
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* FORMULAIRE POD PROFESSIONNEL */}
      {/* ══════════════════════════════════════════ */}
      {showPODForm && (
        <div className="bg-white rounded-xl border-2 border-emerald-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <FileSignature className="w-5 h-5" />
              <div>
                <h4 className="font-bold text-sm">Preuve de Livraison (POD)</h4>
                <p className="text-emerald-100 text-[10px]">Proof of Delivery - Bordereau de Reception</p>
              </div>
            </div>
            <div className="text-right text-white text-[10px]">
              <div className="font-mono font-bold">#{loadId.substring(0, 8).toUpperCase()}</div>
              <div>{new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* ── Section 1: Destinataire (obligatoire) ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <User className="w-4 h-4 text-emerald-600" />
                Destinataire / Recepteur *
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Nom complet du recepteur *" icon={User}>
                  <input
                    type="text"
                    className={inputCls}
                    value={podForm.receiverName}
                    onChange={(e) => updateForm('receiverName', e.target.value)}
                    placeholder="Nom complet de la personne qui recoit..."
                  />
                </FormField>

                <FormField label="Telephone recepteur" icon={Phone}>
                  <input
                    type="tel"
                    className={inputCls}
                    value={podForm.receiverPhone}
                    onChange={(e) => updateForm('receiverPhone', e.target.value)}
                    placeholder="+243 ..."
                  />
                </FormField>
              </div>
            </div>

            {/* ── Section 2: Etat de la marchandise ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Package className="w-4 h-4 text-emerald-600" />
                Etat de la marchandise *
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CONDITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateForm('condition', opt.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      podForm.condition === opt.value
                        ? opt.value === 'good'
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                          : opt.value === 'damaged'
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
                            : 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{opt.icon === '✓' ? '✅' : opt.icon === '✗' ? '❌' : '⚠️'}</div>
                    <div className={`text-xs font-bold ${
                      podForm.condition === opt.value
                        ? opt.value === 'good' ? 'text-emerald-700' : opt.value === 'damaged' ? 'text-red-700' : 'text-amber-700'
                        : 'text-gray-700'
                    }`}>
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {podForm.condition !== 'good' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Details des dommages / manquants *
                  </div>
                  <textarea
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none bg-white"
                    value={podForm.conditionNotes}
                    onChange={(e) => updateForm('conditionNotes', e.target.value)}
                    rows={2}
                    placeholder="Decrire les dommages ou articles manquants..."
                  />
                </div>
              )}
            </div>

            {/* ── Section 3: Articles / Marchandises ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Articles recus
                </div>
                <button onClick={addItem} className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {podForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-lg p-2.5">
                    <div className="col-span-5">
                      {idx === 0 && <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>}
                      <input
                        className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        value={item.description || ''}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Description..."
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <label className="text-[10px] font-bold text-gray-500 uppercase">Qte</label>}
                      <input
                        type="number"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <label className="text-[10px] font-bold text-gray-500 uppercase">Poids (kg)</label>}
                      <input
                        type="number"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        value={item.weight || ''}
                        onChange={(e) => updateItem(idx, 'weight', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <label className="text-[10px] font-bold text-gray-500 uppercase">Marques</label>}
                      <input
                        className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        value={item.specialMarks || ''}
                        onChange={(e) => updateItem(idx, 'specialMarks', e.target.value)}
                        placeholder="RAS"
                      />
                    </div>
                    <div className="col-span-1 flex items-end justify-center">
                      {idx === 0 && <label className="text-[10px] invisible">X</label>}
                      {podForm.items.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 4: Champs avances (toggle) ── */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors w-full py-2 border-t border-gray-100"
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showAdvanced ? 'Masquer les champs avances' : 'Afficher les champs avances (chauffeur, heures, frais...)'}
            </button>

            {showAdvanced && (
              <div className="space-y-4 bg-blue-50/30 rounded-lg p-4 border border-blue-100">
                {/* Chauffeur */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Nom du chauffeur" icon={User}>
                    <input className={inputCls} value={podForm.driverName} onChange={(e) => updateForm('driverName', e.target.value)} placeholder="Jean Mukendi..." />
                  </FormField>
                  <FormField label="N° Camion / Plaque" icon={Truck}>
                    <input className={inputCls} value={podForm.truckNumber} onChange={(e) => updateForm('truckNumber', e.target.value)} placeholder="KN-1234-AB" />
                  </FormField>
                </div>

                {/* Heures */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FormField label="Expediteur - Entree" icon={Clock}>
                    <input type="time" className={inputCls} value={podForm.shipperTimeIn} onChange={(e) => updateForm('shipperTimeIn', e.target.value)} />
                  </FormField>
                  <FormField label="Expediteur - Sortie" icon={Clock}>
                    <input type="time" className={inputCls} value={podForm.shipperTimeOut} onChange={(e) => updateForm('shipperTimeOut', e.target.value)} />
                  </FormField>
                  <FormField label="Destinataire - Entree" icon={Clock}>
                    <input type="time" className={inputCls} value={podForm.receiverTimeIn} onChange={(e) => updateForm('receiverTimeIn', e.target.value)} />
                  </FormField>
                  <FormField label="Destinataire - Sortie" icon={Clock}>
                    <input type="time" className={inputCls} value={podForm.receiverTimeOut} onChange={(e) => updateForm('receiverTimeOut', e.target.value)} />
                  </FormField>
                </div>

                {/* Frais */}
                <FormField label="Frais de transport (CDF)" icon={Package}>
                  <input type="number" className={inputCls} value={podForm.freightCharges} onChange={(e) => updateForm('freightCharges', e.target.value)} placeholder={loadData?.price?.toLocaleString() || '0'} />
                </FormField>
              </div>
            )}

            {/* ── Section 5: Signature electronique ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <FileSignature className="w-4 h-4 text-emerald-600" />
                Signature du recepteur *
              </div>
              <p className="text-[11px] text-gray-500">
                Le destinataire doit signer ci-dessous pour confirmer la reception de la marchandise.
              </p>
              <div className="border-2 border-dashed border-emerald-300 rounded-xl overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <button onClick={clearSignature} className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors">
                Effacer la signature
              </button>
            </div>

            {/* ── Section 6: Notes ── */}
            <FormField label="Notes supplementaires" icon={Info}>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none text-sm"
                value={podForm.notes}
                onChange={(e) => updateForm('notes', e.target.value)}
                rows={2}
                placeholder="Observations, remarques..."
              />
            </FormField>

            {/* ── Actions ── */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowPODForm(false)} className="flex-1 sm:flex-none">
                Annuler
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                onClick={() => { const data = buildPODData(); printPODPDF(data); }}
                className="flex-1 sm:flex-none"
              >
                <Eye className="w-4 h-4 mr-1" />
                Apercu PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => { const data = buildPODData(); downloadPODPDF(data); }}
                className="flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4 mr-1" />
                Telecharger PDF
              </Button>
              <Button
                onClick={submitPOD}
                disabled={!podForm.receiverName.trim() || isSubmitting}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Envoi...' : 'Signer et soumettre'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* LISTE DES DOCUMENTS */}
      {/* ══════════════════════════════════════════ */}
      {documents.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-600">Aucun document</p>
          <p className="text-xs text-gray-400 mt-1">Les BOL, POD et autres documents apparaitront ici</p>
          {canUpload && (
            <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowPODForm(true)}>
              <FileSignature className="w-3.5 h-3.5 mr-1" />
              Creer un POD
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const Icon = DOC_TYPE_ICONS[doc.type] || File;
            const color = DOC_TYPE_COLORS[doc.type] || 'bg-gray-100 text-gray-600';
            const isPOD = doc.type === 'pod';

            return (
              <div key={doc.id} className="flex items-center gap-3 bg-white rounded-lg border p-3 hover:border-primary-300 transition-colors group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                  <div className="text-xs text-gray-500">
                    {DOC_TYPE_LABELS[doc.type] || doc.type} • {new Date(doc.uploadedAt).toLocaleDateString('fr-CD')}
                  </div>
                </div>
                {doc.status && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    doc.status === 'signed' ? 'bg-blue-100 text-blue-700' :
                    doc.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {doc.status === 'signed' ? 'Signe' : doc.status === 'completed' ? 'Complete' : doc.status}
                  </span>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPOD && (
                    <button
                      onClick={() => downloadExistingPOD(doc)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"
                      title="Telecharger PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  {isPOD && (
                    <button
                      onClick={() => { const data = buildPODData(); printPODPDF(data); }}
                      className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors"
                      title="Imprimer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Voir">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
