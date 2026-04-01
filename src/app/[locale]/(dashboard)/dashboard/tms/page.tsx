'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  BarChart3,
  ChevronRight,
  Satellite,
  LayoutGrid,
  RefreshCw,
  Loader2,
  FileText,
  TrendingUp,
  Calendar,
  Users,
  Calculator,
  Fuel,
} from 'lucide-react';
import { cargoTypeFr } from '@/lib/utils/translate-fr';

const WORKFLOW_LABELS: Record<string, string> = {
  available: 'Disponible',
  bid_accepted: 'Réservé',
  dispatched: 'Dispatché',
  en_route_pickup: 'En route (pickup)',
  at_pickup: 'Au chargement',
  loaded: 'Chargé',
  in_transit: 'En transit',
  at_delivery: 'À destination',
  delivered: 'Livré',
  pod_uploaded: 'POD soumis',
  completed: 'Terminé',
  cancelled: 'Annulé',
  disputed: 'Litige',
};

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  booked: 'bg-blue-100 text-blue-700',
  'in-transit': 'bg-amber-100 text-amber-700',
  in_transit: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-700',
};

function parseLocation(loc: unknown): { city: string; province: string } {
  if (!loc) return { city: '—', province: '' };
  if (typeof loc === 'string') {
    try {
      const o = JSON.parse(loc);
      return { city: o?.city ?? '—', province: o?.province ?? '' };
    } catch {
      return { city: loc, province: '' };
    }
  }
  const o = loc as { city?: string; province?: string };
  return { city: o?.city ?? '—', province: o?.province ?? '' };
}

interface LoadRow {
  id: string;
  origin: unknown;
  destination: unknown;
  status: string;
  workflow_step?: string | null;
  cargo_type?: string;
  weight?: number;
  distance?: number;
  price?: number;
  pickup_date?: string;
  created_at?: string;
  broker?: { name?: string } | null;
}

