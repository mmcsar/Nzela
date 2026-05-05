'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, FileText, Truck, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type OverviewResponse = {
  companies: Array<{ id: string; name: string; city?: string; province?: string; status?: string }>;
  selectedCompanyId: string | null;
  stats: { vehicles: number; plans: number; interventions: number; alertsOpen: number; totalCost: number };
  vehicles: any[];
  plans: any[];
  interventions: any[];
  alerts: any[];
  report: { mode: 'view' | 'manual'; rows: any[]; summary: any };
};

export function AdminMaintenanceOverview() {
  const [mode, setMode] = useState<'view' | 'manual'>('view');
  const [companyId, setCompanyId] = useState('');
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (nextCompanyId?: string, nextMode?: 'view' | 'manual') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (nextCompanyId || companyId) params.set('companyId', nextCompanyId || companyId);
      params.set('mode', nextMode || mode);
      const res = await fetch(`/api/admin/maintenance/overview?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur de chargement');
      setData(json);
      if (!companyId && json.selectedCompanyId) setCompanyId(json.selectedCompanyId);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCompany = useMemo(
    () => data?.companies.find((c) => c.id === (companyId || data?.selectedCompanyId)),
    [data, companyId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Supervision maintenance</h1>
          <p className="text-gray-600 mt-1">Vue administrateur sur la flotte, les plans, les interventions et les alertes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={mode === 'view' ? 'primary' : 'outline'} onClick={() => { setMode('view'); void load(companyId, 'view'); }}>
            Vue rapport
          </Button>
          <Button variant={mode === 'manual' ? 'primary' : 'outline'} onClick={() => { setMode('manual'); void load(companyId, 'manual'); }}>
            Mode manuel
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
            <select
              className="w-full px-4 py-2 border rounded-lg"
              value={companyId || data?.selectedCompanyId || ''}
              onChange={(e) => {
                setCompanyId(e.target.value);
                void load(e.target.value, mode);
              }}
            >
              {(data?.companies || []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} {company.city ? `- ${company.city}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[220px] rounded-lg border bg-slate-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Sélection</div>
            <div className="font-semibold text-gray-900">{selectedCompany?.name || '—'}</div>
            <div className="text-sm text-gray-500">{selectedCompany?.city || ''} {selectedCompany?.province ? `• ${selectedCompany.province}` : ''}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Véhicules', value: data?.stats.vehicles ?? 0, icon: Truck, color: 'text-blue-600' },
          { label: 'Plans', value: data?.stats.plans ?? 0, icon: Wrench, color: 'text-primary-600' },
          { label: 'Interventions', value: data?.stats.interventions ?? 0, icon: FileText, color: 'text-slate-700' },
          { label: 'Alertes ouvertes', value: data?.stats.alertsOpen ?? 0, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Coût total', value: Math.round(data?.stats.totalCost ?? 0).toLocaleString(), icon: Building2, color: 'text-rose-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
              <item.icon className={`w-8 h-8 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Véhicules récents</h2>
          {loading ? <p className="text-gray-500">Chargement...</p> : (
            <div className="space-y-3">
              {(data?.vehicles || []).slice(0, 8).map((vehicle) => (
                <div key={vehicle.id} className="border rounded-lg p-3">
                  <div className="font-semibold">{vehicle.registration_number}</div>
                  <div className="text-sm text-gray-600">{vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}</div>
                  <div className="text-sm text-gray-500">Km: {(vehicle.current_mileage_km || 0).toLocaleString()} • {vehicle.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Alertes ouvertes</h2>
          {loading ? <p className="text-gray-500">Chargement...</p> : data?.alerts?.length ? (
            <div className="space-y-3">
              {data.alerts.slice(0, 8).map((alert) => (
                <div key={alert.id} className="border rounded-lg p-3">
                  <div className="font-medium text-gray-900">{alert.vehicle?.registration_number || 'Véhicule'}</div>
                  <div className="text-sm text-gray-600">{alert.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{alert.alert_type} • {alert.alert_level}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">Aucune alerte ouverte.</p>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-semibold mb-3">Dernières interventions</h2>
        {loading ? <p className="text-gray-500">Chargement...</p> : data?.interventions?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-500 border-b">
                <tr>
                  <th className="py-2 pr-4">Véhicule</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Prestataire</th>
                  <th className="py-2 pr-4">Coût total</th>
                </tr>
              </thead>
              <tbody>
                {data.interventions.slice(0, 12).map((row) => {
                  const total = Number(row.cost_parts || 0) + Number(row.cost_labor || 0) + Number(row.cost_other || 0);
                  return (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{row.vehicle?.registration_number || '-'}</td>
                      <td className="py-2 pr-4">{row.maintenance_type?.label_fr || '-'}</td>
                      <td className="py-2 pr-4">{row.service_at ? new Date(row.service_at).toLocaleDateString('fr-CD') : '-'}</td>
                      <td className="py-2 pr-4">{row.status}</td>
                      <td className="py-2 pr-4">{row.provider_name || '-'}</td>
                      <td className="py-2 pr-4">{Math.round(total).toLocaleString()} {row.currency || 'USD'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-500">Aucune intervention.</p>}
      </div>
    </div>
  );
}
