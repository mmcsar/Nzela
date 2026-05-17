import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireCompany, requireCompanyOnly } from '@/lib/auth/checkRole';
import { resolveCompanyIdForUser, userMayManageCompany } from '@/lib/auth/companyAccess';
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

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    let companyId =
      auth.companyId ??
      (await resolveCompanyIdForUser(
        supabase,
        auth.userId,
        authUser?.email,
        auth.companyId,
      ));

    if (companyId && authUser) {
      await supabase
        .from('users')
        .update({ company_id: companyId })
        .eq('id', auth.userId);
    }

    if (!companyId) {
      return withTiming(
        NextResponse.json(
          { error: 'Aucune entreprise associée. Contactez l\'admin pour lier votre compte.' },
          { status: 403 }
        ),
        startedAt
      );
    }

    const mayPost = await userMayManageCompany(supabase, auth.userId, companyId);
    if (!mayPost) {
      return withTiming(
        NextResponse.json(
          { error: 'Vous ne pouvez publier que pour votre propre entreprise.' },
          { status: 403 }
        ),
        startedAt
      );
    }

    let preFetchedCompany: { created_at: string | null; subscription_id: string | null; status?: string } | null = null;
    try {
      const db = createServiceRoleClient();
      const { data } = await db.from('companies').select('created_at, subscription_id, status').eq('id', companyId).maybeSingle();
      preFetchedCompany = data ?? null;
    } catch {
      // Sans service role, checkSubscriptionAccess lira avec le client utilisateur
    }

    const access = await checkSubscriptionAccess(supabase, auth.userId, 'company', companyId, null, preFetchedCompany);
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
      currency: bodyCurrency,
      features,
      status = 'available',
    } = body;
    const currency = bodyCurrency === 'USD' ? 'USD' : 'CDF';

    if (!type || !capacity || !currentLocation || !availableDate || !price || !pricePerKm) {
      return withTiming(
        NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 }),
        startedAt
      );
    }

    const row = {
      company_id: companyId,
      type,
      capacity,
      current_location: currentLocation,
      available_date: availableDate,
      destination: destination || null,
      price,
      price_per_km: pricePerKm,
      currency,
      features: features || [],
      status,
    };

    let insertClient = supabase;
    try {
      insertClient = createServiceRoleClient();
    } catch {
      // Pas de service role : tenter avec le client utilisateur (nécessite RLS get_my_company_ids)
    }

    const { data, error } = await insertClient.from('trucks').insert(row).select().single();

    if (error) {
      const rlsHint =
        error.code === '42501' || /row-level security/i.test(error.message ?? '')
          ? ' Politique RLS trucks : exécutez supabase/migrations/20260515120000_trucks_rls_get_my_company_ids.sql dans Supabase.'
          : '';
      return withTiming(
        NextResponse.json({ error: `${error.message}${rlsHint}` }, { status: 500 }),
        startedAt
      );
    }

    return withTiming(NextResponse.json({ truck: data }, { status: 201 }), startedAt);
  } catch (error: unknown) {
    return withTiming(handleApiError(error) as Response, startedAt);
  }
}
