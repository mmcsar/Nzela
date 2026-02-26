import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkSubscriptionAccess } from '@/lib/subscription-access';
import { ROUTES_RDC } from '@/lib/constants/rdc-routes';

/**
 * POST - Publier un chargement (courtier uniquement).
 * Body: même format que LoadPostForm (origin, destination, cargoType, trailerType, weight, distance, duration, price, pricePerKm, pickupDate, deliveryDate).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Session expirée ou absente. Reconnectez-vous.' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, broker_id')
      .eq('id', user.id)
      .maybeSingle();

    let brokerId = userData?.broker_id ?? null;
    if (!brokerId && userData?.role === 'broker') {
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      brokerId = broker?.id ?? null;
    }

    if (!brokerId) {
      return NextResponse.json(
        { error: 'Aucun profil courtier lié. Contactez l\'admin ou rattachez votre compte.' },
        { status: 403 }
      );
    }

    let preFetchedBroker: { created_at: string | null; subscription_id: string | null; status?: string } | null = null;
    try {
      const db = createServiceRoleClient();
      const { data } = await db.from('brokers').select('created_at, subscription_id, status').eq('id', brokerId).maybeSingle();
      preFetchedBroker = data ?? null;
    } catch {
      // Sans service role : checkSubscriptionAccess lira avec le client utilisateur
    }

    const access = await checkSubscriptionAccess(supabase, user.id, 'broker', null, brokerId, preFetchedBroker);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: 'SUBSCRIPTION_REQUIRED' },
        { status: 403 }
      );
    }

    const origin = body.origin ?? {};
    const destination = body.destination ?? {};
    const fromCity = (origin.city || body.from || '').trim();
    const toCity = (destination.city || body.to || '').trim();

    let distance = Number(body.distance) || 0;
    let duration = (body.duration || '').trim();
    if (fromCity && toCity && (!distance || !duration)) {
      const route = ROUTES_RDC.find(
        (r) => r.from.toLowerCase() === fromCity.toLowerCase() && r.to.toLowerCase() === toCity.toLowerCase()
      );
      if (route) {
        if (!distance) distance = parseInt(route.distance.replace(/\s*km\s*/i, ''), 10) || 0;
        if (!duration) duration = route.duration;
      }
    }

    const price = parseFloat(body.price) ?? 0;
    const pricePerKm = Number(body.pricePerKm) ?? (distance > 0 ? Math.round(price / distance) : 0);

    const loadData = {
      broker_id: brokerId,
      origin: {
        address: origin.address ?? '',
        city: origin.city ?? fromCity,
        province: origin.province ?? 'haut-katanga',
        coordinates: origin.coordinates,
      },
      destination: {
        address: destination.address ?? '',
        city: destination.city ?? toCity,
        province: destination.province ?? 'haut-katanga',
        coordinates: destination.coordinates,
      },
      distance,
      duration: duration || '',
      trailer_type: body.trailerType || body.truck || body.cargo || 'flatbed',
      weight: parseFloat(body.weight) || 0,
      price,
      price_per_km: pricePerKm,
      pickup_date: body.pickupDate || new Date().toISOString(),
      delivery_date: body.deliveryDate || new Date().toISOString(),
      cargo_type: body.cargoType || null,
      status: 'available',
    };

    const { data: load, error } = await supabase.from('loads').insert(loadData).select().single();

    if (error) {
      console.error('Error creating load:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, load }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/loads/post:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
