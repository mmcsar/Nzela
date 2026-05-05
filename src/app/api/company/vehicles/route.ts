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

    if (!auth.companyId) {
      return paginatedResponse([], 0, parsePagination(request));
    }

    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const q = searchParams.get('q');

    let query = supabase
      .from('company_vehicles')
      .select('*', { count: 'exact' })
      .eq('company_id', auth.companyId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (q) {
      query = query.or(
        `registration_number.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`
      );
    }

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

    if (!auth.companyId) {
      return NextResponse.json({ error: 'Aucune entreprise associée' }, { status: 403 });
    }

    const body = await request.json();
    const registrationNumber = String(body.registrationNumber || '').trim().toUpperCase();
    const brand = String(body.brand || '').trim();
    const model = String(body.model || '').trim();
    const year = body.year == null ? null : Number(body.year);
    const currentMileageKm = body.currentMileageKm == null ? 0 : Number(body.currentMileageKm);
    const category = String(body.category || 'truck').trim();
    const photoUrl = body.photoUrl ? String(body.photoUrl).trim() : null;
    const status = String(body.status || 'active').trim();
    const notes = body.notes ? String(body.notes).trim() : null;
    const truckId = body.truckId ? String(body.truckId).trim() : null;

    if (!registrationNumber || !brand || !model) {
      return NextResponse.json(
        { error: 'registrationNumber, brand et model sont requis' },
        { status: 400 }
      );
    }
    if (Number.isNaN(currentMileageKm) || currentMileageKm < 0) {
      return NextResponse.json({ error: 'currentMileageKm invalide' }, { status: 400 });
    }
    if (year != null && (Number.isNaN(year) || year < 1950 || year > 2100)) {
      return NextResponse.json({ error: 'year invalide' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('company_vehicles')
      .insert({
        company_id: auth.companyId,
        truck_id: truckId,
        registration_number: registrationNumber,
        brand,
        model,
        year,
        current_mileage_km: currentMileageKm,
        category,
        photo_url: photoUrl,
        status,
        notes,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ vehicle: data }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
