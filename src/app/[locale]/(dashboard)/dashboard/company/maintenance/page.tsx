'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Wrench, Plus, FileText, AlertTriangle } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';

type Vehicle = {
  id: string;
  registration_number: string;
  brand: string;
  model: string;
  current_mileage_km: number;
  status: string;
};

type Plan = {
  id: string;
  vehicle_id: string;
  maintenance_type_id: string;
  is_enabled: boolean;
  interval_km: number | null;
  interval_days: number | null;
  next_due_at: string | null;
  next_due_mileage_km: number | null;
  maintenance_type?: { label_fr?: string; code?: string };
  vehicle?: { registration_number?: string };
};

type Intervention = {
  id: string;
  vehicle_id: string;
  status: string;
  service_at: string;
  mileage_km: number | null;
  cost_parts: number;
  cost_labor: number;
  cost_other: number;
  provider_name: string | null;
  maintenance_type?: { label_fr?: string };
  vehicle?: { registration_number?: string };
};

export default function CompanyMaintenancePage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['company', 'admin']);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [reportMode, setReportMode] = useState<'view' | 'manual'>('view');
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [newPlan, setNewPlan] = useState({
    vehicleId: '',
    maintenanceTypeId: '',
    intervalKm: '',
    intervalDays: '',
  });

  const [newIntervention, setNewIntervention] = useState({
    vehicleId: '',
    maintenanceTypeId: '',
    planId: '',
    status: 'completed',
    interventionKind: 'preventive',
    mileageKm: '',
    providerName: '',
    costParts: '',
    costLabor: '',
    costOther: '',
    notes: '',
  });

  const refreshAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [vehiclesRes, typesRes, plansRes, interventionsRes, reportRes] = await Promise.all([
        fetch('/api/company/vehicles?limit=100'),
        fetch('/api/company/maintenance/types'),
        fetch('/api/company/maintenance/plans?limit=100'),
        fetch('/api/company/maintenance/interventions?limit=100'),
        fetch(`/api/company/maintenance/report?mode=${reportMode}`),
      ]);

      const [vehiclesData, typesData, plansData, interventionsData, reportData] = await Promise.all([
        vehiclesRes.json(),
        typesRes.json(),
        plansRes.json(),
        interventionsRes.json(),
        reportRes.json(),
      ]);

      setVehicles(vehiclesData.data || []);
      setTypes(typesData.types || []);
      setPlans(plansData.data || []);
      setInterventions(interventionsData.data || []);
      setReportSummary(reportData.summary || null);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, reportMode]);

  const totalInterventionCost = useMemo(
    () =>
      interventions.reduce(
        (acc, i) => acc + Number(i.cost_parts || 0) + Number(i.cost_labor || 0) + Number(i.cost_other || 0),
        0
      ),
    [interventions]
  );

  const createPlan = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/company/maintenance/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: newPlan.vehicleId,
          maintenanceTypeId: newPlan.maintenanceTypeId,
          intervalKm: newPlan.intervalKm ? Number(newPlan.intervalKm) : null,
          intervalDays: newPlan.intervalDays ? Number(newPlan.intervalDays) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création plan');
      setNewPlan({ vehicleId: '', maintenanceTypeId: '', intervalKm: '', intervalDays: '' });
      await refreshAll();
    } catch (e: any) {
      setError(e.message || 'Erreur création plan');
    } finally {
      setSaving(false);
    }
  };

  const createIntervention = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/company/maintenance/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: newIntervention.vehicleId,
          maintenanceTypeId: newIntervention.maintenanceTypeId || null,
          planId: newIntervention.planId || null,
          interventionKind: newIntervention.interventionKind,
          status: newIntervention.status,
          mileageKm: newIntervention.mileageKm ? Number(newIntervention.mileageKm) : null,
          providerName: newIntervention.providerName || null,
          costParts: newIntervention.costParts ? Number(newIntervention.costParts) : 0,
          costLabor: newIntervention.costLabor ? Number(newIntervention.costLabor) : 0,
          costOther: newIntervention.costOther ? Number(newIntervention.costOther) : 0,
          notes: newIntervention.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création intervention');
      setNewIntervention({
        vehicleId: '',
        maintenanceTypeId: '',
        planId: '',
        status: 'completed',
        interventionKind: 'preventive',
        mileageKm: '',
        providerName: '',
        costParts: '',
        costLabor: '',
        costOther: '',
        notes: '',
      });
      await refreshAll();
    } catch (e: any) {
      setError(e.message || 'Erreur création intervention');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthorized) {
    return <div className="py-16 text-center text-gray-500">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary-600" />
            Maintenance flotte
          </h1>
          <p className="text-gray-500">Plans, interventions, alertes et rapport (vue + manuel).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/company/vehicles">
            <Button variant="outline">Véhicules</Button>
          </Link>
          <Button variant={reportMode === 'view' ? 'primary' : 'outline'} onClick={() => setReportMode('view')}>
            Vue rapport
          </Button>
          <Button variant={reportMode === 'manual' ? 'primary' : 'outline'} onClick={() => setReportMode('manual')}>
            Mode manuel
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Véhicules</p>
          <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Plans actifs</p>
          <p className="text-2xl font-bold text-primary-700">{plans.filter((p) => p.is_enabled).length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Interventions</p>
          <p className="text-2xl font-bold text-gray-900">{interventions.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Coût total</p>
          <p className="text-2xl font-bold text-amber-700">{Math.round(totalInterventionCost).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau plan
          </h2>
          <select className="w-full border rounded-lg px-3 py-2" value={newPlan.vehicleId} onChange={(e) => setNewPlan((s) => ({ ...s, vehicleId: e.target.value }))}>
            <option value="">Véhicule</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.registration_number} - {v.brand} {v.model}</option>
            ))}
          </select>
          <select className="w-full border rounded-lg px-3 py-2" value={newPlan.maintenanceTypeId} onChange={(e) => setNewPlan((s) => ({ ...s, maintenanceTypeId: e.target.value }))}>
            <option value="">Type d&apos;entretien</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.label_fr}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded-lg px-3 py-2" placeholder="Intervalle km" value={newPlan.intervalKm} onChange={(e) => setNewPlan((s) => ({ ...s, intervalKm: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2" placeholder="Intervalle jours" value={newPlan.intervalDays} onChange={(e) => setNewPlan((s) => ({ ...s, intervalDays: e.target.value }))} />
          </div>
          <Button onClick={createPlan} isLoading={saving}>Créer plan</Button>
        </div>

        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Intervention manuelle
          </h2>
          <select className="w-full border rounded-lg px-3 py-2" value={newIntervention.vehicleId} onChange={(e) => setNewIntervention((s) => ({ ...s, vehicleId: e.target.value }))}>
            <option value="">Véhicule</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.registration_number}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded-lg px-3 py-2" placeholder="Kilométrage" value={newIntervention.mileageKm} onChange={(e) => setNewIntervention((s) => ({ ...s, mileageKm: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2" placeholder="Prestataire" value={newIntervention.providerName} onChange={(e) => setNewIntervention((s) => ({ ...s, providerName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input className="border rounded-lg px-3 py-2" placeholder="Coût pièces" value={newIntervention.costParts} onChange={(e) => setNewIntervention((s) => ({ ...s, costParts: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2" placeholder="Main d&apos;oeuvre" value={newIntervention.costLabor} onChange={(e) => setNewIntervention((s) => ({ ...s, costLabor: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2" placeholder="Autres" value={newIntervention.costOther} onChange={(e) => setNewIntervention((s) => ({ ...s, costOther: e.target.value }))} />
          </div>
          <textarea className="w-full border rounded-lg px-3 py-2" rows={2} placeholder="Notes" value={newIntervention.notes} onChange={(e) => setNewIntervention((s) => ({ ...s, notes: e.target.value }))} />
          <Button onClick={createIntervention} isLoading={saving}>Enregistrer intervention</Button>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Plans récents
        </h2>
        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : plans.length === 0 ? (
          <p className="text-gray-500">Aucun plan pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Véhicule</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Échéance km</th>
                  <th className="py-2">Échéance date</th>
                </tr>
              </thead>
              <tbody>
                {plans.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{p.vehicle?.registration_number || '-'}</td>
                    <td className="py-2">{p.maintenance_type?.label_fr || p.maintenance_type?.code || '-'}</td>
                    <td className="py-2">{p.next_due_mileage_km?.toLocaleString() || '-'}</td>
                    <td className="py-2">{p.next_due_at ? new Date(p.next_due_at).toLocaleDateString('fr-CD') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-2">Rapport maintenance ({reportMode})</h2>
        <p className="text-sm text-gray-600">
          Interventions: <strong>{reportSummary?.totalInterventions ?? 0}</strong> | Coût total: <strong>{Math.round(reportSummary?.totalCost ?? 0).toLocaleString()}</strong>
        </p>
      </div>
    </div>
  );
}
