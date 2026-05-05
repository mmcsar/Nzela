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

    if (body.title !== undefined) updateData.title = String(body.title || '').trim();
    if (body.description !== undefined) updateData.description = body.description ? String(body.description).trim() : null;
    if (body.priority !== undefined) updateData.priority = String(body.priority);
    if (body.status !== undefined) updateData.status = String(body.status);
    if (body.scheduledStartAt !== undefined) updateData.scheduled_start_at = body.scheduledStartAt || null;
    if (body.scheduledEndAt !== undefined) updateData.scheduled_end_at = body.scheduledEndAt || null;
    if (body.startedAt !== undefined) updateData.started_at = body.startedAt || null;
    if (body.completedAt !== undefined) updateData.completed_at = body.completedAt || null;
    if (body.closedAt !== undefined) updateData.closed_at = body.closedAt || null;
    if (body.assignedTo !== undefined) updateData.assigned_to = body.assignedTo || null;
    if (body.approvedNote !== undefined) updateData.approved_note = body.approvedNote || null;
    if (body.approvedAt !== undefined) updateData.approved_at = body.approvedAt || null;
    if (body.approvedBy !== undefined) updateData.approved_by = body.approvedBy || null;
    if (body.odometerKm !== undefined) {
      const v = body.odometerKm == null ? null : Number(body.odometerKm);
      if (v != null && (Number.isNaN(v) || v < 0)) {
        return NextResponse.json({ error: 'odometerKm invalide' }, { status: 400 });
      }
      updateData.odometer_km = v;
    }
    if (body.totalPartsCost !== undefined) updateData.total_parts_cost = Math.max(0, Number(body.totalPartsCost) || 0);
    if (body.totalLaborCost !== undefined) updateData.total_labor_cost = Math.max(0, Number(body.totalLaborCost) || 0);
    if (body.totalOtherCost !== undefined) updateData.total_other_cost = Math.max(0, Number(body.totalOtherCost) || 0);

    const { data, error } = await supabase
      .from('maintenance_work_orders')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ workOrder: data });
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

    const { error } = await supabase.from('maintenance_work_orders').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
