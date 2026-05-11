'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';
import { MapPin, Package, ChevronRight, Loader2, Users, FileText } from 'lucide-react';
import { cargoTypeFr } from '@/lib/utils/translate-fr';
import { formatLoadLocationLine } from '@/lib/utils/load-location';

function parseLocation(loc: unknown): string {
  return formatLoadLocationLine(loc);
}

export default function TMSPortailPage() {
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
          .select('id, origin, destination, status, cargo_type, broker:brokers(name)')
          .eq('broker_id', brokerId)
          .in('status', ['available', 'booked', 'in-transit', 'completed'])
          .order('updated_at', { ascending: false })
          .limit(100);
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
          .select('id, origin, destination, status, cargo_type, broker:brokers(name)')
          .in('id', loadIds)
          .order('updated_at', { ascending: false })
          .limit(100);
        setLoads(data || []);
        return;
      }
      if (role === 'admin') {
        const { data } = await supabase
          .from('loads')
          .select('id, origin, destination, status, cargo_type, broker:brokers(name)')
          .in('status', ['available', 'booked', 'in-transit', 'completed'])
          .order('updated_at', { ascending: false })
          .limit(100);
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
          <h1 className="text-xl font-bold text-gray-900">Portail client / partenaire</h1>
          <p className="text-sm text-gray-500">Vue simplifiée de vos expéditions pour partage avec clients ou sous-traitants</p>
        </div>
        <Link href="/dashboard/tms" className="text-sm text-primary-600 hover:underline">
          ← Retour TMS
        </Link>
      </div>

      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-start gap-3">
        <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-primary-800">
          <p className="font-medium mb-1">Accès partenaire</p>
          <p className="text-primary-700">
            Les comptes &quot;client&quot; ou &quot;partenaire&quot; pourront à terme accéder à cette vue pour suivre uniquement les chargements qui leur sont partagés. Pour l&apos;instant, vous voyez ici la même liste que dans le TMS.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-600" />
          <h2 className="text-sm font-bold text-gray-700">Expéditions visibles ({loads.length})</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : loads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Aucune expédition</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {loads.map((load) => (
              <li key={load.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/loads/${load.id}`)}
                  className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-gray-50"
                >
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 flex-1">
                    {parseLocation(load.origin)} → {parseLocation(load.destination)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {load.cargo_type ? cargoTypeFr(load.cargo_type) : '—'}
                  </span>
                  {load.broker?.name && (
                    <span className="text-xs text-gray-400 hidden sm:block">Courtier: {load.broker.name}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    load.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                    load.status === 'in-transit' || load.status === 'in_transit' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {load.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
