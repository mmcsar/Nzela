'use client';

import { useState, useEffect } from 'react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck, ShieldX, Upload, FileText, CheckCircle2, XCircle,
  Clock, AlertTriangle, Loader2, ChevronRight, Eye, CreditCard,
  Truck, User, Building2, FileCheck, ArrowRight, Info, BadgeCheck,
} from 'lucide-react';

const DOCUMENT_TYPES: Record<string, { label: string; description: string; icon: any }> = {
  national_id: { label: 'Carte d\'identite', description: 'Carte d\'identite nationale ou passeport', icon: User },
  passport: { label: 'Passeport', description: 'Passeport valide', icon: FileText },
  drivers_license: { label: 'Permis de conduire', description: 'Permis de conduire valide', icon: Truck },
  business_registration: { label: 'RCCM', description: 'Registre de Commerce et du Credit Mobilier', icon: Building2 },
  tax_certificate: { label: 'NIF / Patente', description: 'Numero d\'Impot Fiscal ou Patente', icon: CreditCard },
  transport_license: { label: 'Licence de transport', description: 'Autorisation ministerielle de transport', icon: Truck },
  insurance_certificate: { label: 'Assurance', description: 'Attestation d\'assurance vehicule/marchandise', icon: ShieldCheck },
  vehicle_registration: { label: 'Carte grise', description: 'Carte d\'immatriculation vehicule', icon: FileText },
  proof_of_address: { label: 'Preuve de domicile', description: 'Facture d\'electricite, eau, etc.', icon: FileText },
};

interface VerificationDoc {
  id: string;
  document_type: string;
  document_number: string;
  status: string;
  file_name?: string;
  created_at: string;
  review_notes?: string;
}

