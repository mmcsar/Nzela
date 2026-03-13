'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';
import { FileText, Plus, Loader2, DollarSign, Package, ChevronRight, Download, PenLine } from 'lucide-react';
import { downloadTransportInvoicePDF, type TransportInvoiceForPDF } from '@/components/invoices/TransportInvoicePrint';

function parseLocation(loc: unknown): string {
  if (!loc) return '—';
  if (typeof loc === 'string') {
    try {
      const o = JSON.parse(loc);
      return o?.city ?? o?.address ?? '—';
    } catch {
      return loc;
    }
  }
  return (loc as { city?: string })?.city ?? '—';
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
  broker?: { name?: string } | null;
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
                              broker: inv.broker,
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
