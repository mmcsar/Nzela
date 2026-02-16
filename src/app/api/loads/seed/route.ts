import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ROUTES_RDC, CARGO_TYPES, TRUCK_TYPES } from '@/lib/constants/rdc-routes';

// Exemples de chargements variés pour le LoadBoard
const exampleLoads = [
  {
    from: 'Lubumbashi',
    to: 'Kolwezi',
    cargo: 'Minerais',
    truck: 'Semi-remorque',
    weight: '25',
    price: '3500',
    pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    from: 'Lubumbashi',
    to: 'Likasi',
    cargo: 'Ciment',
    truck: 'Benne',
    weight: '20',
    price: '1800',
    pickupDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    from: 'Kolwezi',
    to: 'Lubumbashi',
    cargo: 'Marchandises',
    truck: 'Frigorifique',
    weight: '15',
    price: '2800',
    pickupDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    from: 'Likasi',
    to: 'Lubumbashi',
    cargo: 'Équipements',
    truck: 'Plateau',
    weight: '18',
    price: '2200',
    pickupDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    from: 'Lubumbashi',
    to: 'Kasumbalesa',
    cargo: 'Alimentaire',
    truck: 'Frigorifique',
    weight: '12',
    price: '1500',
    pickupDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    from: 'Kolwezi',
    to: 'Fungurume',
    cargo: 'Minerais',
    truck: 'Semi-remorque',
    weight: '30',
    price: '4200',
    pickupDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    from: 'Lubumbashi',
    to: 'Kipushi',
    cargo: 'Matériaux de construction',
    truck: 'Benne',
    weight: '22',
    price: '1200',
    pickupDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    from: 'Likasi',
    to: 'Kambove',
    cargo: 'Ciment',
    truck: 'Porte-conteneur',
    weight: '16',
    price: '1900',
    pickupDate: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function POST() {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer ou créer un broker
    let { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!broker) {
      // Créer un broker de test
      const { data: newBroker, error: brokerError } = await supabase
        .from('brokers')
        .insert({
          name: 'Broker Demo',
          registration_number: `DEMO-BROK-${Date.now()}`,
          address: 'Adresse demo',
          city: 'Lubumbashi',
          province: 'haut-katanga',
          phone: '+243900000000',
          email: user.email || 'demo@example.com',
          owner_id: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (brokerError) {
        return NextResponse.json(
          { error: `Erreur création broker: ${brokerError.message}` },
          { status: 500 }
        );
      }
      broker = newBroker!;
    }

    if (!broker) {
      return NextResponse.json(
        { error: 'Impossible de créer ou récupérer un broker' },
        { status: 500 }
      );
    }

    const createdLoads = [];

    // Créer chaque chargement
    for (const loadData of exampleLoads) {
      // Trouver la route correspondante
      const route = ROUTES_RDC.find(
        (r) =>
          r.from.toLowerCase() === loadData.from.toLowerCase() &&
          r.to.toLowerCase() === loadData.to.toLowerCase()
      );

      const distance = route ? parseInt(route.distance.replace(' km', '')) : 0;
      const duration = route ? route.duration : '';

      const load = {
        broker_id: broker.id,
        origin: JSON.stringify({
          city: loadData.from,
          address: '',
          province: 'haut-katanga',
        }),
        destination: JSON.stringify({
          city: loadData.to,
          address: '',
          province: 'haut-katanga',
        }),
        distance,
        duration,
        trailer_type: loadData.truck,
        weight: parseFloat(loadData.weight),
        price: parseFloat(loadData.price),
        price_per_km: route && distance
          ? Math.round(parseFloat(loadData.price) / distance)
          : 0,
        pickup_date: loadData.pickupDate,
        delivery_date: loadData.deliveryDate,
        status: 'available',
      };

      const { data, error } = await supabase.from('loads').insert(load).select().single();

      if (error) {
        console.error('Error creating load:', error);
        continue;
      }

      createdLoads.push(data);
    }

    return NextResponse.json({
      success: true,
      message: `${createdLoads.length} chargements créés avec succès`,
      loads: createdLoads,
      count: createdLoads.length,
    });
  } catch (error: any) {
    console.error('Error in POST /api/loads/seed:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