export default function VerificationPage() {
  const { isLoading: authLoading, isAuthorized, role, companyId, brokerId, userId } = useRequireRole(['broker', 'company', 'admin']);

  const [documents, setDocuments] = useState<VerificationDoc[]>([]);
  const [request, setRequest] = useState<any>(null);
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [missingDocs, setMissingDocs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [docNumber, setDocNumber] = useState('');

  const entityType = role === 'company' ? 'company' : role === 'broker' ? 'broker' : 'user';
  const entityId = role === 'company' ? companyId : role === 'broker' ? brokerId : userId;

  // Fetch verification status
  useEffect(() => {
    if (!entityId) return;
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/kyc?entityType=${entityType}&entityId=${entityId}`);
        const data = await res.json();
        setDocuments(data.documents || []);
        setRequest(data.request || null);
        setRequiredDocs(data.requiredDocs || []);
        setMissingDocs(data.missingDocs || []);
        setProgress(data.progress || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStatus();
  }, [entityId, entityType]);

  // Upload a document (metadata for now)
  const handleUploadDoc = async (docType: string) => {
    if (!docNumber.trim()) return;
    setUploadingType(docType);

    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_document',
          entityType,
          entityId,
          documentType: docType,
          documentNumber: docNumber,
          fileName: `${docType}_${Date.now()}.pdf`,
        }),
      });

      const data = await res.json();
      if (data.document) {
        setDocuments(prev => [data.document, ...prev]);
        setMissingDocs(prev => prev.filter(d => d !== docType));
        setProgress(prev => Math.min(100, prev + Math.round(100 / requiredDocs.length)));
        setDocNumber('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingType(null);
    }
  };

  // Submit verification request
  const submitVerification = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_request',
          entityType,
          entityId,
        }),
      });
      const data = await res.json();
      if (data.request) {
        setRequest(data.request);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved': case 'verified': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, label: 'Verifie' };
      case 'pending': case 'in_review': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, label: 'En attente' };
      case 'rejected': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'Rejete' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: Info, label: 'Non soumis' };
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all bg-white';

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Courtier/Entreprise sans profil complet (brokerId/companyId manquant)
  if ((role === 'broker' || role === 'company') && !entityId) {
    return (
      <div className="max-w-lg mx-auto bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-bold text-amber-800 mb-2">Profil incomplet</h2>
        <p className="text-amber-700 mb-4">
          Votre profil {role === 'broker' ? 'courtier' : 'entreprise'} n&apos;est pas encore complet. Contactez le support pour finaliser l&apos;inscription avant de soumettre une verification.
        </p>
        <a href="mailto:info@nzelaa.com" className="text-primary-600 font-semibold hover:underline">
          info@nzelaa.com
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verification KYC</h1>
          <p className="text-sm text-gray-500">Verifiez votre identite pour debloquer toutes les fonctionnalites</p>
        </div>
      </div>

      {/* ── Status banner ── */}
      {request && (
        <div className={`p-4 rounded-xl border ${getStatusInfo(request.status).bg} ${getStatusInfo(request.status).border}`}>
          <div className="flex items-center gap-3">
            {(() => { const S = getStatusInfo(request.status); return <S.icon className={`w-5 h-5 ${S.color}`} />; })()}
            <div className="flex-1">
              <div className={`font-bold text-sm ${getStatusInfo(request.status).color}`}>
                {request.status === 'approved' && 'Verification approuvee !'}
                {request.status === 'pending' && 'Demande en cours d\'examen'}
                {request.status === 'in_review' && 'En cours de verification par un administrateur'}
                {request.status === 'rejected' && 'Verification rejetee'}
                {request.status === 'more_info_needed' && 'Informations supplementaires requises'}
              </div>
              {request.review_notes && (
                <p className="text-xs text-gray-600 mt-1">{request.review_notes}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Soumis le {new Date(request.submitted_at).toLocaleDateString('fr-CD')}
              </p>
            </div>
            {request.status === 'approved' && (
              <BadgeCheck className="w-8 h-8 text-emerald-500" />
            )}
          </div>
        </div>
      )}

      {/* ── Progress ── */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">Progression</h3>
          <span className="text-sm font-bold text-emerald-600">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress === 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-blue-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{documents.length} document(s) soumis</span>
          <span>{missingDocs.length} restant(s)</span>
        </div>
      </div>

      {/* ── Required Documents ── */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b">
          <h3 className="text-sm font-bold text-gray-700">Documents requis</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {requiredDocs.map(docType => {
            const docInfo = DOCUMENT_TYPES[docType] || { label: docType, description: '', icon: FileText };
            const existing = documents.find(d => d.document_type === docType);
            const Icon = docInfo.icon;
            const isMissing = missingDocs.includes(docType);

            return (
              <div key={docType} className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    existing ? (existing.status === 'approved' ? 'bg-emerald-50' : 'bg-amber-50') : 'bg-gray-50'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      existing ? (existing.status === 'approved' ? 'text-emerald-600' : 'text-amber-600') : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{docInfo.label}</span>
                      {existing && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          existing.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          existing.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {existing.status === 'approved' ? 'Approuve' : existing.status === 'rejected' ? 'Rejete' : 'En attente'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{docInfo.description}</p>
                    {existing?.document_number && (
                      <p className="text-xs text-gray-600 mt-0.5 font-mono">N° {existing.document_number}</p>
                    )}
                    {existing?.review_notes && (
                      <p className="text-xs text-red-500 mt-1">{existing.review_notes}</p>
                    )}
                  </div>
                  {existing ? (
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${existing.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`} />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-gray-300 shrink-0" />
                  )}
                </div>

                {/* Upload form for missing docs */}
                {isMissing && (!request || request.status === 'rejected' || request.status === 'more_info_needed') && (
                  <div className="mt-3 flex items-end gap-2 pl-12">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Numero du document</label>
                      <input
                        value={uploadingType === docType ? docNumber : ''}
                        onChange={e => { setDocNumber(e.target.value); setUploadingType(docType); }}
                        onFocus={() => setUploadingType(docType)}
                        className={inputCls}
                        placeholder={`Ex: ${docType === 'business_registration' ? 'RCCM/LBB/2024/B/1234' : docType === 'tax_certificate' ? 'NIF-A12345' : 'Numero...'}`}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleUploadDoc(docType)}
                      disabled={uploadingType !== docType || !docNumber.trim()}
                      className="bg-blue-600 hover:bg-blue-700 shrink-0"
                    >
                      {uploadingType === docType && !docNumber ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span className="ml-1.5">Soumettre</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Submit button ── */}
      {documents.length > 0 && (!request || request.status === 'rejected' || request.status === 'more_info_needed') && (
        <Button
          onClick={submitVerification}
          disabled={isSubmitting || missingDocs.length === requiredDocs.length}
          className="w-full bg-emerald-600 hover:bg-emerald-700 py-3"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
          Soumettre la demande de verification
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}

      {/* ── Info box ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-bold mb-1">Pourquoi la verification ?</p>
            <ul className="space-y-0.5 list-disc pl-3">
              <li>Garantit la confiance entre les partenaires sur la plateforme</li>
              <li>Requis pour poster des chargements et accepter des offres</li>
              <li>Protege contre la fraude et les activites illicites</li>
              <li>Conforme a la reglementation RDC sur le transport</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
