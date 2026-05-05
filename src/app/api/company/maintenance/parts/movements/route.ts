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
    const partId = searchParams.get('partId');
    const workOrderId = searchParams.get('workOrderId');

    let query = supabase
      .from('maintenance_part_movements')
      .select('*, part:maintenance_parts(id, sku, name, company_id), work_order:maintenance_work_orders(id, work_order_no, title)', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (partId) query = query.eq('part_id', partId);
    if (workOrderId) query = query.eq('work_order_id', workOrderId);

    query = applyPagination(query, pagination);
    const { data, error, count } = await query;
    if (error) throw error;

    const filtered = (data || []).filter((row: any) => row.part?.company_id === auth.companyId);
    return paginatedResponse(filtered as any[], count, pagination);
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
    const partId = String(body.partId || '').trim();
    const workOrderId = body.workOrderId ? String(body.workOrderId).trim() : null;
    const movementType = String(body.movementType || '').trim();
    const quantity = Number(body.quantity);
    const unitCost = body.unitCost == null ? null : Number(body.unitCost);
    const referenceNo = body.referenceNo ? String(body.referenceNo).trim() : null;
    const note = body.note ? String(body.note).trim() : null;

    if (!partId || !movementType || Number.isNaN(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'partId, movementType et quantity > 0 requis' }, { status: 400 });
    }
    if (unitCost != null && (Number.isNaN(unitCost) || unitCost < 0)) {
      return NextResponse.json({ error: 'unitCost invalide' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('maintenance_part_movements')
      .insert({
        part_id: partId,
        work_order_id: workOrderId,
        movement_type: movementType,
        quantity,
        unit_cost: unitCost,
        reference_no: referenceNo,
        note,
        created_by: auth.userId,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ movement: data }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
