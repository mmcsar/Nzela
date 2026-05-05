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

    if (body.interventionKind !== undefined) updateData.intervention_kind = String(body.interventionKind);
    if (body.status !== undefined) updateData.status = String(body.status);
    if (body.serviceAt !== undefined) updateData.service_at = body.serviceAt;
    if (body.mileageKm !== undefined) {
      const v = body.mileageKm == null ? null : Number(body.mileageKm);
      if (v != null && (Number.isNaN(v) || v < 0)) {
        return NextResponse.json({ error: 'mileageKm invalide' }, { status: 400 });
      }
      updateData.mileage_km = v;
    }
    if (body.providerName !== undefined) updateData.provider_name = body.providerName || null;
    if (body.partsChanged !== undefined) updateData.parts_changed = body.partsChanged || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.costParts !== undefined) {
      const v = Number(body.costParts);
      if (Number.isNaN(v) || v < 0) return NextResponse.json({ error: 'costParts invalide' }, { status: 400 });
      updateData.cost_parts = v;
    }
    if (body.costLabor !== undefined) {
      const v = Number(body.costLabor);
      if (Number.isNaN(v) || v < 0) return NextResponse.json({ error: 'costLabor invalide' }, { status: 400 });
      updateData.cost_labor = v;
    }
    if (body.costOther !== undefined) {
      const v = Number(body.costOther);
      if (Number.isNaN(v) || v < 0) return NextResponse.json({ error: 'costOther invalide' }, { status: 400 });
      updateData.cost_other = v;
    }
    if (body.currency !== undefined) updateData.currency = body.currency === 'CDF' ? 'CDF' : 'USD';
    if (body.attachmentUrls !== undefined) {
      updateData.attachment_urls = Array.isArray(body.attachmentUrls) ? body.attachmentUrls.map(String) : [];
    }

    const { data, error } = await supabase
      .from('vehicle_maintenance_interventions')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ intervention: data });
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

    const { error } = await supabase
      .from('vehicle_maintenance_interventions')
      .delete()
      .eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
