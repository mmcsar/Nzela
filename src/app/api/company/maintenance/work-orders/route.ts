import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCompanyOnly } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';
import { parsePagination, applyPagination, paginatedResponse } from '@/lib/api/pagination';

export const dynamic = 'force-dynamic';

function generateWorkOrderNo() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `WO-${y}${m}${d}-${rnd}`;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const vehicleId = searchParams.get('vehicleId');
    const q = searchParams.get('q');

    let query = supabase
      .from('maintenance_work_orders')
      .select('*, vehicle:company_vehicles(id, registration_number, brand, model), maintenance_type:maintenance_types(id, code, label_fr, label_en)', {
        count: 'exact',
      })
      .eq('company_id', auth.companyId)
      .order('requested_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);
    if (q) query = query.or(`work_order_no.ilike.%${q}%,title.ilike.%${q}%`);

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
    if (!auth.companyId) return NextResponse.json({ error: 'Aucune entreprise associée' }, { status: 403 });

    const body = await request.json();
    const vehicleId = String(body.vehicleId || '').trim();
    const title = String(body.title || '').trim();
    const description = body.description ? String(body.description).trim() : null;
    const priority = String(body.priority || 'medium');
    const status = String(body.status || 'draft');
    const maintenanceTypeId = body.maintenanceTypeId ? String(body.maintenanceTypeId).trim() : null;
    const planId = body.planId ? String(body.planId).trim() : null;
    const scheduledStartAt = body.scheduledStartAt || null;
    const scheduledEndAt = body.scheduledEndAt || null;
    const odometerKm = body.odometerKm == null ? null : Number(body.odometerKm);
    const assignedTo = body.assignedTo ? String(body.assignedTo).trim() : null;
    const currency = body.currency === 'CDF' ? 'CDF' : 'USD';

    if (!vehicleId || !title) {
      return NextResponse.json({ error: 'vehicleId et title requis' }, { status: 400 });
    }
    if (odometerKm != null && (Number.isNaN(odometerKm) || odometerKm < 0)) {
      return NextResponse.json({ error: 'odometerKm invalide' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('maintenance_work_orders')
      .insert({
        company_id: auth.companyId,
        vehicle_id: vehicleId,
        maintenance_type_id: maintenanceTypeId,
        plan_id: planId,
        work_order_no: generateWorkOrderNo(),
        title,
        description,
        priority,
        status,
        scheduled_start_at: scheduledStartAt,
        scheduled_end_at: scheduledEndAt,
        odometer_km: odometerKm,
        assigned_to: assignedTo,
        currency,
        created_by: auth.userId,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ workOrder: data }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
