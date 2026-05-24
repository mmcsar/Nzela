import { createClientForRouteHandler, tryCreateServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireCompany } from '@/lib/auth/checkRole';
import { resolveCompanyIdForUser, userMayManageCompany } from '@/lib/auth/companyAccess';
import { checkSubscriptionAccess } from '@/lib/subscription-access';
import { handleApiError } from '@/lib/api/error';
import { apiLimiter } from '@/lib/api/rate-limit';
import { parsePagination, applyPagination, paginatedResponse } from '@/lib/api/pagination';
import { withTiming } from '@/lib/api/timing';

async function linkCompanyForUser(
  supabase: Awaited<ReturnType<typeof createClientForRouteHandler>>,
  userId: string,
  email: string | undefined,
  existingCompanyId: string | null,
): Promise<string | null> {
  if (existingCompanyId) return existingCompanyId;

  let companyId = await resolveCompanyIdForUser(supabase, userId, email, null);
  if (companyId) return companyId;

  const { data: byOwner } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();
  if (byOwner?.id) companyId = byOwner.id;

  if (!companyId && email) {
    const { data: byEmailData } = await supabase.from('companies').select('id').eq('email', email).limit(1);
    const row = Array.isArray(byEmailData) ? byEmailData[0] : byEmailData;
    if (row?.id) companyId = row.id;
  }

  if (!companyId && email) {
    const prefix = email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
    if (prefix.length >= 2) {
      const { data: byNameData } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', `%${prefix}%`)
        .limit(1);
      const byNameRow = Array.isArray(byNameData) ? byNameData[0] : byNameData;
      if (byNameRow?.id) companyId = byNameRow.id;
      if (!companyId) {
        const { data: byEmailPrefixData } = await supabase
          .from('companies')
          .select('id')
          .ilike('email', `%${prefix}%`)
          .limit(1);
        const row2 = Array.isArray(byEmailPrefixData) ? byEmailPrefixData[0] : byEmailPrefixData;
        if (row2?.id) companyId = row2.id;
      }
    }
  }

  if (companyId) {
    const db = tryCreateServiceRoleClient() ?? supabase;
    await db.from('users').update({ company_id: companyId }).eq('id', userId);
    const { data: company } = await db.from('companies').select('owner_id').eq('id', companyId).maybeSingle();
    if (company && !company.owner_id) {
      await db.from('companies').update({ owner_id: userId }).eq('id', companyId);
    }
  }

  return companyId;
}

// GET - Liste des trucks (company ou admin)
export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    const supabase = await createClientForRouteHandler();
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

// POST - Créer un truck (entreprise)
export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const supabase = await createClientForRouteHandler();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return withTiming(
        NextResponse.json({ error: 'Session expirée. Reconnectez-vous.' }, { status: 401 }),
        startedAt,
      );
    }

    const rateLimit = apiLimiter.check(user.id);
    if (!rateLimit.allowed) return withTiming(rateLimit.response!, startedAt);

    const { data: userData } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', user.id)
      .maybeSingle();

    const role =
      (userData?.role as string) ??
      ((user.app_metadata as { role?: string } | undefined)?.role ?? 'company');

    if (role !== 'company') {
      return withTiming(
        NextResponse.json(
          {
            error:
              'Seuls les comptes entreprise peuvent publier un camion. Les courtiers publient des chargements.',
            code: 'ROLE_NOT_COMPANY',
          },
          { status: 403 },
        ),
        startedAt,
      );
    }

    let companyId = await linkCompanyForUser(
      supabase,
      user.id,
      user.email,
      userData?.company_id ?? null,
    );

    if (!companyId) {
      return withTiming(
        NextResponse.json(
          {
            error:
              "Aucune entreprise liée à votre compte. Demandez à l'admin de vous associer (Utilisateurs) ou exécutez le script supabase/lier_courtier_utilisateur.sql.",
            code: 'COMPANY_NOT_LINKED',
          },
          { status: 403 },
        ),
        startedAt,
      );
    }

    const mayPost = await userMayManageCompany(supabase, user.id, companyId);
    if (!mayPost) {
      return withTiming(
        NextResponse.json(
          { error: 'Vous ne pouvez publier que pour votre propre entreprise.', code: 'COMPANY_FORBIDDEN' },
          { status: 403 },
        ),
        startedAt,
      );
    }

    let preFetchedCompany: {
      created_at: string | null;
      subscription_id: string | null;
      status?: string;
    } | null = null;

    const dbAdmin = tryCreateServiceRoleClient();
    if (dbAdmin) {
      const { data } = await dbAdmin
        .from('companies')
        .select('created_at, subscription_id, status')
        .eq('id', companyId)
        .maybeSingle();
      preFetchedCompany = data ?? null;
    }

    const access = await checkSubscriptionAccess(
      supabase,
      user.id,
      'company',
      companyId,
      null,
      preFetchedCompany,
    );
    if (!access.hasAccess) {
      return withTiming(
        NextResponse.json(
          { error: access.message, code: 'SUBSCRIPTION_REQUIRED' },
          { status: 403 },
        ),
        startedAt,
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

    if (!type || capacity == null || !currentLocation || !availableDate || price == null || pricePerKm == null) {
      return withTiming(
        NextResponse.json({ error: 'Champs requis manquants', code: 'VALIDATION' }, { status: 400 }),
        startedAt,
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

    const insertClient = dbAdmin ?? supabase;
    const { data, error } = await insertClient.from('trucks').insert(row).select().single();

    if (error) {
      const isRls =
        error.code === '42501' || /row-level security/i.test(error.message ?? '');
      const hint = isRls
        ? " Exécutez supabase/migrations/20260515120000_trucks_rls_get_my_company_ids.sql dans Supabase et ajoutez SUPABASE_SERVICE_ROLE_KEY sur Vercel."
        : '';
      return withTiming(
        NextResponse.json(
          {
            error: `${error.message}${hint}`,
            code: isRls ? 'RLS_TRUCKS' : 'INSERT_FAILED',
          },
          { status: isRls ? 403 : 500 },
        ),
        startedAt,
      );
    }

    return withTiming(NextResponse.json({ truck: data }, { status: 201 }), startedAt);
  } catch (error: unknown) {
    return withTiming(handleApiError(error) as Response, startedAt);
  }
}
