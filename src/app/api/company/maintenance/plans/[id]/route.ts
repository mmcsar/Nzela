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

    if (body.isEnabled !== undefined) updateData.is_enabled = Boolean(body.isEnabled);
    if (body.intervalKm !== undefined) {
      const v = body.intervalKm == null ? null : Number(body.intervalKm);
      if (v != null && (Number.isNaN(v) || v <= 0)) {
        return NextResponse.json({ error: 'intervalKm invalide' }, { status: 400 });
      }
      updateData.interval_km = v;
    }
    if (body.intervalDays !== undefined) {
      const v = body.intervalDays == null ? null : Number(body.intervalDays);
      if (v != null && (Number.isNaN(v) || v <= 0)) {
        return NextResponse.json({ error: 'intervalDays invalide' }, { status: 400 });
      }
      updateData.interval_days = v;
    }
    if (body.nextDueAt !== undefined) updateData.next_due_at = body.nextDueAt || null;
    if (body.nextDueMileageKm !== undefined) {
      const v = body.nextDueMileageKm == null ? null : Number(body.nextDueMileageKm);
      if (v != null && (Number.isNaN(v) || v < 0)) {
        return NextResponse.json({ error: 'nextDueMileageKm invalide' }, { status: 400 });
      }
      updateData.next_due_mileage_km = v;
    }
    if (body.alertBeforeKm !== undefined) {
      const v = Number(body.alertBeforeKm);
      if (Number.isNaN(v) || v < 0) {
        return NextResponse.json({ error: 'alertBeforeKm invalide' }, { status: 400 });
      }
      updateData.alert_before_km = v;
    }
    if (body.alertBeforeDays !== undefined) {
      const v = Number(body.alertBeforeDays);
      if (Number.isNaN(v) || v < 0) {
        return NextResponse.json({ error: 'alertBeforeDays invalide' }, { status: 400 });
      }
      updateData.alert_before_days = v;
    }

    const { data, error } = await supabase
      .from('vehicle_maintenance_plans')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ plan: data });
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

    const { error } = await supabase.from('vehicle_maintenance_plans').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
