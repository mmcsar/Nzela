'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, Loader2, Package, DollarSign, Truck, TrendingUp } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  available: '#10b981',
  booked: '#3b82f6',
  'in-transit': '#f59e0b',
  completed: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponibles',
  booked: 'Réservés',
  'in-transit': 'En transit',
  completed: 'Terminés',
};

export default function TMSAnalyticsPage() {
  const { isLoading: authLoading, isAuthorized, role, brokerId, companyId } = useRequireRole(['broker', 'company', 'admin']);
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchLoads = useCallback(async () => {
    if (!role) return;
    try {
      if (role === 'broker' && brokerId) {
        const { data } = await supabase.from('loads').select('id, status, price, created_at').eq('broker_id', brokerId).in('status', ['available', 'booked', 'in-transit', 'completed']);
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
        const { data } = await supabase.from('loads').select('id, status, price, created_at').in('id', loadIds);
        setLoads(data || []);
        return;
      }
      if (role === 'admin') {
        const { data } = await supabase.from('loads').select('id, status, price, created_at').in('status', ['available', 'booked', 'in-transit', 'completed']);
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

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    loads.forEach((l) => {
      const s = l.status || 'available';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
      fill: STATUS_COLORS[status] || '#9ca3af',
    }));
  }, [loads]);

  const revenue = useMemo(() => loads.filter((l) => l.status === 'completed').reduce((s, l) => s + Number(l.price || 0), 0), [loads]);

  const byMonth = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    loads.forEach((l) => {
      const d = new Date(l.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { count: 0, revenue: 0 };
      map[key].count += 1;
      if (l.status === 'completed') map[key].revenue += Number(l.price || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, v]) => ({ month, ...v }));
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
          <h1 className="text-xl font-bold text-gray-900">Analytics TMS</h1>
          <p className="text-sm text-gray-500">Statistiques sur vos expéditions et revenus</p>
        </div>
        <Link href="/dashboard/tms" className="text-sm text-primary-600 hover:underline">
          ← Retour TMS
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{loads.length}</div>
                <div className="text-sm text-gray-500">Chargements</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{revenue.toLocaleString('fr-FR')}</div>
                <div className="text-sm text-gray-500">CDF (terminés)</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loads.filter((l) => l.status === 'in-transit' || l.status === 'in_transit').length}
                </div>
                <div className="text-sm text-gray-500">En transit</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loads.length ? Math.round((loads.filter((l) => l.status === 'completed').length / loads.length) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-500">Taux terminés</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Répartition par statut
              </h3>
              {byStatus.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${e.value}`} />
                    <Tooltip formatter={(v: number) => [v, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Chargements et revenus par mois</h3>
              {byMonth.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number, name: string) => [name === 'revenue' ? `${Number(v).toLocaleString()} CDF` : v, name === 'revenue' ? 'Revenus' : 'Chargements']} labelFormatter={(l) => l} />
                    <Bar yAxisId="left" dataKey="count" fill="#0066cc" name="Chargements" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenus (CDF)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
