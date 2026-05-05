import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: adminData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (adminData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin requis' }, { status: 403 });
    }

    const db = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const mode = searchParams.get('mode') === 'manual' ? 'manual' : 'view';

    const companiesQuery = db
      .from('companies')
      .select('id, name, city, province, status')
      .order('name', { ascending: true });

    const [companiesRes] = await Promise.all([companiesQuery]);
    if (companiesRes.error) throw companiesRes.error;

    const companies = companiesRes.data || [];
    const selectedCompanyId = companyId || companies[0]?.id || null;

    if (!selectedCompanyId) {
      return NextResponse.json({
        companies: [],
        selectedCompanyId: null,
        stats: { vehicles: 0, plans: 0, interventions: 0, alertsOpen: 0, totalCost: 0 },
        vehicles: [],
        plans: [],
        interventions: [],
        alerts: [],
        report: { mode, rows: [], summary: { totalInterventions: 0, totalCost: 0 } },
      });
    }

    const [
      vehiclesRes,
      plansRes,
      interventionsRes,
      alertsRes,
      reportViewRes,
      reportManualRes,
    ] = await Promise.all([
      db.from('company_vehicles')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false })
        .limit(100),
      db.from('vehicle_maintenance_plans')
        .select('*, vehicle:company_vehicles(id, registration_number, brand, model, company_id), maintenance_type:maintenance_types(id, code, label_fr, label_en)')
        .order('created_at', { ascending: false })
        .limit(100),
      db.from('vehicle_maintenance_interventions')
        .select('*, vehicle:company_vehicles(id, registration_number, brand, model, company_id), maintenance_type:maintenance_types(id, code, label_fr, label_en)')
        .order('service_at', { ascending: false })
        .limit(100),
      db.from('vehicle_maintenance_alerts')
        .select('*, vehicle:company_vehicles(id, registration_number, company_id)')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(100),
      db.from('v_company_maintenance_report')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('service_at', { ascending: false })
        .limit(200),
      db.from('vehicle_maintenance_interventions')
        .select('id, vehicle_id, service_at, intervention_kind, status, mileage_km, cost_parts, cost_labor, cost_other, currency, provider_name, parts_changed, notes, vehicle:company_vehicles(id, registration_number, brand, model, company_id), maintenance_type:maintenance_types(code, label_fr, label_en)')
        .order('service_at', { ascending: false })
        .limit(200),
    ]);

    for (const res of [vehiclesRes, plansRes, interventionsRes, alertsRes, reportViewRes, reportManualRes]) {
      if (res.error) throw res.error;
    }

    const vehicles = vehiclesRes.data || [];
    const plans = (plansRes.data || []).filter((row: any) => row.vehicle?.company_id === selectedCompanyId);
    const interventions = (interventionsRes.data || []).filter((row: any) => row.vehicle?.company_id === selectedCompanyId);
    const alerts = (alertsRes.data || []).filter((row: any) => row.vehicle?.company_id === selectedCompanyId);
    const reportViewRows = reportViewRes.data || [];
    const reportManualRows = (reportManualRes.data || []).filter((row: any) => row.vehicle?.company_id === selectedCompanyId);

    const reportSummary = mode === 'manual'
      ? reportManualRows.reduce(
          (acc: any, row: any) => {
            const total = Number(row.cost_parts || 0) + Number(row.cost_labor || 0) + Number(row.cost_other || 0);
            acc.totalInterventions += 1;
            acc.totalCost += total;
            if (row.status === 'completed') acc.completed += 1;
            if (row.status === 'planned' || row.status === 'in_progress') acc.pending += 1;
            return acc;
          },
          { totalInterventions: 0, totalCost: 0, completed: 0, pending: 0 }
        )
      : reportViewRows.reduce(
          (acc: any, row: any) => {
            acc.totalInterventions += row.intervention_id ? 1 : 0;
            acc.totalCost += Number(row.cost_total || 0);
            return acc;
          },
          { totalInterventions: 0, totalCost: 0 }
        );

    return NextResponse.json({
      companies,
      selectedCompanyId,
      stats: {
        vehicles: vehicles.length,
        plans: plans.length,
        interventions: interventions.length,
        alertsOpen: alerts.length,
        totalCost: Number(reportSummary.totalCost || 0),
      },
      vehicles,
      plans,
      interventions,
      alerts,
      report: {
        mode,
        rows: mode === 'manual' ? reportManualRows : reportViewRows,
        summary: reportSummary,
      },
    });
  } catch (error: unknown) {
    console.error('admin/maintenance/overview:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
