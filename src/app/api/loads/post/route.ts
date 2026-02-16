import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ROUTES_RDC } from '@/lib/constants/rdc-routes';
import { checkSubscriptionAccess } from '@/lib/subscription-access';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le broker de l'utilisateur
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (brokerError || !broker) {
      return NextResponse.json(
        { error: 'Vous devez être un broker pour publier un chargement' },
        { status: 403 }
      );
    }

    const access = await checkSubscriptionAccess(supabase, user.id, 'broker', null, broker.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: 'SUBSCRIPTION_REQUIRED' },
        { status: 403 }
      );
    }

    // Trouver la route correspondante pour calculer distance et durée
    const route = ROUTES_RDC.find(
      (r) => r.from.toLowerCase() === body.from.toLowerCase() && r.to.toLowerCase() === body.to.toLowerCase()
    );

    // Préparer les données
    const loadData = {
      broker_id: broker.id,
      origin: JSON.stringify({
        city: body.from,
        address: '',
        province: 'haut-katanga',
      }),
      destination: JSON.stringify({
        city: body.to,
        address: '',
        province: 'haut-katanga',
      }),
      distance: route ? parseInt(route.distance.replace(' km', '')) : 0,
      duration: route ? route.duration : '',
      trailer_type: body.truck || body.cargo,
      weight: parseFloat(body.weight) || 0,
      price: parseFloat(body.price) || 0,
      price_per_km: route && route.distance
        ? Math.round((parseFloat(body.price) || 0) / parseInt(route.distance.replace(' km', '')))
        : 0,
      pickup_date: body.pickupDate || new Date().toISOString(),
      delivery_date: body.deliveryDate || new Date().toISOString(),
      status: 'available',
    };

    // Insérer le chargement
    const { data, error } = await supabase.from('loads').insert(loadData).select().single();

    if (error) {
      console.error('Error creating load:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, load: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/loads/post:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


