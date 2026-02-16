import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireBroker, requireBrokerOnly } from '@/lib/auth/checkRole';
import { checkSubscriptionAccess } from '@/lib/subscription-access';
import { handleApiError } from '@/lib/api/error';
import { apiLimiter } from '@/lib/api/rate-limit';
import { parsePagination, applyPagination, paginatedResponse } from '@/lib/api/pagination';
import { withTiming } from '@/lib/api/timing';

// GET - Liste des loads (pour l'utilisateur connecté - broker ou admin)
export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    const supabase = await createClient();
    const auth = await requireBroker(supabase);
    if (!auth.allowed) return withTiming(auth.response!, startedAt);

    // Rate limiting
    const rateLimit = apiLimiter.check(auth.userId);
    if (!rateLimit.allowed) return withTiming(rateLimit.response!, startedAt);

    if (!auth.brokerId && auth.role !== 'admin') {
      return withTiming(NextResponse.json({ error: 'Aucun broker associé' }, { status: 403 }), startedAt);
    }

    // Pagination
    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('loads')
      .select('*, broker:brokers(*)', { count: 'exact' })
      .eq('broker_id', auth.brokerId!)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) throw error;

    return withTiming(paginatedResponse(data, count, pagination), startedAt);
  } catch (error: unknown) {
    return withTiming(handleApiError(error) as Response, startedAt);
  }
}

// POST - Créer un load
export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const supabase = await createClient();
    const auth = await requireBrokerOnly(supabase);
    if (!auth.allowed) return withTiming(auth.response!, startedAt);

    // Rate limiting
    const rateLimit = apiLimiter.check(auth.userId);
    if (!rateLimit.allowed) return withTiming(rateLimit.response!, startedAt);

    if (!auth.brokerId) {
      return withTiming(NextResponse.json({ error: 'Aucun broker associé' }, { status: 403 }), startedAt);
    }

    const access = await checkSubscriptionAccess(supabase, auth.userId, 'broker', null, auth.brokerId);
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
      origin,
      destination,
      trailerType,
      weight,
      distance,
      duration,
      price,
      pricePerKm,
      pickupDate,
      deliveryDate,
      status = 'available',
    } = body;

    // Validation
    if (
      !origin ||
      !destination ||
      !trailerType ||
      !weight ||
      !distance ||
      !duration ||
      !price ||
      !pricePerKm ||
      !pickupDate ||
      !deliveryDate
    ) {
      return withTiming(NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      ), startedAt);
    }

    const { data, error } = await supabase
      .from('loads')
      .insert({
        broker_id: auth.brokerId,
        origin,
        destination,
        trailer_type: trailerType,
        weight,
        distance,
        duration,
        price,
        price_per_km: pricePerKm,
        pickup_date: pickupDate,
        delivery_date: deliveryDate,
        status,
      })
      .select()
      .single();

    if (error) throw error;

    return withTiming(NextResponse.json({ load: data }, { status: 201 }), startedAt);
  } catch (error: unknown) {
    return withTiming(handleApiError(error) as Response, startedAt);
  }
}

