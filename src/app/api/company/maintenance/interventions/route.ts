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
    const planId = searchParams.get('planId');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('vehicle_maintenance_interventions')
      .select(
        '*, vehicle:company_vehicles(id, registration_number, brand, model), maintenance_type:maintenance_types(id, code, label_fr, label_en)',
        { count: 'exact' }
      )
      .order('service_at', { ascending: false });

    if (vehicleId) query = query.eq('vehicle_id', vehicleId);
    if (planId) query = query.eq('plan_id', planId);
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('service_at', from);
    if (to) query = query.lte('service_at', to);

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
    const maintenanceTypeId = body.maintenanceTypeId ? String(body.maintenanceTypeId).trim() : null;
    const planId = body.planId ? String(body.planId).trim() : null;
    const interventionKind = String(body.interventionKind || 'preventive');
    const status = String(body.status || 'completed');
    const serviceAt = body.serviceAt ? new Date(body.serviceAt).toISOString() : new Date().toISOString();
    const mileageKm = body.mileageKm == null ? null : Number(body.mileageKm);
    const providerName = body.providerName ? String(body.providerName).trim() : null;
    const partsChanged = body.partsChanged ? String(body.partsChanged).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const costParts = body.costParts == null ? 0 : Number(body.costParts);
    const costLabor = body.costLabor == null ? 0 : Number(body.costLabor);
    const costOther = body.costOther == null ? 0 : Number(body.costOther);
    const currency = body.currency === 'CDF' ? 'CDF' : 'USD';
    const attachmentUrls = Array.isArray(body.attachmentUrls) ? body.attachmentUrls.map(String) : [];

    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId requis' }, { status: 400 });
    }
    if (mileageKm != null && (Number.isNaN(mileageKm) || mileageKm < 0)) {
      return NextResponse.json({ error: 'mileageKm invalide' }, { status: 400 });
    }
    if ([costParts, costLabor, costOther].some((v) => Number.isNaN(v) || v < 0)) {
      return NextResponse.json({ error: 'Coûts invalides' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vehicle_maintenance_interventions')
      .insert({
        vehicle_id: vehicleId,
        maintenance_type_id: maintenanceTypeId,
        plan_id: planId,
        intervention_kind: interventionKind,
        status,
        service_at: serviceAt,
        mileage_km: mileageKm,
        provider_name: providerName,
        parts_changed: partsChanged,
        notes,
        cost_parts: costParts,
        cost_labor: costLabor,
        cost_other: costOther,
        currency,
        attachment_urls: attachmentUrls,
        created_by: auth.userId,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ intervention: data }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
