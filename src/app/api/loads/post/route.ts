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

    const role = userData?.role ?? (user.app_metadata as { role?: string })?.role ?? 'company';
    let brokerId = userData?.broker_id ?? null;

    // Même logique que getAuthUser/sync-profile : rattacher par owner_id, email, préfixe, puis service role
    if (!brokerId && role === 'broker') {
      let entityId: string | null = null;
      const { data: byOwner } = await supabase.from('brokers').select('id').eq('owner_id', user.id).maybeSingle();
      entityId = byOwner?.id ?? null;
      if (!entityId && user.email) {
        const { data: byEmailData } = await supabase.from('brokers').select('id').eq('email', user.email).limit(1);
        const row = Array.isArray(byEmailData) ? byEmailData[0] : byEmailData;
        if (row?.id) entityId = row.id;
      }
      if (!entityId && user.email) {
        const prefix = user.email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
        if (prefix.length >= 2) {
          const { data: byNameData } = await supabase.from('brokers').select('id').ilike('name', `%${prefix}%`).limit(1);
          const row = Array.isArray(byNameData) ? byNameData[0] : byNameData;
          if (row?.id) entityId = row.id;
          if (!entityId) {
            const { data: byEmailPrefixData } = await supabase.from('brokers').select('id').ilike('email', `%${prefix}%`).limit(1);
            const row2 = Array.isArray(byEmailPrefixData) ? byEmailPrefixData[0] : byEmailPrefixData;
            if (row2?.id) entityId = row2.id;
          }
        }
      }
      if (!entityId && user.email) {
        try {
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (key && key !== 'your_service_role_key_here') {
            const db = createServiceRoleClient();
            const prefix = user.email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
            if (prefix.length >= 2) {
              const { data: unlinked } = await db.from('brokers').select('id, name, email').is('owner_id', null).limit(50);
              const list = Array.isArray(unlinked) ? unlinked : unlinked ? [unlinked] : [];
              const match = list.find(
                (r: { id: string; name?: string | null; email?: string | null }) =>
                  (r.name && r.name.toLowerCase().includes(prefix.toLowerCase())) ||
                  (r.email && r.email.toLowerCase().includes(prefix.toLowerCase()))
              );
              if (match?.id) {
                entityId = match.id;
                await db.from('brokers').update({ owner_id: user.id }).eq('id', entityId);
              }
            }
          }
        } catch {
          // ignore
        }
      }
      if (entityId) {
        brokerId = entityId;
        await supabase.from('users').update({ broker_id: entityId }).eq('id', user.id);
      }
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

    // Distance/durée depuis ROUTES_RDC (Haut-Katanga, Lualaba) quand villes connues
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

    // Défauts Haut-Katanga / Lualaba (flux classique Lubumbashi ↔ Kolwezi)
    const currency = (body.currency === 'USD' ? 'USD' : 'CDF') as 'CDF' | 'USD';
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
        province: destination.province ?? 'lualaba',
        coordinates: destination.coordinates,
      },
      distance,
      duration: duration || '',
      trailer_type: body.trailerType || body.truck || body.cargo || 'flatbed',
      weight: parseFloat(body.weight) || 0,
      price,
      price_per_km: pricePerKm,
      currency,
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
