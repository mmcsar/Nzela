'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/routing';
import { Link } from '@/lib/i18n/routing';
import { FileText, Loader2, ArrowLeft, Download, Save } from 'lucide-react';
import { downloadTransportInvoicePDF, type TransportInvoiceForPDF } from '@/components/invoices/TransportInvoicePrint';

function parseLoc(loc: unknown): string {
  if (!loc) return '—';
  if (typeof loc === 'string') {
    try {
      const o = JSON.parse(loc);
      return [o?.city, o?.address].filter(Boolean).join(', ') || '—';
    } catch {
      return loc;
    }
  }
  const o = loc as { city?: string; address?: string };
  return [o?.city, o?.address].filter(Boolean).join(', ') || '—';
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyée' },
  { value: 'paid', label: 'Payée' },
  { value: 'cancelled', label: 'Annulée' },
];

export default function FacturationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tms/invoices/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setInvoice(data.invoice);
      setNotes(data.invoice?.notes ?? '');
      setStatus(data.invoice?.status ?? 'draft');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tms/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setInvoice(data.invoice);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    const payload: TransportInvoiceForPDF = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: Number(invoice.amount),
      currency: invoice.currency || 'CDF',
      status: invoice.status,
      notes: invoice.notes,
      created_at: invoice.created_at,
      load: invoice.load,
      broker: invoice.broker,
    };
    downloadTransportInvoicePDF(payload);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/tms/facturation" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour facturation
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error || 'Facture non trouvée'}</div>
      </div>
    );
  }

  const origin = invoice.load ? parseLoc(invoice.load.origin) : '—';
  const dest = invoice.load ? parseLoc(invoice.load.destination) : '—';
  const isManual = !invoice.load_id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/dashboard/tms/facturation" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Retour facturation
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Download className="w-4 h-4" /> Télécharger PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-600" />
          <h1 className="text-lg font-bold text-gray-900">
            Facture {invoice.invoice_number || invoice.id.slice(0, 8)}
          </h1>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Trajet</span>
              <p className="font-medium text-gray-900">
                {isManual ? 'Facture manuelle (sans chargement lié)' : `${origin} → ${dest}`}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Montant</span>
              <p className="font-medium text-gray-900">
                {Number(invoice.amount).toLocaleString('fr-FR')} {invoice.currency}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Date de création</span>
              <p className="font-medium text-gray-900">
                {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Statut</span>
              <p className="font-medium">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                  invoice.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {STATUS_OPTIONS.find((s) => s.value === invoice.status)?.label || invoice.status}
                </span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Notes internes ou conditions..."
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      {invoice.load_id && (
        <p className="text-sm text-gray-500">
          <Link href={`/dashboard/loads/${invoice.load_id}`} className="text-primary-600 hover:underline">
            Voir le chargement associé
          </Link>
        </p>
      )}
    </div>
  );
}
