'use client';

import { useState, useEffect } from 'react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Button } from '@/components/ui/Button';
import {
  Smartphone, CreditCard, DollarSign, CheckCircle2, XCircle, Clock,
  Phone, Shield, Zap, ChevronRight, ArrowRight, Loader2, RefreshCw,
  Wallet, TrendingUp, AlertCircle, History, ArrowDownRight, ArrowUpRight,
  FileDown,
} from 'lucide-react';
import { downloadInvoicePDF } from '@/components/invoices/InvoicePrint';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transaction_id: string;
  phone_number?: string;
  provider?: string;
  payment_type?: string;
  paid_at?: string;
  created_at: string;
  metadata?: { description?: string } | null;
}

const PROVIDERS = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    operator: 'Vodacom',
    color: '#e60000',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    prefixes: '081, 082, 083',
    icon: '📱',
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    operator: 'Airtel',
    color: '#ff0000',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    prefixes: '097, 099',
    icon: '📲',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    operator: 'Orange',
    color: '#ff7900',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    prefixes: '084, 085, 089',
    icon: '🍊',
  },
];

export default function PaymentsPage() {
  const { isAuthorized, isLoading: authLoading } = useRequireRole(['admin', 'broker', 'company']);
  const [step, setStep] = useState<'choose' | 'form' | 'processing' | 'result'>('choose');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'CDF' | 'USD'>('CDF');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch payment history
  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch('/api/payments?limit=20');
        const data = await res.json();
        setPayments(data.payments || []);
        setStats(data.stats || null);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    fetchPayments();
  }, []);

  // Auto-detect provider from phone number
  useEffect(() => {
    if (!phoneNumber || phoneNumber.length < 3) return;
    const clean = phoneNumber.replace(/\D/g, '');
    if (/^0?8[123]/.test(clean)) setSelectedProvider('mpesa');
    else if (/^0?9[79]/.test(clean)) setSelectedProvider('airtel');
    else if (/^0?8[459]/.test(clean)) setSelectedProvider('orange');
  }, [phoneNumber]);

  const handleSubmitPayment = async () => {
    if (!phoneNumber || !amount || parseFloat(amount) <= 0) return;
    setIsProcessing(true);
    setStep('processing');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          method: 'mobile-money',
          phone_number: phoneNumber,
          network: selectedProvider.toUpperCase(),
          payment_type: 'subscription',
          description,
        }),
      });

      const data = await res.json();
      setPaymentResult(data);
      setStep('result');

      // Refresh history
      const histRes = await fetch('/api/payments?limit=20');
      const histData = await histRes.json();
      setPayments(histData.payments || []);
      setStats(histData.stats || null);
    } catch (error: any) {
      setPaymentResult({ error: error.message });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStep('choose');
    setSelectedProvider('');
    setPhoneNumber('');
    setAmount('');
    setDescription('');
    setPaymentResult(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      failed: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      completed: 'Reussi',
      pending: 'En attente',
      failed: 'Echoue',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all bg-white';

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Paiements Mobile Money</h1>
            <p className="text-sm text-gray-500">M-Pesa, Airtel Money, Orange Money</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span className="text-[11px] font-medium text-emerald-700">Paiement securise</span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <History className="w-3 h-3 text-gray-600" />
            <span className="text-[11px] font-medium text-gray-700">Historique</span>
          </button>
        </div>
      </div>

      {/* ── Stats KPIs ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: CreditCard, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Reussis', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'CDF Total', value: stats.totalAmountCDF?.toLocaleString() + ' CDF', icon: ArrowDownRight, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'USD Total', value: '$' + stats.totalAmountUSD?.toLocaleString(), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                  <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">{kpi.value}</div>
              <div className="text-[11px] text-gray-500 font-medium">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Payment History (collapsible) ── */}
      {showHistory && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-bold text-gray-700">Historique des paiements</h3>
          </div>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun paiement</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {payments.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  {getStatusIcon(p.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {p.amount?.toLocaleString()} {p.currency}
                      </span>
                      {getStatusBadge(p.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {p.method === 'mobile-money' ? `Mobile Money ${p.phone_number || ''}` : p.method}
                      {' · '}
                      {new Date(p.created_at).toLocaleDateString('fr-CD')}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">{p.transaction_id}</span>
                  <button
                    type="button"
                    onClick={() => downloadInvoicePDF({
                      id: p.id,
                      amount: p.amount,
                      currency: p.currency,
                      method: p.method,
                      status: p.status,
                      transaction_id: p.transaction_id,
                      payment_type: p.payment_type,
                      created_at: p.created_at,
                      paid_at: p.paid_at,
                      metadata: p.metadata,
                    })}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors shrink-0"
                    title="Télécharger la facture"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════ */}
      {/* PAYMENT FLOW */}
      {/* ══════════════════════════════ */}

      {/* Step 1: Choose provider */}
      {step === 'choose' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
              Choisir le mode de paiement
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Mobile Money providers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => { setSelectedProvider(provider.id); setStep('form'); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                    selectedProvider === provider.id
                      ? `${provider.border} ${provider.bg} shadow-sm`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{provider.icon}</div>
                  <div className="font-bold text-gray-900 text-sm">{provider.name}</div>
                  <div className="text-xs text-gray-500">{provider.operator}</div>
                  <div className="text-[10px] text-gray-400 mt-1">Prefixes: {provider.prefixes}</div>
                </button>
              ))}
            </div>

            {/* Other methods */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs font-bold text-gray-400 uppercase">autres methodes</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setSelectedProvider('card'); setStep('form'); }}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-left transition-all hover:shadow-md"
              >
                <CreditCard className="w-6 h-6 text-blue-500 mb-2" />
                <div className="font-bold text-gray-900 text-sm">Carte bancaire</div>
                <div className="text-xs text-gray-500">Visa, Mastercard</div>
              </button>
              <button
                onClick={() => { setSelectedProvider('transfer'); setStep('form'); }}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-left transition-all hover:shadow-md"
              >
                <ArrowUpRight className="w-6 h-6 text-purple-500 mb-2" />
                <div className="font-bold text-gray-900 text-sm">Virement bancaire</div>
                <div className="text-xs text-gray-500">Rawbank, TMB, etc.</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Payment form */}
      {step === 'form' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
              Details du paiement
            </h2>
            <button onClick={() => setStep('choose')} className="text-xs text-gray-500 hover:text-gray-700 underline">
              ← Changer de methode
            </button>
          </div>
          <div className="p-5 space-y-5">
            {/* Selected provider badge */}
            {PROVIDERS.find(p => p.id === selectedProvider) && (
              <div className={`p-3 rounded-lg ${PROVIDERS.find(p => p.id === selectedProvider)!.bg} ${PROVIDERS.find(p => p.id === selectedProvider)!.border} border flex items-center gap-2`}>
                <span className="text-xl">{PROVIDERS.find(p => p.id === selectedProvider)!.icon}</span>
                <div>
                  <div className={`font-bold text-sm ${PROVIDERS.find(p => p.id === selectedProvider)!.text}`}>
                    {PROVIDERS.find(p => p.id === selectedProvider)!.name}
                  </div>
                  <div className="text-xs text-gray-500">{PROVIDERS.find(p => p.id === selectedProvider)!.operator}</div>
                </div>
              </div>
            )}

            {/* Phone number */}
            {['mpesa', 'airtel', 'orange'].includes(selectedProvider) && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Numero de telephone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className={`${inputCls} pl-10`}
                    placeholder="Ex: 0812345678"
                  />
                </div>
              </div>
            )}

            {/* Amount + Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Montant *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className={`${inputCls} pl-10`}
                    placeholder="Ex: 50000"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Devise</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as 'CDF' | 'USD')} className={inputCls}>
                  <option value="CDF">CDF (Franc)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description (optionnel)</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={inputCls}
                placeholder="Ex: Abonnement Pro, Paiement fret..."
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Montant</span>
                <span className="font-bold text-gray-900">{amount ? parseFloat(amount).toLocaleString() : '0'} {currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Methode</span>
                <span className="font-medium text-gray-700">{PROVIDERS.find(p => p.id === selectedProvider)?.name || selectedProvider}</span>
              </div>
              {phoneNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Numero</span>
                  <span className="font-medium text-gray-700">{phoneNumber}</span>
                </div>
              )}
            </div>

            {/* Security badges */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Shield, label: 'SSL Crypte' },
                { icon: Zap, label: 'Instantane' },
                { icon: CheckCircle2, label: 'Flutterwave' },
              ].map(badge => (
                <div key={badge.label} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                  <badge.icon className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-emerald-700">{badge.label}</span>
                </div>
              ))}
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmitPayment}
              disabled={!amount || parseFloat(amount) <= 0 || (['mpesa', 'airtel', 'orange'].includes(selectedProvider) && !phoneNumber)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 py-3"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Payer {amount ? parseFloat(amount).toLocaleString() : ''} {currency}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === 'processing' && (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verification en cours...</h2>
          <p className="text-gray-500 mb-4">Verifiez votre telephone pour confirmer le paiement.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-sm mx-auto text-left">
            <p className="text-sm text-amber-800 font-medium">
              {selectedProvider === 'mpesa' && 'Entrez votre code PIN M-Pesa sur la notification USSD.'}
              {selectedProvider === 'airtel' && 'Confirmez via le message USSD Airtel Money.'}
              {selectedProvider === 'orange' && 'Composez *144# ou confirmez via Orange Money.'}
            </p>
          </div>
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mt-6" />
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          {paymentResult?.error ? (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Echec du paiement</h2>
              <p className="text-red-600 mb-6">{paymentResult.error}</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Paiement initie !</h2>
              <p className="text-gray-500 mb-2">{paymentResult?.message}</p>
              {paymentResult?.instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm mx-auto mb-4 text-left">
                  <p className="text-sm text-blue-800">{paymentResult.instructions}</p>
                </div>
              )}
              {paymentResult?.transaction_id && (
                <p className="text-xs text-gray-400 font-mono mb-4">Ref: {paymentResult.transaction_id}</p>
              )}
              {paymentResult?.payment && (
                <Button
                  variant="outline"
                  className="mb-6"
                  onClick={() => downloadInvoicePDF({
                    id: paymentResult.payment.id,
                    amount: paymentResult.payment.amount,
                    currency: paymentResult.payment.currency,
                    method: paymentResult.payment.method,
                    status: paymentResult.payment.status,
                    transaction_id: paymentResult.payment.transaction_id,
                    payment_type: paymentResult.payment.payment_type,
                    created_at: paymentResult.payment.created_at,
                    paid_at: paymentResult.payment.paid_at,
                    metadata: paymentResult.payment.metadata,
                  })}
                >
                  <FileDown className="w-4 h-4 mr-2" /> Télécharger la facture
                </Button>
              )}
            </>
          )}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowHistory(true)}>
              <History className="w-4 h-4 mr-2" /> Historique
            </Button>
            <Button onClick={resetForm}>
              <Wallet className="w-4 h-4 mr-2" /> Nouveau paiement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
