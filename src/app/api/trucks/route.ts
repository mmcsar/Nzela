import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireCompany, requireCompanyOnly } from '@/lib/auth/checkRole';
import { checkSubscriptionAccess } from '@/lib/subscription-access';
import { handleApiError } from '@/lib/api/error';
import { apiLimiter } from '@/lib/api/rate-limit';
import { parsePagination, applyPagination, paginatedResponse } from '@/lib/api/pagination';
import { withTiming } from '@/lib/api/timing';

// GET - Liste des trucks (company ou admin)
export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    const supabase = await createClient();
    const auth = await requireCompany(supabase);
    if (!auth.allowed) return withTiming(auth.response!, startedAt);

    const rateLimit = apiLimiter.check(auth.userId);
    if (!rateLimit.allowed) return withTiming(rateLimit.response!, startedAt);

    const companyId = auth.companyId;
    if (!companyId) {
      return withTiming(paginatedResponse([], 0, parsePagination(request)), startedAt);
    }

    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('trucks')
      .select('*, company:companies(*)', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;
    if (error) throw error;

    return withTiming(paginatedResponse(data, count, pagination), startedAt);
  } catch (error: unknown) {
    return withTiming(handleApiError(error) as Response, startedAt);
  }
}

// POST - Créer un truck (client normal, RLS via get_my_company_ids)
export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return withTiming(auth.response!, startedAt);

    const rateLimit = apiLimiter.check(auth.userId);
    if (!rateLimit.allowed) return withTiming(rateLimit.response!, startedAt);

    const companyId = auth.companyId;
    if (!companyId) {
      return withTiming(
        NextResponse.json(
          { error: 'Aucune entreprise associée. Contactez l\'admin pour lier votre compte.' },
          { status: 403 }
        ),
        startedAt
      );
    }

    const access = await checkSubscriptionAccess(supabase, auth.userId, 'company', companyId, null);
    if (!access.hasAccess) {
      return withTiming(
        NextResponse.json(
          { error: access.message, code: 'SUBSCRIPTION_REQUIRED' },
          { status: 403 }
        ),
        startedAt
      );
    }

    const body = await request.json();
    const {
      type,
      capacity,
      currentLocation,
      availableDate,
      destination,
      price,
      pricePerKm,
      features,
      status = 'available',
    } = body;

    if (!type || !capacity || !currentLocation || !availableDate || !price || !pricePerKm) {
      return withTiming(
        NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 }),
        startedAt
      );
    }

    const { data, error } = await supabase
      .from('trucks')
      .insert({
        company_id: companyId,
        type,
        capacity,
        current_location: currentLocation,
        available_date: availableDate,
        destination: destination || null,
        price,
        price_per_km: pricePerKm,
        features: features || [],
        status,
      })
      .select()
      .single();

    if (error) throw error;

    return withTiming(NextResponse.json({ truck: data }, { status: 201 }), startedAt);
  } catch (error: unknown) {
    return withTiming(handleApiError(error) as Response, startedAt);
  }
}
