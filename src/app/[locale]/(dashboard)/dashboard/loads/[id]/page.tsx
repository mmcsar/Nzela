'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { useRequireRole } from '@/hooks/useRequireRole';
import { LiveTracker } from '@/components/tracking/LiveTracker';
import { ShipmentTimeline } from '@/components/shipment/ShipmentTimeline';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { ChatPanel } from '@/components/messaging/ChatPanel';
import { ReviewForm } from '@/components/ratings/ReviewForm';
import { RatingSummary } from '@/components/ratings/RatingSummary';
import {
  ArrowLeft, MapPin, Package, Truck, DollarSign,
  Calendar, Weight, Route, FileText, MessageSquare,
  Star, Navigation, Clock
} from 'lucide-react';
import { cargoTypeFr } from '@/lib/utils/translate-fr';

type Tab = 'tracking' | 'workflow' | 'documents' | 'messages' | 'rating';

export default function LoadDetailPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);
  const params = useParams();
  const loadId = params.id as string;
  const supabase = createClient();

  const [load, setLoad] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tracking');

  const fetchLoad = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('loads')
        .select('*, broker:brokers(*)')
        .eq('id', loadId)
        .single();

      if (error) throw error;
      setLoad(data);
    } catch (error) {
      console.error('Error fetching load:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadId, supabase]);

  useEffect(() => {
    fetchLoad();
  }, [fetchLoad]);

  const parseLocation = (loc: any) => {
    if (!loc) return { city: 'N/A', province: '', address: '' };
    if (typeof loc === 'string') {
      try { return JSON.parse(loc); } catch { return { city: loc, province: '', address: '' }; }
    }
    return loc;
  };

  if (authLoading || !isAuthorized || isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700">Chargement non trouvé</h3>
        <Link href="/dashboard/loads/board" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const origin = parseLocation(load.origin);
  const dest = parseLocation(load.destination);

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    booked: 'bg-blue-100 text-blue-700',
    'in-transit': 'bg-amber-100 text-amber-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    booked: 'Réservé',
    'in-transit': 'En transit',
    completed: 'Terminé',
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'tracking', label: 'Tracking', icon: Navigation },
    { id: 'workflow', label: 'Workflow', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'rating', label: 'Avis', icon: Star },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/loads/board" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </Link>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {load.cargo_type || 'Chargement'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[load.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabels[load.status] || load.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">ID: {load.id.substring(0, 8).toUpperCase()}</p>
            </div>
            {load.price > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {load.price?.toLocaleString()} CDF
                </div>
                {load.price_per_km > 0 && (
                  <div className="text-xs text-gray-500">{load.price_per_km?.toLocaleString()} CDF/km</div>
                )}
              </div>
            )}
          </div>

          {/* Route */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <div>
                <div className="text-sm font-medium text-gray-900">{origin.city}</div>
                <div className="text-xs text-gray-500">{origin.province}</div>
              </div>
            </div>
            <div className="flex-shrink-0 px-3">
              <Route className="w-5 h-5 text-gray-300" />
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end text-right">
              <div>
                <div className="text-sm font-medium text-gray-900">{dest.city}</div>
                <div className="text-xs text-gray-500">{dest.province}</div>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
          </div>

          {/* Détails rapides */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { icon: Route, label: 'Distance', value: load.distance ? `${load.distance} km` : 'N/A' },
              { icon: Clock, label: 'Durée', value: load.duration || 'N/A' },
              { icon: Weight, label: 'Poids', value: load.weight ? `${load.weight.toLocaleString()} kg` : 'N/A' },
              { icon: Truck, label: 'Remorque', value: load.trailer_type || 'N/A' },
              { icon: Package, label: 'Type marchandise', value: load.cargo_type ? cargoTypeFr(load.cargo_type) : 'N/A' },
              { icon: Calendar, label: 'Pickup', value: load.pickup_date ? new Date(load.pickup_date).toLocaleDateString('fr-CD') : 'N/A' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <item.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500">{item.label}</div>
                  <div className="text-xs font-medium text-gray-900">{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Live tracker compact si en transit */}
          {(load.status === 'in-transit' || load.status === 'in_transit') && (
            <div className="mt-4">
              <LiveTracker loadId={loadId} compact />
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex overflow-x-auto border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'tracking' && (
            <LiveTracker loadId={loadId} />
          )}

          {activeTab === 'workflow' && (
            <ShipmentTimeline
              loadId={loadId}
              onStatusChange={() => fetchLoad()}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentManager loadId={loadId} />
          )}

          {activeTab === 'messages' && (
            <ChatPanel />
          )}

          {activeTab === 'rating' && (
            <div className="space-y-6">
              {load.broker && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Avis sur le courtier</h4>
                  <RatingSummary entityId={load.broker_id} entityType="broker" />
                </div>
              )}

              {load.status === 'completed' && (
                <div className="border-t pt-6">
                  <ReviewForm
                    loadId={loadId}
                    revieweeId={load.broker_id || ''}
                    revieweeType="broker"
                    revieweeName={load.broker?.name || 'Courtier'}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
