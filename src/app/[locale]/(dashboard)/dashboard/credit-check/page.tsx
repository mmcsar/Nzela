'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Search, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, DollarSign, Star } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { toErrorMessage } from '@/lib/api/error';

interface CreditCheck {
  credit_score: number;
  risk_level: string;
  payment_history: {
    total: number;
    completed: number;
    failed: number;
    totalAmount: number;
    paymentRate: number;
  };
  total_transactions: number;
  report: {
    entityName: string;
    entityStatus: string;
    registrationNumber: string;
    reliabilityScore: number;
    completedDeliveries: number;
  };
  valid_until: string;
  created_at: string;
}

const RISK_CFG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  low: { label: 'Faible', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  medium: { label: 'Moyen', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
  high: { label: 'Eleve', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: AlertTriangle },
  critical: { label: 'Critique', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

export default function CreditCheckPage() {
  const { isLoading: authLoading } = useRequireRole(['broker', 'company', 'admin']);
  const [entityType, setEntityType] = useState<'broker' | 'company'>('broker');
  const [entityId, setEntityId] = useState('');
  const [creditCheck, setCreditCheck] = useState<CreditCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const runCheck = async () => {
    if (!entityId) return;
    setIsLoading(true);
    setError('');
    setSearched(true);

    try {
      // D'abord verifier s'il y a un check recent
      const getRes = await fetch(`/api/credit-check?entity_type=${entityType}&entity_id=${entityId}`);
      const getData = await getRes.json();

      if (getData.creditCheck) {
        setCreditCheck(getData.creditCheck);
        return;
      }

      // Sinon, lancer un nouveau check
      const postRes = await fetch('/api/credit-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
      });
      const postData = await postRes.json();

      if (postData.error) {
        setError(toErrorMessage(postData.error, 'Erreur lors du credit check'));
        setCreditCheck(null);
      } else {
        setCreditCheck(postData.creditCheck);
      }
    } catch (e: any) {
      setError(e.message || 'Erreur lors du credit check');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    if (score >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreRing = (score: number) => {
    const pct = (score / 100) * 283; // circumference = 2 * pi * 45
    return `${pct} 283`;
  };

  if (authLoading) return <div className="flex justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-primary-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary-600" />
          Credit Check
        </h1>
        <p className="text-sm text-gray-500 mt-1">Verifiez la solvabilite d&apos;un courtier ou d&apos;une entreprise avant de faire affaire</p>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-lg font-bold mb-3">Lancer une verification</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select value={entityType} onChange={e => setEntityType(e.target.value as any)}
              className="px-3 py-2 border rounded-lg bg-white text-sm">
              <option value="broker">Courtier</option>
              <option value="company">Entreprise</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">ID de l&apos;entite</label>
            <input type="text" value={entityId} onChange={e => setEntityId(e.target.value)}
              placeholder="UUID du courtier ou de l'entreprise"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
          </div>
          <Button onClick={runCheck} isLoading={isLoading}>
            <Search className="w-4 h-4 mr-1" /> Verifier
          </Button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Resultat */}
      {creditCheck && (
        <div className="space-y-4">
          {/* Score principal */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-8">
              {/* Score circle */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f0f0f0" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke={creditCheck.credit_score >= 75 ? '#059669' : creditCheck.credit_score >= 50 ? '#d97706' : '#dc2626'}
                    strokeWidth="8" strokeLinecap="round" strokeDasharray={getScoreRing(creditCheck.credit_score)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${getScoreColor(creditCheck.credit_score)}`}>{creditCheck.credit_score}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">/ 100</span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {creditCheck.report?.entityName || 'Entite'}
                </h3>
                {creditCheck.report?.registrationNumber && (
                  <p className="text-xs text-gray-400 mb-3">N° {creditCheck.report.registrationNumber}</p>
                )}
                {/* Risk badge */}
                {(() => {
                  const risk = RISK_CFG[creditCheck.risk_level] || RISK_CFG.medium;
                  const RiskIcon = risk.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${risk.bg} ${risk.color}`}>
                      <RiskIcon className="w-4 h-4" />
                      Risque {risk.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-gray-500 uppercase font-bold">Paiements</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{creditCheck.payment_history?.completed || 0}</div>
              <div className="text-[10px] text-gray-400">sur {creditCheck.payment_history?.total || 0} total</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] text-gray-500 uppercase font-bold">Taux paiement</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{creditCheck.payment_history?.paymentRate || 0}%</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-gray-500 uppercase font-bold">Livraisons</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{creditCheck.report?.completedDeliveries || 0}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] text-gray-500 uppercase font-bold">Note fiabilite</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{creditCheck.report?.reliabilityScore || 'N/A'}</div>
              <div className="text-[10px] text-gray-400">/ 5</div>
            </div>
          </div>

          {/* Validite */}
          <div className="bg-gray-50 rounded-xl border p-4 flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            Rapport valide jusqu&apos;au {new Date(creditCheck.valid_until).toLocaleDateString('fr-FR')}
            <span className="text-[10px] text-gray-400 ml-auto">
              Genere le {new Date(creditCheck.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      )}

      {searched && !creditCheck && !isLoading && !error && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Aucun resultat</h3>
          <p className="text-sm text-gray-500 mt-2">Verifiez l&apos;ID de l&apos;entite et reessayez.</p>
        </div>
      )}
    </div>
  );
}
