import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCompanyOnly } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.sku !== undefined) updateData.sku = String(body.sku || '').trim().toUpperCase();
    if (body.name !== undefined) updateData.name = String(body.name || '').trim();
    if (body.category !== undefined) updateData.category = body.category ? String(body.category).trim() : null;
    if (body.unit !== undefined) updateData.unit = body.unit ? String(body.unit).trim() : 'unit';
    if (body.stockQty !== undefined) {
      const v = Number(body.stockQty);
      if (Number.isNaN(v) || v < 0) return NextResponse.json({ error: 'stockQty invalide' }, { status: 400 });
      updateData.stock_qty = v;
    }
    if (body.minStockQty !== undefined) {
      const v = Number(body.minStockQty);
      if (Number.isNaN(v) || v < 0) return NextResponse.json({ error: 'minStockQty invalide' }, { status: 400 });
      updateData.min_stock_qty = v;
    }
    if (body.avgUnitCost !== undefined) {
      const v = Number(body.avgUnitCost);
      if (Number.isNaN(v) || v < 0) return NextResponse.json({ error: 'avgUnitCost invalide' }, { status: 400 });
      updateData.avg_unit_cost = v;
    }
    if (body.currency !== undefined) updateData.currency = body.currency === 'CDF' ? 'CDF' : 'USD';
    if (body.isActive !== undefined) updateData.is_active = Boolean(body.isActive);

    const { data, error } = await supabase
      .from('maintenance_parts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ part: data });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const { error } = await supabase.from('maintenance_parts').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
