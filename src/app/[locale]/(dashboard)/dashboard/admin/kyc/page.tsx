'use client';

import { useState, useEffect } from 'react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Button } from '@/components/ui/Button';
import { Link } from '@/lib/i18n/routing';
import {
  ShieldCheck, ShieldX, CheckCircle2, XCircle, Clock, AlertTriangle,
  Loader2, FileText, User, Building2, Eye, MessageSquare, ChevronDown,
  Search, Filter, BadgeCheck, Ban, HelpCircle,
} from 'lucide-react';

interface KYCRequest {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  submitted_at: string;
  review_notes?: string;
  documents: any[];
  user: { email: string; full_name: string } | null;
  entityName: string;
}

export default function AdminKYCPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['admin']);
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>(''); // '' = tous, 'broker', 'company'
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = async (status: string, entityType: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ status });
      if (entityType) params.set('entityType', entityType);
      const res = await fetch(`/api/kyc?${params.toString()}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(statusFilter, entityTypeFilter);
  }, [statusFilter, entityTypeFilter]);

  const handleReview = async (request: KYCRequest, decision: string, notes?: string) => {
    if (decision === 'rejected' && !(notes || reviewNotes).trim()) {
      setSelectedRequest(request);
      setReviewNotes('');
      return;
    }
    setReviewingId(request.id);
    try {
      await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          requestId: request.id,
          decision,
          reviewNotes: notes ?? reviewNotes,
        }),
      });
      await fetchRequests(statusFilter, entityTypeFilter);
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setReviewingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.user?.email?.toLowerCase().includes(q) ||
      r.user?.full_name?.toLowerCase().includes(q) ||
      r.entityName?.toLowerCase().includes(q) ||
      r.entity_type?.toLowerCase().includes(q)
    );
  });

  const stats = {
    pending: requests.filter(r => r.status === 'pending' || r.status === 'more_info_needed').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const countByRole = {
    broker: requests.filter(r => r.entity_type === 'broker').length,
    company: requests.filter(r => r.entity_type === 'company').length,
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all bg-white';

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Verification KYC</h1>
            <p className="text-sm text-gray-500">Courtiers et entreprises — valider toutes les demandes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <User className="w-4 h-4" />
            <strong>Courtiers</strong> {countByRole.broker}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
            <Building2 className="w-4 h-4" />
            <strong>Entreprises</strong> {countByRole.company}
          </span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputCls} pl-9`} placeholder="Rechercher par email, nom..." />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'pending', label: 'En attente', icon: Clock, color: 'amber' },
            { value: 'approved', label: 'Approuves', icon: CheckCircle2, color: 'emerald' },
            { value: 'rejected', label: 'Rejetes', icon: XCircle, color: 'red' },
            { value: 'all', label: 'Tous', icon: Filter, color: 'gray' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                statusFilter === f.value
                  ? `bg-${f.color}-50 border-${f.color}-300 text-${f.color}-700`
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[
            { value: '', label: 'Tous types' },
            { value: 'broker', label: 'Courtiers' },
            { value: 'company', label: 'Entreprises' },
          ].map(f => (
            <button
              key={f.value || 'all'}
              onClick={() => setEntityTypeFilter(f.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                entityTypeFilter === f.value
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f.value === 'broker' && <User className="w-3.5 h-3.5" />}
              {f.value === 'company' && <Building2 className="w-3.5 h-3.5" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Requests list ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">Aucune demande</h3>
          <p className="text-sm text-gray-500">
            {statusFilter === 'all' && !entityTypeFilter
              ? 'Aucune demande de verification (courtiers et entreprises) dans le systeme.'
              : `Aucune demande${entityTypeFilter ? ` ${entityTypeFilter === 'broker' ? 'courtier' : 'entreprise'}` : ' courtier ou entreprise'}${statusFilter !== 'all' ? ` avec le statut "${statusFilter === 'pending' ? 'en attente' : statusFilter === 'approved' ? 'approuvé' : statusFilter === 'rejected' ? 'rejeté' : statusFilter}"` : ''}.`}
          </p>
          {statusFilter === 'pending' && (
            <p className="text-sm text-amber-700 mt-3 max-w-md mx-auto">
              Pour valider les nouvelles inscriptions, allez dans{' '}
              <Link href="/dashboard/admin/companies" className="font-semibold text-primary-600 hover:underline">Gestion des Entreprises</Link>
              {' '}ou{' '}
              <Link href="/dashboard/admin/brokers" className="font-semibold text-primary-600 hover:underline">Gestion des Courtiers</Link>
              {' '}→ filtre &quot;En attente&quot; → bouton &quot;Valider&quot;.
            </p>
          )}
          {(statusFilter === 'approved' || statusFilter === 'rejected') && (
            <Button
              size="sm"
              onClick={() => setStatusFilter('pending')}
              className="mt-4"
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Voir les demandes en attente
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => (
            <div key={req.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
              selectedRequest?.id === req.id ? 'ring-2 ring-blue-500' : ''
            }`}>
              {/* Summary row */}
              <button
                onClick={() => setSelectedRequest(selectedRequest?.id === req.id ? null : req)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  req.entity_type === 'company' ? 'bg-purple-50' : req.entity_type === 'broker' ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  {req.entity_type === 'company' ? <Building2 className="w-5 h-5 text-purple-600" /> :
                   req.entity_type === 'broker' ? <User className="w-5 h-5 text-blue-600" /> :
                   <User className="w-5 h-5 text-gray-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm truncate">{req.entityName || req.user?.full_name || 'N/A'}</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase">{req.entity_type}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {req.user?.email || ''}
                    {req.documents.length === 0 ? (
                      <span className="ml-1 text-amber-600 font-medium">· Association de profil</span>
                    ) : (
                      <> · {req.documents.length} document(s)</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(req.status === 'pending' || req.status === 'more_info_needed') && (
                    <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                      <Button
                        size="sm"
                        onClick={() => handleReview(req, 'approved')}
                        disabled={reviewingId !== null}
                        className="!py-1 !px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        {reviewingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5 mr-0.5" />}
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedRequest(selectedRequest?.id === req.id ? null : req); setReviewNotes(''); }}
                        disabled={reviewingId !== null}
                        className="!py-1 !px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Ban className="w-3.5 h-3.5 mr-0.5" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                  <span className="text-xs text-gray-400">{new Date(req.submitted_at).toLocaleDateString('fr-CD')}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${selectedRequest?.id === req.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded detail */}
              {selectedRequest?.id === req.id && (
                <div className="border-t bg-gray-50 p-4 space-y-4">
                  {/* Documents ou info association */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">
                      {req.documents.length === 0 ? 'Demande d\'association' : 'Documents soumis'}
                    </h4>
                    {req.documents.length === 0 ? (
                      <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        L&apos;utilisateur demande l&apos;association de son compte {req.entity_type === 'company' ? 'entreprise' : 'courtier'}. Aucun document KYC soumis. Approuvez pour lier le profil.
                      </p>
                    ) : (
                    <div className="space-y-2">
                      {req.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center gap-3 bg-white rounded-lg border p-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{doc.document_type.replace(/_/g, ' ')}</div>
                            {doc.document_number && <div className="text-xs text-gray-500 font-mono">N° {doc.document_number}</div>}
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            doc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>

                  {/* Review form (detail) */}
                  {(req.status === 'pending' || req.status === 'more_info_needed') && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Decision</h4>
                      <textarea
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                        className={`${inputCls} min-h-[80px]`}
                        placeholder="Notes de verification (obligatoire pour rejet)..."
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => handleReview(req, 'approved')}
                          disabled={reviewingId !== null}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {reviewingId === req.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <BadgeCheck className="w-4 h-4 mr-1" />}
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(req, 'more_info_needed')}
                          disabled={reviewingId !== null}
                        >
                          <HelpCircle className="w-4 h-4 mr-1" /> Plus d&apos;infos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(req, 'rejected')}
                          disabled={reviewingId !== null || !reviewNotes.trim()}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Ban className="w-4 h-4 mr-1" /> Rejeter
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
