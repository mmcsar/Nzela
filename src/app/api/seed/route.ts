import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Exemples de camions avec plus de variété
const exampleTrucks = [
  {
    type: 'Semi-remorque',
    capacity: 20000,
    current_location: JSON.stringify({
      address: 'Avenue de la République, Quartier Kenya',
      city: 'Lubumbashi',
      province: 'haut-katanga',
      coordinates: { lat: -11.6642, lng: 27.4826 }
    }),
    available_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    destination: JSON.stringify({
      address: 'Route de Kolwezi, Zone industrielle',
      city: 'Kolwezi',
      province: 'lualaba',
      coordinates: { lat: -10.7148, lng: 25.4667 }
    }),
    price: 500000,
    price_per_km: 2500,
    status: 'available',
    features: JSON.stringify(['GPS', 'Frigorifique', 'Hayon', 'Assurance']),
  },
  {
    type: 'Camion benne',
    capacity: 15000,
    current_location: JSON.stringify({
      address: 'Boulevard Kamanyola, Centre-ville',
      city: 'Lubumbashi',
      province: 'haut-katanga',
      coordinates: { lat: -11.6642, lng: 27.4826 }
    }),
    available_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    destination: null,
    price: 400000,
    price_per_km: 2000,
    status: 'available',
    features: JSON.stringify(['GPS', 'Benne basculante', 'Assurance']),
  },
  {
    type: 'Porteur',
    capacity: 10000,
    current_location: JSON.stringify({
      address: 'Avenue Kasavubu, Quartier industriel',
      city: 'Likasi',
      province: 'haut-katanga',
      coordinates: { lat: -10.9833, lng: 26.7333 }
    }),
    available_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    destination: JSON.stringify({
      address: 'Route de Lubumbashi, Marché central',
      city: 'Lubumbashi',
      province: 'haut-katanga',
      coordinates: { lat: -11.6642, lng: 27.4826 }
    }),
    price: 350000,
    price_per_km: 1800,
    status: 'available',
    features: JSON.stringify(['GPS', 'Assurance']),
  },
];

// Exemples de chargements avec plus de détails
const exampleLoads = [
  {
    origin: JSON.stringify({
      address: 'Mine de Tenke Fungurume, Site d\'extraction',
      city: 'Tenke',
      province: 'lualaba',
      coordinates: { lat: -10.5833, lng: 26.1833 }
    }),
    destination: JSON.stringify({
      address: 'Port de Matadi, Terminal de chargement',
      city: 'Matadi',
      province: 'haut-katanga',
      coordinates: { lat: -5.8167, lng: 13.4500 }
    }),
    distance: 1200,
    duration: '48 heures',
    trailer_type: 'Plateau',
    weight: 18000,
    price: 3000000,
    price_per_km: 2500,
    pickup_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'available',
  },
  {
    origin: JSON.stringify({
      address: 'Usine Gécamines, Zone de production',
      city: 'Lubumbashi',
      province: 'haut-katanga',
      coordinates: { lat: -11.6642, lng: 27.4826 }
    }),
    destination: JSON.stringify({
      address: 'Zone industrielle, Entrepôt principal',
      city: 'Kolwezi',
      province: 'lualaba',
      coordinates: { lat: -10.7148, lng: 25.4667 }
    }),
    distance: 350,
    duration: '12 heures',
    trailer_type: 'Frigorifique',
    weight: 12000,
    price: 875000,
    price_per_km: 2500,
    pickup_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'available',
  },
  {
    origin: JSON.stringify({
      address: 'Dépôt central, Zone de stockage',
      city: 'Likasi',
      province: 'haut-katanga',
      coordinates: { lat: -10.9833, lng: 26.7333 }
    }),
    destination: JSON.stringify({
      address: 'Marché central, Quai de déchargement',
      city: 'Lubumbashi',
      province: 'haut-katanga',
      coordinates: { lat: -11.6642, lng: 27.4826 }
    }),
    distance: 120,
    duration: '4 heures',
    trailer_type: 'Bâché',
    weight: 8000,
    price: 240000,
    price_per_km: 2000,
    pickup_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    delivery_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'available',
  },
];

export async function POST() {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('users')
      .select('company_id, broker_id')
      .eq('id', user.id)
      .single();

    let companyId = profile?.company_id;
    let brokerId = profile?.broker_id;

    // Créer une entreprise de test si nécessaire
    if (!companyId) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'Entreprise Test',
          registration_number: `TEST-COMP-${Date.now()}`,
          address: 'Adresse test',
          city: 'Lubumbashi',
          province: 'haut-katanga',
          phone: '+243900000000',
          email: user.email || 'test@example.com',
          owner_id: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (companyError) {
        return NextResponse.json(
          { error: `Erreur création entreprise: ${companyError.message}` },
          { status: 500 }
        );
      }
      companyId = company.id;
    }

    // Créer un courtier de test si nécessaire
    if (!brokerId) {
      const { data: broker, error: brokerError } = await supabase
        .from('brokers')
        .insert({
          name: 'Courtier Test',
          registration_number: `TEST-BROK-${Date.now()}`,
          address: 'Adresse test',
          city: 'Lubumbashi',
          province: 'haut-katanga',
          phone: '+243900000001',
          email: user.email || 'test@example.com',
          owner_id: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (brokerError) {
        return NextResponse.json(
          { error: `Erreur création courtier: ${brokerError.message}` },
          { status: 500 }
        );
      }
      brokerId = broker.id;
    }

    // Créer les camions
    const trucksWithCompanyId = exampleTrucks.map(truck => ({
      ...truck,
      company_id: companyId,
    }));

    const { data: trucks, error: trucksError } = await supabase
      .from('trucks')
      .insert(trucksWithCompanyId)
      .select();

    if (trucksError) {
      return NextResponse.json(
        { error: `Erreur création camions: ${trucksError.message}` },
        { status: 500 }
      );
    }

    // Créer les chargements
    const loadsWithBrokerId = exampleLoads.map(load => ({
      ...load,
      broker_id: brokerId,
    }));

    const { data: loads, error: loadsError } = await supabase
      .from('loads')
      .insert(loadsWithBrokerId)
      .select();

    if (loadsError) {
      return NextResponse.json(
        { error: `Erreur création chargements: ${loadsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '3 camions et 3 chargements créés avec succès',
      trucks: trucks.length,
      loads: loads.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

