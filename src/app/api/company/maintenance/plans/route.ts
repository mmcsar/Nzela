import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCompanyOnly } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';
import { parsePagination, applyPagination, paginatedResponse } from '@/lib/api/pagination';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const enabled = searchParams.get('enabled');

    let query = supabase
      .from('vehicle_maintenance_plans')
      .select(
        '*, vehicle:company_vehicles(id, registration_number, brand, model, current_mileage_km, status), maintenance_type:maintenance_types(id, code, label_fr, label_en)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (vehicleId) query = query.eq('vehicle_id', vehicleId);
    if (enabled === 'true' || enabled === 'false') query = query.eq('is_enabled', enabled === 'true');

    query = applyPagination(query, pagination);
    const { data, error, count } = await query;
    if (error) throw error;

    return paginatedResponse(data, count, pagination);
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const vehicleId = String(body.vehicleId || '').trim();
    const maintenanceTypeId = String(body.maintenanceTypeId || '').trim();
    const intervalKm = body.intervalKm == null ? null : Number(body.intervalKm);
    const intervalDays = body.intervalDays == null ? null : Number(body.intervalDays);
    const alertBeforeKm = body.alertBeforeKm == null ? 500 : Number(body.alertBeforeKm);
    const alertBeforeDays = body.alertBeforeDays == null ? 7 : Number(body.alertBeforeDays);
    const isEnabled = body.isEnabled == null ? true : Boolean(body.isEnabled);

    if (!vehicleId || !maintenanceTypeId) {
      return NextResponse.json({ error: 'vehicleId et maintenanceTypeId requis' }, { status: 400 });
    }
    if ((intervalKm == null || intervalKm <= 0) && (intervalDays == null || intervalDays <= 0)) {
      return NextResponse.json(
        { error: 'Définissez au moins un intervalle (km ou jours)' },
        { status: 400 }
      );
    }
    if (intervalKm != null && (Number.isNaN(intervalKm) || intervalKm <= 0)) {
      return NextResponse.json({ error: 'intervalKm invalide' }, { status: 400 });
    }
    if (intervalDays != null && (Number.isNaN(intervalDays) || intervalDays <= 0)) {
      return NextResponse.json({ error: 'intervalDays invalide' }, { status: 400 });
    }
    if (Number.isNaN(alertBeforeKm) || alertBeforeKm < 0) {
      return NextResponse.json({ error: 'alertBeforeKm invalide' }, { status: 400 });
    }
    if (Number.isNaN(alertBeforeDays) || alertBeforeDays < 0) {
      return NextResponse.json({ error: 'alertBeforeDays invalide' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const nextDueAt =
      intervalDays && intervalDays > 0
        ? new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const { data: vehicle, error: vehicleErr } = await supabase
      .from('company_vehicles')
      .select('id, current_mileage_km')
      .eq('id', vehicleId)
      .single();
    if (vehicleErr) throw vehicleErr;

    const nextDueMileageKm =
      intervalKm && intervalKm > 0 ? (vehicle.current_mileage_km || 0) + intervalKm : null;

    const { data, error } = await supabase
      .from('vehicle_maintenance_plans')
      .insert({
        vehicle_id: vehicleId,
        maintenance_type_id: maintenanceTypeId,
        is_enabled: isEnabled,
        interval_km: intervalKm,
        interval_days: intervalDays,
        last_service_at: null,
        last_service_mileage_km: null,
        next_due_at: nextDueAt,
        next_due_mileage_km: nextDueMileageKm,
        alert_before_km: alertBeforeKm,
        alert_before_days: alertBeforeDays,
        created_at: nowIso,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ plan: data }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
