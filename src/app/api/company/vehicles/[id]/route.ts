import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCompanyOnly } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const { data, error } = await supabase
      .from('company_vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json({ vehicle: data });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}

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

    if (body.registrationNumber !== undefined) {
      const registrationNumber = String(body.registrationNumber || '').trim().toUpperCase();
      if (!registrationNumber) {
        return NextResponse.json({ error: 'registrationNumber invalide' }, { status: 400 });
      }
      updateData.registration_number = registrationNumber;
    }
    if (body.brand !== undefined) updateData.brand = String(body.brand || '').trim();
    if (body.model !== undefined) updateData.model = String(body.model || '').trim();
    if (body.year !== undefined) {
      const year = body.year == null ? null : Number(body.year);
      if (year != null && (Number.isNaN(year) || year < 1950 || year > 2100)) {
        return NextResponse.json({ error: 'year invalide' }, { status: 400 });
      }
      updateData.year = year;
    }
    if (body.currentMileageKm !== undefined) {
      const mileage = Number(body.currentMileageKm);
      if (Number.isNaN(mileage) || mileage < 0) {
        return NextResponse.json({ error: 'currentMileageKm invalide' }, { status: 400 });
      }
      updateData.current_mileage_km = mileage;
    }
    if (body.category !== undefined) updateData.category = String(body.category || '').trim();
    if (body.photoUrl !== undefined) updateData.photo_url = body.photoUrl ? String(body.photoUrl).trim() : null;
    if (body.status !== undefined) updateData.status = String(body.status || '').trim();
    if (body.notes !== undefined) updateData.notes = body.notes ? String(body.notes).trim() : null;
    if (body.truckId !== undefined) updateData.truck_id = body.truckId ? String(body.truckId).trim() : null;
    if (body.truckConfig !== undefined) updateData.truck_config = body.truckConfig ? String(body.truckConfig).trim() : null;
    if (body.bodyType !== undefined) updateData.body_type = body.bodyType ? String(body.bodyType).trim() : null;
    if (body.ptacTons !== undefined) {
      const ptac = body.ptacTons == null || body.ptacTons === '' ? null : Number(body.ptacTons);
      if (ptac != null && (Number.isNaN(ptac) || ptac < 0)) {
        return NextResponse.json({ error: 'ptacTons invalide' }, { status: 400 });
      }
      updateData.ptac_tons = ptac;
    }
    if (body.ptraTons !== undefined) {
      const ptra = body.ptraTons == null || body.ptraTons === '' ? null : Number(body.ptraTons);
      if (ptra != null && (Number.isNaN(ptra) || ptra < 0)) {
        return NextResponse.json({ error: 'ptraTons invalide' }, { status: 400 });
      }
      updateData.ptra_tons = ptra;
    }

    const { data, error } = await supabase
      .from('company_vehicles')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ vehicle: data });
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

    const { error } = await supabase.from('company_vehicles').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
