import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCompanyOnly } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;
    if (!auth.companyId) return NextResponse.json({ error: 'Aucune entreprise associée' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');

    const [companyKpiRes, vehicleKpiRes, overdueAlertsRes] = await Promise.all([
      supabase
        .from('v_company_maintenance_kpi')
        .select('*')
        .eq('company_id', auth.companyId)
        .maybeSingle(),
      vehicleId
        ? supabase
            .from('v_vehicle_maintenance_kpi')
            .select('*')
            .eq('company_id', auth.companyId)
            .eq('vehicle_id', vehicleId)
            .maybeSingle()
        : supabase
            .from('v_vehicle_maintenance_kpi')
            .select('*')
            .eq('company_id', auth.companyId)
            .order('total_cost', { ascending: false })
            .limit(20),
      supabase
        .from('vehicle_maintenance_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('is_resolved', false)
        .in('alert_type', ['overdue_date', 'overdue_mileage']),
    ]);

    if (companyKpiRes.error) throw companyKpiRes.error;
    if (vehicleKpiRes.error) throw vehicleKpiRes.error;
    if (overdueAlertsRes.error) throw overdueAlertsRes.error;

    return NextResponse.json({
      company: companyKpiRes.data || {
        total_work_orders: 0,
        completed_work_orders: 0,
        open_work_orders: 0,
        critical_work_orders: 0,
        total_maintenance_cost: 0,
        avg_repair_hours: null,
      },
      vehicles: Array.isArray(vehicleKpiRes.data) ? vehicleKpiRes.data : vehicleKpiRes.data ? [vehicleKpiRes.data] : [],
      overdueAlerts: overdueAlertsRes.count || 0,
    });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
