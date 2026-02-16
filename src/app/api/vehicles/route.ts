import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireCompany } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';
import { apiLimiter } from '@/lib/api/rate-limit';
import { parsePagination, applyPagination, paginatedResponse } from '@/lib/api/pagination';

// Note: Les véhicules utilisent la même table "trucks" avec un filtre sur le type
// Véhicules = pickup, van, small-truck, other (capacité < 5 tonnes)

// GET - Liste des véhicules
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireCompany(supabase);
    if (!auth.allowed) return auth.response!;

    // Rate limiting
    const rateLimit = apiLimiter.check(auth.userId);
    if (!rateLimit.allowed) return rateLimit.response!;

    if (!auth.companyId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Aucune entreprise associée' }, { status: 403 });
    }

    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('trucks')
      .select('*, company:companies(*)', { count: 'exact' })
      .eq('company_id', auth.companyId!)
      .lte('capacity', 5000)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) throw error;

    return paginatedResponse(data, count, pagination);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// POST - Créer un véhicule
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Aucune entreprise associée' }, { status: 403 });
    }

    const body = await request.json();
    const { type, capacity, currentLocation, availableDate, price, pricePerKm, features } = body;

    if (!type || !capacity || !currentLocation) {
      return NextResponse.json({ error: 'Champs requis: type, capacity, currentLocation' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('trucks')
      .insert({
        company_id: userData.company_id,
        type,
        capacity: Math.min(capacity, 5000), // Max 5 tonnes pour véhicules
        current_location: currentLocation,
        available_date: availableDate || new Date().toISOString(),
        price: price || 0,
        price_per_km: pricePerKm || 0,
        features: features || [],
        status: 'available',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ vehicle: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
