/**
 * Script pour créer des données d'exemple (3 chargements et 3 camions)
 * 
 * Utilisation:
 * 1. Assurez-vous d'avoir un utilisateur connecté avec un companyId ou brokerId
 * 2. Exécutez: npx tsx scripts/seed-data.ts
 * 
 * Ou utilisez cette fonction dans une page admin pour créer les données
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Exemples de camions
const exampleTrucks = [
  {
    type: 'Semi-remorque',
    capacity: 20000,
    current_location: JSON.stringify({
      address: 'Avenue de la République',
      city: 'Lubumbashi',
      province: 'haut-katanga',
      coordinates: { lat: -11.6642, lng: 27.4826 }
    }),
    available_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
    destination: JSON.stringify({
      address: 'Route de Kolwezi',
      city: 'Kolwezi',
      province: 'lualaba',
      coordinates: { lat: -10.7148, lng: 25.4667 }
    }),
    price: 500000,
    price_per_km: 2500,
    status: 'available',
    features: JSON.stringify(['GPS', 'Frigorifique', 'Hayon']),
    company_id: '', // À remplir avec un company_id réel
  },
  {
    type: 'Camion benne',
    capacity: 15000,
    current_location: JSON.stringify({
      address: 'Boulevard Kamanyola',
      city: 'Lubumbashi',
      province: 'haut-katanga',
      coordinates: { lat: -11.6642, lng: 27.4826 }
    }),
    available_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Dans 2 jours
    destination: null,
    price: 400000,
    price_per_km: 2000,
    status: 'available',
    features: JSON.stringify(['GPS', 'Benne basculante']),
    company_id: '', // À remplir avec un company_id réel
  },
  {
    type: 'Porteur',
    capacity: 10000,
    current_location: JSON.stringify({
      address: 'Avenue Kasavubu',
      city: 'Likasi',
      province: 'haut-katanga',
      coordinates: { lat: -10.9833, lng: 26.7333 }
    }),
    available_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // Dans 3 jours
    destination: JSON.stringify({
      address: 'Route de Lubumbashi',
      city: 'Lubumbashi',
      province: 'haut-katanga',
      coordinates: { lat: -11.6642, lng: 27.4826 }
    }),
    price: 350000,
    price_per_km: 1800,
    status: 'available',
    features: JSON.stringify(['GPS']),
    company_id: '', // À remplir avec un company_id réel
  },
];

// Exemples de chargements
const exampleLoads = [
  {
    origin: JSON.stringify({
      address: 'Mine de Tenke Fungurume',
      city: 'Tenke',
      province: 'lualaba',
      coordinates: { lat: -10.5833, lng: 26.1833 }
    }),
    destination: JSON.stringify({
      address: 'Port de Matadi',
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
    broker_id: '', // À remplir avec un broker_id réel
  },
  {
    origin: JSON.stringify({
      address: 'Usine Gécamines',
      city: 'Lubumbashi',
      province: 'haut-katanga',
      coordinates: { lat: -11.6642, lng: 27.4826 }
    }),
    destination: JSON.stringify({
      address: 'Zone industrielle',
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
    broker_id: '', // À remplir avec un broker_id réel
  },
  {
    origin: JSON.stringify({
      address: 'Dépôt central',
      city: 'Likasi',
      province: 'haut-katanga',
      coordinates: { lat: -10.9833, lng: 26.7333 }
    }),
    destination: JSON.stringify({
      address: 'Marché central',
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
    broker_id: '', // À remplir avec un broker_id réel
  },
];

export async function seedTrucks(companyId: string) {
  const trucksWithCompanyId = exampleTrucks.map(truck => ({
    ...truck,
    company_id: companyId,
  }));

  const { data, error } = await supabase
    .from('trucks')
    .insert(trucksWithCompanyId)
    .select();

  if (error) {
    console.error('Erreur lors de la création des camions:', error);
    return { success: false, error };
  }

  console.log('✅ 3 camions créés avec succès:', data);
  return { success: true, data };
}

export async function seedLoads(brokerId: string) {
  const loadsWithBrokerId = exampleLoads.map(load => ({
    ...load,
    broker_id: brokerId,
  }));

  const { data, error } = await supabase
    .from('loads')
    .insert(loadsWithBrokerId)
    .select();

  if (error) {
    console.error('Erreur lors de la création des chargements:', error);
    return { success: false, error };
  }

  console.log('✅ 3 chargements créés avec succès:', data);
  return { success: true, data };
}

// Fonction principale pour créer toutes les données d'exemple
export async function seedAllData(companyId: string, brokerId: string) {
  console.log('🌱 Création des données d\'exemple...\n');

  const trucksResult = await seedTrucks(companyId);
  const loadsResult = await seedLoads(brokerId);

  return {
    trucks: trucksResult,
    loads: loadsResult,
  };
}