export default function TMSPage() {
  const te = useTranslations('estimators');
  const router = useRouter();
  const { isLoading: authLoading, isAuthorized, role, brokerId, companyId } = useRequireRole(['broker', 'company', 'admin']);
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchLoads = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    setError(null);
    try {
      if (role === 'broker' && brokerId) {
        const { data, error: e } = await supabase
          .from('loads')
          .select('id, origin, destination, status, workflow_step, cargo_type, weight, distance, price, pickup_date, created_at, broker:brokers(name)')
          .eq('broker_id', brokerId)
          .in('status', ['available', 'booked', 'in-transit', 'completed'])
          .order('updated_at', { ascending: false })
          .limit(100);
        if (e) throw e;
        setLoads((data as LoadRow[]) || []);
        return;
      }

      if (role === 'company' && companyId) {
        const { data: trucks } = await supabase
          .from('trucks')
          .select('id')
          .eq('company_id', companyId);
        const truckIds = (trucks || []).map((t) => t.id);
        if (truckIds.length === 0) {
          setLoads([]);
          return;
        }
        const { data: bols } = await supabase
          .from('bols')
          .select('load_id')
          .in('truck_id', truckIds);
        const loadIds = [...new Set((bols || []).map((b) => b.load_id))];
        if (loadIds.length === 0) {
          setLoads([]);
          return;
        }
        const { data, error: e } = await supabase
          .from('loads')
          .select('id, origin, destination, status, workflow_step, cargo_type, weight, distance, price, pickup_date, created_at, broker:brokers(name)')
          .in('id', loadIds)
          .order('updated_at', { ascending: false })
          .limit(100);
        if (e) throw e;
        setLoads((data as LoadRow[]) || []);
        return;
      }

      if (role === 'admin') {
        const { data, error: e } = await supabase
          .from('loads')
          .select('id, origin, destination, status, workflow_step, cargo_type, weight, distance, price, pickup_date, created_at, broker:brokers(name)')
          .in('status', ['available', 'booked', 'in-transit', 'completed'])
          .order('updated_at', { ascending: false })
          .limit(100);
        if (e) throw e;
        setLoads((data as LoadRow[]) || []);
        return;
      }

      setLoads([]);
    } catch (err) {
      console.error('TMS fetch error:', err);
      setError(err instanceof Error ? err.message : 'Erreur chargement');
      setLoads([]);
    } finally {
      setIsLoading(false);
    }
  }, [role, brokerId, companyId, supabase]);

  useEffect(() => {
    if (isAuthorized) fetchLoads();
  }, [isAuthorized, fetchLoads]);

  const kpis = {
    available: loads.filter((l) => l.status === 'available').length,
    booked: loads.filter((l) => l.status === 'booked').length,
    inTransit: loads.filter((l) => l.status === 'in-transit' || l.status === 'in_transit').length,
    completed: loads.filter((l) => l.status === 'completed').length,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">TMS — Gestion des expéditions</h1>
            <p className="text-sm text-gray-500">Vue d&apos;ensemble et suivi de vos chargements</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/tms/couts">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-sm">
              <Calculator className="w-4 h-4" /> {te('tmsBtnRatesFuel')}
            </span>
          </Link>
          <Link href="/dashboard/tms/couts?tab=fuel">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-900 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200">
              <Fuel className="w-4 h-4" /> {te('tmsBtnFuel')}
            </span>
          </Link>
          <Link href="/dashboard/tms/pro">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800">
              <LayoutGrid className="w-4 h-4" /> Vue détaillée
            </span>
          </Link>
          <Link href="/dashboard/tms/facturation">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <FileText className="w-4 h-4" /> Facturation
            </span>
          </Link>
          <Link href="/dashboard/tms/analytics">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <TrendingUp className="w-4 h-4" /> Analytics
            </span>
          </Link>
          <Link href="/dashboard/tms/planification">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Calendar className="w-4 h-4" /> Planification
            </span>
          </Link>
          <Link href="/dashboard/tms/portail">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Users className="w-4 h-4" /> Portail
            </span>
          </Link>
          <Link href="/dashboard/tracking">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Satellite className="w-4 h-4" /> Tracking GPS
            </span>
          </Link>
          <Link href="/dashboard/loads/board">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100">
              <Package className="w-4 h-4" /> Load Board
            </span>
          </Link>
          <button
            type="button"
            onClick={() => fetchLoads()}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Disponibles', value: kpis.available, icon: Package, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Réservés', value: kpis.booked, icon: Clock, color: 'bg-blue-50 text-blue-600' },
          { label: 'En transit', value: kpis.inTransit, icon: Truck, color: 'bg-amber-50 text-amber-600' },
          { label: 'Terminés', value: kpis.completed, icon: BarChart3, color: 'bg-gray-100 text-gray-600' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${k.color}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{k.value}</div>
              <div className="text-sm text-gray-500">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Liste des chargements */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">Expéditions ({loads.length})</h2>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : loads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">Aucune expédition à afficher</p>
            <p className="text-xs mt-1">
              {role === 'broker' && 'Publiez des chargements ou réservez-en depuis le Load Board.'}
              {role === 'company' && 'Réservez des chargements depuis le Load Board pour les voir ici.'}
              {role === 'admin' && 'Aucun chargement actif.'}
            </p>
            <Link href="/dashboard/loads/board" className="inline-block mt-4 text-sm font-medium text-primary-600 hover:underline">
              Voir le Load Board
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {loads.map((load) => {
              const origin = parseLocation(load.origin);
              const dest = parseLocation(load.destination);
              const step = load.workflow_step || (load.status === 'booked' ? 'bid_accepted' : load.status === 'in-transit' || load.status === 'in_transit' ? 'in_transit' : load.status);
              const stepLabel = WORKFLOW_LABELS[step] || step;
              const statusColor = STATUS_COLORS[load.status] || 'bg-gray-100 text-gray-600';

              return (
                <button
                  key={load.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/loads/${load.id}`)}
                  className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {origin.city} → {dest.city}
                      </span>
                    </div>
                    <div className="hidden sm:block text-xs text-gray-500 shrink-0">
                      {load.cargo_type ? cargoTypeFr(load.cargo_type) : '—'} {load.weight ? `· ${load.weight} kg` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                      {load.status}
                    </span>
                    <span className="text-xs text-gray-400 hidden md:inline">{stepLabel}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Ouvrez un chargement pour mettre à jour le workflow (dispatché, en route, chargé, livré, etc.) et gérer les documents.
      </p>
    </div>
  );
}
