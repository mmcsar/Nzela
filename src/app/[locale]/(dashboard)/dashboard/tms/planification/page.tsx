'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';
import { Calendar, MapPin, Package, Loader2, ChevronRight } from 'lucide-react';
import { cargoTypeFr } from '@/lib/utils/translate-fr';

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

export default function TMSPlanificationPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthorized, role, brokerId, companyId } = useRequireRole(['broker', 'company', 'admin']);
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchLoads = useCallback(async () => {
    if (!role) return;
    try {
      if (role === 'broker' && brokerId) {
        const { data } = await supabase
          .from('loads')
          .select('id, origin, destination, status, cargo_type, weight, pickup_date, delivery_date')
          .eq('broker_id', brokerId)
          .in('status', ['available', 'booked', 'in-transit', 'completed'])
          .order('pickup_date', { ascending: true })
          .limit(150);
        setLoads(data || []);
        return;
      }
      if (role === 'company' && companyId) {
        const { data: trucks } = await supabase.from('trucks').select('id').eq('company_id', companyId);
        const ids = (trucks || []).map((t) => t.id);
        if (ids.length === 0) {
          setLoads([]);
          return;
        }
        const { data: bols } = await supabase.from('bols').select('load_id').in('truck_id', ids);
        const loadIds = [...new Set((bols || []).map((b) => b.load_id))];
        if (loadIds.length === 0) {
          setLoads([]);
          return;
        }
        const { data } = await supabase
          .from('loads')
          .select('id, origin, destination, status, cargo_type, weight, pickup_date, delivery_date')
          .in('id', loadIds)
          .order('pickup_date', { ascending: true })
          .limit(150);
        setLoads(data || []);
        return;
      }
      if (role === 'admin') {
        const { data } = await supabase
          .from('loads')
          .select('id, origin, destination, status, cargo_type, weight, pickup_date, delivery_date')
          .in('status', ['available', 'booked', 'in-transit', 'completed'])
          .order('pickup_date', { ascending: true })
          .limit(150);
        setLoads(data || []);
        return;
      }
      setLoads([]);
    } catch {
      setLoads([]);
    } finally {
      setLoading(false);
    }
  }, [role, brokerId, companyId, supabase]);

  useEffect(() => {
    if (isAuthorized) fetchLoads();
  }, [isAuthorized, fetchLoads]);

  const byDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    loads.forEach((l) => {
      const d = l.pickup_date ? new Date(l.pickup_date).toISOString().slice(0, 10) : 'sans-date';
      if (!map[d]) map[d] = [];
      map[d].push(l);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({ date, list }));
  }, [loads]);

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
          <h1 className="text-xl font-bold text-gray-900">Planification tournées</h1>
          <p className="text-sm text-gray-500">Vue des chargements par date de pickup</p>
        </div>
        <Link href="/dashboard/tms" className="text-sm text-primary-600 hover:underline">
          ← Retour TMS
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : byDate.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">Aucun chargement à planifier</p>
          <Link href="/dashboard/loads/board" className="inline-block mt-4 text-sm text-primary-600 hover:underline">
            Voir le Load Board
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {byDate.map(({ date, list }) => (
            <div key={date} className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600" />
                <span className="font-semibold text-gray-800">
                  {date === 'sans-date' ? 'Sans date' : new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-sm text-gray-500">({list.length} chargement{list.length > 1 ? 's' : ''})</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {list.map((load) => (
                  <li key={load.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/loads/${load.id}`)}
                      className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 flex-1">
                        {parseLocation(load.origin)} → {parseLocation(load.destination)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {load.cargo_type ? cargoTypeFr(load.cargo_type) : '—'} {load.weight ? `· ${load.weight} kg` : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        load.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                        load.status === 'in-transit' || load.status === 'in_transit' ? 'bg-amber-100 text-amber-700' :
                        load.status === 'booked' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {load.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
