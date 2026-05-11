'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';
import { FileText, Plus, Loader2, DollarSign, Package, ChevronRight, Download, PenLine, Trash2 } from 'lucide-react';
import { downloadTransportInvoicePDF, type TransportInvoiceForPDF, type InvoiceLineItem } from '@/components/invoices/TransportInvoicePrint';
import { formatLoadLocationLine } from '@/lib/utils/load-location';

function parseLocation(loc: unknown): string {
  return formatLoadLocationLine(loc);
}

interface Invoice {
  id: string;
  load_id: string | null;
  amount: number;
  currency: string;
  status: string;
  invoice_number: string | null;
  notes?: string | null;
  created_at: string;
  load?: { origin: unknown; destination: unknown; price: number; status: string } | null;
  broker?: { name?: string; address?: string; city?: string; phone?: string; registration_number?: string } | null;
  company?: { name?: string; address?: string; city?: string; phone?: string; registration_number?: string } | null;
}

export default function TMSFacturationPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthorized, role, brokerId } = useRequireRole(['broker', 'company', 'admin']);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadsToInvoice, setLoadsToInvoice] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid'>('all');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualCurrency, setManualCurrency] = useState<'CDF' | 'USD'>('CDF');
  const [manualNotes, setManualNotes] = useState('');
  const [creatingManual, setCreatingManual] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Formulaire facture complète manuelle (toutes rubriques pour générer le PDF)
  const [fullIssuerName, setFullIssuerName] = useState('');
  const [fullIssuerAddress, setFullIssuerAddress] = useState('');
  const [fullIssuerCity, setFullIssuerCity] = useState('');
  const [fullIssuerPhone, setFullIssuerPhone] = useState('');
  const [fullIssuerRccm, setFullIssuerRccm] = useState('');
  const [fullClientName, setFullClientName] = useState('');
  const [fullClientAddress, setFullClientAddress] = useState('');
  const [fullClientCity, setFullClientCity] = useState('');
  const [fullClientPhone, setFullClientPhone] = useState('');
  const [fullClientNif, setFullClientNif] = useState('');
  const [fullInvNumber, setFullInvNumber] = useState('');
  const [fullDateEmission, setFullDateEmission] = useState(() => new Date().toISOString().slice(0, 10));
  const [fullDueDays, setFullDueDays] = useState(14);
  const [fullCurrency, setFullCurrency] = useState<'CDF' | 'USD'>('USD');
  const [fullLineItems, setFullLineItems] = useState<Array<{ id: string; description: string; quantity: number; unit_price: number }>>([
    { id: '1', description: '', quantity: 1, unit_price: 0 },
  ]);
  const [fullTvaRate, setFullTvaRate] = useState(0);
  const [fullAdvanceAmount, setFullAdvanceAmount] = useState('');
  const [fullAdvanceDate, setFullAdvanceDate] = useState('');
  const [fullAdvanceRef, setFullAdvanceRef] = useState('');
  const [fullAdvanceMethod, setFullAdvanceMethod] = useState('');
  const [fullNotes, setFullNotes] = useState('');

  const filteredInvoices = filterStatus === 'unpaid'
    ? invoices.filter((i) => i.status === 'draft' || i.status === 'sent')
    : invoices;
  const unpaidCount = invoices.filter((i) => i.status === 'draft' || i.status === 'sent').length;

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/tms/invoices');
      const data = await res.json();
      if (res.ok) setInvoices(data.invoices || []);
    } catch {
      setInvoices([]);
    }
  }, []);

  const fetchLoadsToInvoice = useCallback(async () => {
    if (!brokerId || role !== 'broker') return;
    try {
      const { data } = await supabase
        .from('loads')
        .select('id, origin, destination, price, status')
        .eq('broker_id', brokerId)
        .eq('status', 'completed');
      const loadIdsWithInvoice = new Set(invoices.map((i) => i.load_id));
      setLoadsToInvoice((data || []).filter((l) => !loadIdsWithInvoice.has(l.id)));
    } catch {
      setLoadsToInvoice([]);
    }
  }, [brokerId, role, supabase, invoices]);

  useEffect(() => {
    if (!isAuthorized) return;
    setLoading(true);
    fetchInvoices().finally(() => setLoading(false));
  }, [isAuthorized, fetchInvoices]);

  useEffect(() => {
    if (isAuthorized && invoices.length >= 0) fetchLoadsToInvoice();
  }, [isAuthorized, invoices, fetchLoadsToInvoice]);

  const createInvoice = async (loadId: string) => {
    setCreating(loadId);
    setError(null);
    try {
      const res = await fetch('/api/tms/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      await fetchInvoices();
      await fetchLoadsToInvoice();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur création facture');
    } finally {
      setCreating(null);
    }
  };

  const createManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(manualAmount.replace(/\s/g, '').replace(',', '.'));
    if (Number.isNaN(num) || num <= 0) {
      setError('Montant invalide');
      return;
    }
    setCreatingManual(true);
    setError(null);
    try {
      const res = await fetch('/api/tms/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: num,
          currency: manualCurrency,
          notes: manualNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setShowManualForm(false);
      setManualAmount('');
      setManualNotes('');
      await fetchInvoices();
      await fetchLoadsToInvoice();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur création facture');
    } finally {
      setCreatingManual(false);
    }
  };

  const addFullLineItem = () => {
    setFullLineItems((prev) => [...prev, { id: String(Date.now()), description: '', quantity: 1, unit_price: 0 }]);
  };
  const removeFullLineItem = (id: string) => {
    setFullLineItems((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  };
  const updateFullLineItem = (id: string, field: string, value: string | number) => {
    setFullLineItems((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const generateFullManualPDF = () => {
    const lines: InvoiceLineItem[] = fullLineItems
      .filter((l) => l.description.trim() || l.unit_price > 0)
      .map((l) => ({
        description: l.description.trim() || 'Prestation',
        quantity: Math.max(0, l.quantity),
        unit_price: Math.max(0, l.unit_price),
        amount: Math.max(0, l.quantity) * Math.max(0, l.unit_price),
      }));
    if (lines.length === 0) {
      setError('Ajoutez au moins une ligne avec une description et un montant.');
      return;
    }
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const tvaAmount = (subtotal * fullTvaRate) / 100;
    const totalTTC = subtotal + tvaAmount;
    const advance = fullAdvanceAmount.trim() ? parseFloat(fullAdvanceAmount.replace(/\s/g, '').replace(',', '.')) : 0;
    const validAdvance = Number.isFinite(advance) ? advance : 0;
    const payload: TransportInvoiceForPDF = {
      id: 'manual-' + Date.now(),
      invoice_number: fullInvNumber.trim() || `FAC-MAN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      amount: totalTTC - validAdvance,
      currency: fullCurrency,
      status: 'draft',
      created_at: fullDateEmission ? new Date(fullDateEmission).toISOString() : new Date().toISOString(),
      notes: fullNotes.trim() || undefined,
      broker: fullIssuerName.trim()
        ? {
            name: fullIssuerName.trim(),
            address: fullIssuerAddress.trim(),
            city: fullIssuerCity.trim(),
            phone: fullIssuerPhone.trim(),
            registration_number: fullIssuerRccm.trim(),
          }
        : null,
      company: fullClientName.trim()
        ? {
            name: fullClientName.trim(),
            address: fullClientAddress.trim(),
            city: fullClientCity.trim(),
            phone: fullClientPhone.trim(),
            registration_number: fullClientNif.trim(),
          }
        : null,
      line_items: lines,
      tva_rate: fullTvaRate,
      due_days: fullDueDays,
      advance_payment:
        validAdvance > 0 && fullAdvanceDate
          ? {
              amount: validAdvance,
              date: fullAdvanceDate,
              reference: fullAdvanceRef.trim() || undefined,
              method: fullAdvanceMethod.trim() || undefined,
            }
          : undefined,
    };
    setError(null);
    downloadTransportInvoicePDF(payload);
  };

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Facturation transport</h1>
          <p className="text-sm text-gray-500">Créez et suivez les factures liées aux chargements terminés</p>
        </div>
        <Link href="/dashboard/tms" className="text-sm text-primary-600 hover:underline">
          ← Retour TMS
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Facture complète — saisie manuelle (toutes rubriques pour générer le PDF) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-primary-50/50">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            Générer une facture complète (saisie manuelle)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Remplissez toutes les rubriques puis cliquez sur Générer le PDF. Aucun enregistrement en base.</p>
        </div>
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Émetteur (votre société)</h3>
              <input type="text" placeholder="Nom / Raison sociale *" value={fullIssuerName} onChange={(e) => setFullIssuerName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Adresse" value={fullIssuerAddress} onChange={(e) => setFullIssuerAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Ville" value={fullIssuerCity} onChange={(e) => setFullIssuerCity(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Téléphone" value={fullIssuerPhone} onChange={(e) => setFullIssuerPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="RCCM" value={fullIssuerRccm} onChange={(e) => setFullIssuerRccm(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Facturé à (client)</h3>
              <input type="text" placeholder="Nom / Raison sociale *" value={fullClientName} onChange={(e) => setFullClientName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Adresse" value={fullClientAddress} onChange={(e) => setFullClientAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Ville" value={fullClientCity} onChange={(e) => setFullClientCity(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Téléphone" value={fullClientPhone} onChange={(e) => setFullClientPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="NIF / Id. Nat." value={fullClientNif} onChange={(e) => setFullClientNif(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">N° facture</label>
              <input type="text" placeholder="FAC-2025-0001" value={fullInvNumber} onChange={(e) => setFullInvNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date d&apos;émission</label>
              <input type="date" value={fullDateEmission} onChange={(e) => setFullDateEmission(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Échéance (jours)</label>
              <input type="number" min={1} value={fullDueDays} onChange={(e) => setFullDueDays(parseInt(e.target.value, 10) || 14)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Devise</label>
              <select value={fullCurrency} onChange={(e) => setFullCurrency(e.target.value as 'CDF' | 'USD')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="CDF">CDF</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Lignes de facturation</h3>
              <button type="button" onClick={addFullLineItem} className="text-xs font-medium text-primary-600 hover:underline">+ Ajouter une ligne</button>
            </div>
            <div className="space-y-2">
              {fullLineItems.map((line) => (
                <div key={line.id} className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <input type="text" placeholder="Description" value={line.description} onChange={(e) => updateFullLineItem(line.id, 'description', e.target.value)} className="flex-1 min-w-[120px] px-3 py-1.5 border border-gray-200 rounded text-sm" />
                  <input type="number" min={0} step={1} placeholder="Qté" value={line.quantity || ''} onChange={(e) => updateFullLineItem(line.id, 'quantity', parseInt(e.target.value, 10) || 0)} className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm" />
                  <input type="number" min={0} step={0.01} placeholder="P.U." value={line.unit_price || ''} onChange={(e) => updateFullLineItem(line.id, 'unit_price', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm" />
                  <span className="text-xs text-gray-500 w-20 text-right">= {(line.quantity * line.unit_price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                  <button type="button" onClick={() => removeFullLineItem(line.id)} aria-label="Supprimer" className="p-1.5 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Taux TVA (%)</label>
              <input type="number" min={0} max={100} step={0.5} value={fullTvaRate || ''} onChange={(e) => setFullTvaRate(parseFloat(e.target.value) || 0)} className="w-full max-w-[100px] px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Acompte (optionnel)</h3>
              <input type="text" inputMode="decimal" placeholder="Montant acompte" value={fullAdvanceAmount} onChange={(e) => setFullAdvanceAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="date" placeholder="Date" value={fullAdvanceDate} onChange={(e) => setFullAdvanceDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Référence (ex. MP2025...)" value={fullAdvanceRef} onChange={(e) => setFullAdvanceRef(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Moyen (M-Pesa, Orange Money...)" value={fullAdvanceMethod} onChange={(e) => setFullAdvanceMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea value={fullNotes} onChange={(e) => setFullNotes(e.target.value)} rows={2} placeholder="Conditions, mentions..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button type="button" onClick={generateFullManualPDF} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              <Download className="w-4 h-4" />
              Générer le PDF
            </button>
          </div>
        </div>
      </div>

      {(role === 'broker' || role === 'admin') && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-700">Chargements à facturer ({loadsToInvoice.length})</h2>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                </div>
              ) : loadsToInvoice.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun chargement terminé sans facture.</p>
              ) : (
                <ul className="space-y-2">
                  {loadsToInvoice.map((load) => (
                    <li
                      key={load.id}
                      className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {parseLocation(load.origin)} → {parseLocation(load.destination)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {Number(load.price || 0).toLocaleString()} CDF
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => createInvoice(load.id)}
                        disabled={creating === load.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {creating === load.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Créer facture
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {!showManualForm ? (
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setShowManualForm(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <PenLine className="w-4 h-4" />
                  Créer une facture manuellement
                </button>
                <p className="mt-2 text-xs text-gray-500">Facture sans chargement lié (montant et devise saisis à la main).</p>
              </div>
            ) : (
              <form onSubmit={createManualInvoice} className="p-4 space-y-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Nouvelle facture manuelle</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Montant *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="Ex: 150000"
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Devise</label>
                  <select
                    value={manualCurrency}
                    onChange={(e) => setManualCurrency(e.target.value as 'CDF' | 'USD')}
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="CDF">CDF</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optionnel)</label>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    rows={2}
                    placeholder="Réf. client, prestation..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creatingManual}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {creatingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Créer la facture
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowManualForm(false); setManualAmount(''); setManualNotes(''); setError(null); }}
                    disabled={creatingManual}
                    className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            <h2 className="text-sm font-bold text-gray-700">Factures ({filteredInvoices.length})</h2>
            {unpaidCount > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {unpaidCount} en attente de paiement
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-1 text-xs font-medium rounded ${filterStatus === 'all' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('unpaid')}
              className={`px-2 py-1 text-xs font-medium rounded ${filterStatus === 'unpaid' ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Non payées
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">{filterStatus === 'unpaid' ? 'Aucune facture en attente de paiement' : 'Aucune facture pour le moment'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">N° / Chargement</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="py-3 px-2 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-gray-900">{inv.invoice_number || inv.id.slice(0, 8)}</span>
                      {inv.load ? (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {parseLocation(inv.load.origin)} → {parseLocation(inv.load.destination)}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 mt-0.5 italic">Facture manuelle</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {Number(inv.amount).toLocaleString()} {inv.currency}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        inv.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {inv.status === 'draft' ? 'Brouillon' : inv.status === 'sent' ? 'Envoyée' : inv.status === 'paid' ? 'Payée' : 'Annulée'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const payload: TransportInvoiceForPDF = {
                              id: inv.id,
                              invoice_number: inv.invoice_number,
                              amount: Number(inv.amount),
                              currency: inv.currency || 'CDF',
                              status: inv.status,
                              notes: inv.notes,
                              created_at: inv.created_at,
                              load: inv.load,
                              broker: inv.broker ?? null,
                              company: inv.company ?? null,
                              due_days: 14,
                            };
                            downloadTransportInvoicePDF(payload);
                          }}
                          className="p-1.5 text-gray-500 hover:text-primary-600 rounded hover:bg-gray-100"
                          title="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/tms/facturation/${inv.id}`)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 rounded hover:bg-gray-100"
                          title="Voir / modifier"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
