'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Handshake, RefreshCw, ArrowRight, Check, X, CornerDownRight, Clock, DollarSign, Package } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';

interface Offer {
  id: string;
  load_id: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  parent_offer_id: string | null;
  expires_at: string;
  created_at: string;
  from_user: { id: string; full_name: string; email: string; role: string } | null;
  to_user: { id: string; full_name: string; email: string; role: string } | null;
  load: { id: string; origin: any; destination: any; price: number; trailer_type: string; weight: number } | null;
}

const STATUS_CFG: Record<string, { label: string; bg: string }> = {
  pending: { label: 'En attente', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Acceptee', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Refusee', bg: 'bg-red-50 text-red-600 border-red-200' },
  countered: { label: 'Contre-offre', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  expired: { label: 'Expiree', bg: 'bg-gray-50 text-gray-500 border-gray-200' },
  cancelled: { label: 'Annulee', bg: 'bg-gray-50 text-gray-500 border-gray-200' },
};

export default function OffersPage() {
  const { isLoading: authLoading } = useRequireRole(['broker', 'company', 'admin']);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'sent' | 'received'>('all');
  const [counterAmount, setCounterAmount] = useState<Record<string, string>>({});
  const [counterMsg, setCounterMsg] = useState<Record<string, string>>({});
  const [showCounter, setShowCounter] = useState<string | null>(null);
  const [userId, setUserId] = useState('');

  const fetchUserId = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUserId(data?.user?.id || '');
    } catch { /* ignore */ }
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/offers?direction=${tab}`);
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [tab]);

  useEffect(() => { fetchOffers(); fetchUserId(); }, [tab, fetchOffers, fetchUserId]);

  const handleAction = async (offerId: string, action: string) => {
    await fetch('/api/offers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: offerId, action }),
    });
    fetchOffers();
  };

  const sendCounter = async (offer: Offer) => {
    const amt = Number(counterAmount[offer.id]);
    if (!amt || amt <= 0) return;

    await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        load_id: offer.load_id,
        to_user_id: offer.from_user?.id,
        amount: amt,
        currency: offer.currency,
        message: counterMsg[offer.id] || null,
        parent_offer_id: offer.id,
      }),
    });
    setShowCounter(null);
    fetchOffers();
  };

  const parseCity = (jsonField: any) => {
    try {
      const obj = typeof jsonField === 'string' ? JSON.parse(jsonField) : jsonField;
      return obj?.city || 'N/A';
    } catch { return 'N/A'; }
  };

  if (authLoading) return <div className="flex justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-primary-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Handshake className="w-6 h-6 text-primary-600" />
            Negociations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerez vos offres et contre-offres de prix</p>
        </div>
        <button onClick={fetchOffers} className="p-2 border rounded-lg hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {([['all', 'Toutes'], ['sent', 'Envoyees'], ['received', 'Recues']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${tab === key ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Handshake className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Aucune offre</h3>
          <p className="text-sm text-gray-500 mt-2">Les offres et contre-offres apparaitront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => {
            const statusCfg = STATUS_CFG[offer.status] || STATUS_CFG.pending;
            const isSent = offer.from_user?.id === userId;
            const isReceived = offer.to_user?.id === userId;

            return (
              <div key={offer.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusCfg.bg}`}>{statusCfg.label}</span>
                    {offer.parent_offer_id && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                        <CornerDownRight className="w-3 h-3" /> Contre-offre
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{new Date(offer.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-gray-900">{offer.amount.toLocaleString()} <span className="text-sm font-normal text-gray-500">{offer.currency}</span></div>
                  </div>
                </div>

                {/* Load info */}
                {offer.load && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-700">
                      {parseCity(offer.load.origin)} <ArrowRight className="w-3 h-3 inline mx-1" /> {parseCity(offer.load.destination)}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">Prix initial: {offer.load.price?.toLocaleString()} CDF</span>
                  </div>
                )}

                {/* De / Vers */}
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <span className={`font-semibold ${isSent ? 'text-primary-600' : ''}`}>
                    {isSent ? 'Vous' : offer.from_user?.full_name || offer.from_user?.email || '—'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className={`font-semibold ${isReceived ? 'text-primary-600' : ''}`}>
                    {isReceived ? 'Vous' : offer.to_user?.full_name || offer.to_user?.email || '—'}
                  </span>
                </div>

                {offer.message && (
                  <p className="text-xs text-gray-500 italic mb-3 bg-gray-50 p-2 rounded">&quot;{offer.message}&quot;</p>
                )}

                {/* Expiration */}
                {offer.status === 'pending' && offer.expires_at && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 mb-3">
                    <Clock className="w-3 h-3" />
                    Expire le {new Date(offer.expires_at).toLocaleDateString('fr-FR')} a {new Date(offer.expires_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                {/* Actions */}
                {offer.status === 'pending' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {isReceived && (
                      <>
                        <Button size="sm" onClick={() => handleAction(offer.id, 'accepted')} className="bg-emerald-600 hover:bg-emerald-700">
                          <Check className="w-3.5 h-3.5 mr-1" /> Accepter
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowCounter(showCounter === offer.id ? null : offer.id)}>
                          <DollarSign className="w-3.5 h-3.5 mr-1" /> Contre-offre
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAction(offer.id, 'rejected')} className="text-red-600 border-red-200 hover:bg-red-50">
                          <X className="w-3.5 h-3.5 mr-1" /> Refuser
                        </Button>
                      </>
                    )}
                    {isSent && (
                      <Button size="sm" variant="outline" onClick={() => handleAction(offer.id, 'cancelled')} className="text-gray-600">
                        <X className="w-3.5 h-3.5 mr-1" /> Annuler
                      </Button>
                    )}
                  </div>
                )}

                {/* Contre-offre form */}
                {showCounter === offer.id && (
                  <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
                    <div className="flex gap-2">
                      <input type="number" placeholder="Montant (CDF)"
                        value={counterAmount[offer.id] || ''} onChange={e => setCounterAmount({...counterAmount, [offer.id]: e.target.value})}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
                      <Button size="sm" onClick={() => sendCounter(offer)}>Envoyer</Button>
                    </div>
                    <input type="text" placeholder="Message (optionnel)"
                      value={counterMsg[offer.id] || ''} onChange={e => setCounterMsg({...counterMsg, [offer.id]: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/40 outline-none" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
