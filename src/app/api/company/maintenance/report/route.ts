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

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const vehicleId = searchParams.get('vehicleId');
    const mode = searchParams.get('mode'); // "view" (default) | "manual"

    if (mode === 'manual') {
      // Mode manuel: lit directement les interventions, utile si on veut rapport
      // uniquement basé sur les entrées d'intervention saisies manuellement.
      let manualQuery = supabase
        .from('vehicle_maintenance_interventions')
        .select(
          'id, vehicle_id, service_at, intervention_kind, status, mileage_km, cost_parts, cost_labor, cost_other, currency, provider_name, parts_changed, notes, vehicle:company_vehicles(id, registration_number, brand, model, company_id), maintenance_type:maintenance_types(code, label_fr, label_en)'
        )
        .order('service_at', { ascending: false });

      if (vehicleId) manualQuery = manualQuery.eq('vehicle_id', vehicleId);
      if (from) manualQuery = manualQuery.gte('service_at', from);
      if (to) manualQuery = manualQuery.lte('service_at', to);

      const { data, error } = await manualQuery;
      if (error) throw error;

      const rows = (data || []).filter((r: any) => r.vehicle?.company_id === auth.companyId);
      const summary = rows.reduce(
        (acc: any, row: any) => {
          const total = Number(row.cost_parts || 0) + Number(row.cost_labor || 0) + Number(row.cost_other || 0);
          acc.totalInterventions += 1;
          acc.totalCost += total;
          if (row.status === 'completed') acc.completed += 1;
          if (row.status === 'planned' || row.status === 'in_progress') acc.pending += 1;
          return acc;
        },
        { totalInterventions: 0, totalCost: 0, completed: 0, pending: 0 }
      );

      return NextResponse.json({ mode: 'manual', rows, summary });
    }

    let query = supabase
      .from('v_company_maintenance_report')
      .select('*')
      .eq('company_id', auth.companyId)
      .order('service_at', { ascending: false });

    if (vehicleId) query = query.eq('vehicle_id', vehicleId);
    if (from) query = query.gte('service_at', from);
    if (to) query = query.lte('service_at', to);

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    const summary = rows.reduce(
      (acc: any, row: any) => {
        acc.totalInterventions += row.intervention_id ? 1 : 0;
        acc.totalCost += Number(row.cost_total || 0);
        return acc;
      },
      { totalInterventions: 0, totalCost: 0 }
    );

    return NextResponse.json({ mode: 'view', rows, summary });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
