import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// ── City coordinates for RDC (Haut-Katanga + Lualaba) ──
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'lubumbashi': { lat: -11.6647, lng: 27.4794 },
  'kolwezi': { lat: -10.7133, lng: 25.4667 },
  'likasi': { lat: -10.9833, lng: 26.7333 },
  'kipushi': { lat: -11.7667, lng: 27.2500 },
  'kasumbalesa': { lat: -12.6167, lng: 28.5167 },
  'fungurume': { lat: -10.6167, lng: 26.3000 },
  'kambove': { lat: -10.8667, lng: 26.6000 },
  'kinshasa': { lat: -4.3217, lng: 15.3125 },
  'matadi': { lat: -5.8167, lng: 13.4500 },
  'mbuji-mayi': { lat: -6.1500, lng: 23.6000 },
  'kananga': { lat: -5.8962, lng: 22.4166 },
  'kisangani': { lat: 0.5153, lng: 25.1900 },
  'goma': { lat: -1.6792, lng: 29.2228 },
  'bukavu': { lat: -2.5083, lng: 28.8608 },
  'kalemie': { lat: -5.9333, lng: 29.2000 },
  'kamina': { lat: -8.7333, lng: 25.0000 },
  'ndola': { lat: -12.9587, lng: 28.6366 },
  'kitwe': { lat: -12.8024, lng: 28.2132 },
};

function getCityCoords(location: any): { lat: number; lng: number } {
  if (location?.coordinates?.lat && location?.coordinates?.lng) {
    return location.coordinates;
  }
  const city = (location?.city || '').toLowerCase().trim();
  return CITY_COORDS[city] || CITY_COORDS['lubumbashi'];
}

// ── GET - Recuperer le tracking d'un chargement ──
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get('loadId');
    const sessionId = searchParams.get('sessionId');

    if (!loadId && !sessionId) {
      return NextResponse.json({ error: 'loadId ou sessionId requis' }, { status: 400 });
    }

    // ── Recuperer le load ──
    const { data: load } = await supabase
      .from('loads')
      .select('*')
      .eq('id', loadId!)
      .single();

    if (!load) {
      return NextResponse.json({ error: 'Chargement non trouve' }, { status: 404 });
    }

    const origin = typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin;
    const dest = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;
    const originCoords = getCityCoords(origin);
    const destCoords = getCityCoords(dest);

    // ── Chercher la session active ──
    let session = null;
    let updates: any[] = [];

    const { data: sessions } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('load_id', loadId!)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessions && sessions.length > 0) {
      session = sessions[0];

      // Recuperer les mises a jour GPS
      const { data: trackingUpdates } = await supabase
        .from('tracking_updates')
        .select('*')
        .eq('session_id', session.id)
        .order('recorded_at', { ascending: true })
        .limit(100);

      updates = trackingUpdates || [];
    }

    // ── Construire la reponse ──
    if (session && updates.length > 0) {
      // Donnees reelles depuis la base
      const lastUpdate = updates[updates.length - 1];
      const currentPos = { lat: lastUpdate.lat, lng: lastUpdate.lng };

      // Calculer la progression
      const totalDist = haversineDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
      const remainingDist = haversineDistance(currentPos.lat, currentPos.lng, destCoords.lat, destCoords.lng);
      const progress = Math.min(100, Math.round(((totalDist - remainingDist) / totalDist) * 100));

      // Estimer ETA
      const avgSpeed = lastUpdate.speed > 0 ? lastUpdate.speed : 50; // km/h
      const etaHours = remainingDist / avgSpeed;
      const eta = new Date(Date.now() + etaHours * 3600000).toISOString();

      return NextResponse.json({
        tracking: {
          status: session.status === 'active' ? 'active' : session.status === 'completed' ? 'completed' : 'paused',
          loadId: load.id,
          truckId: load.truck_id || session.truck_id,
          sessionId: session.id,
          currentPosition: currentPos,
          origin: originCoords,
          destination: destCoords,
          progress,
          eta,
          speed: lastUpdate.speed || 0,
          heading: lastUpdate.heading || 0,
          distanceTotal: Math.round(totalDist),
          distanceRemaining: Math.round(remainingDist),
          updates: updates.map(u => ({
            id: u.id,
            loadId: u.load_id,
            truckId: u.truck_id,
            coordinates: { lat: u.lat, lng: u.lng },
            speed: u.speed,
            heading: u.heading,
            status: u.status,
            timestamp: u.recorded_at,
            battery: u.battery_level,
          })),
          route: [originCoords, ...updates.map(u => ({ lat: u.lat, lng: u.lng })), destCoords],
          startedAt: session.started_at,
          updatedAt: lastUpdate.recorded_at,
        },
        load,
      });
    }

    // ── Pas de session ou pas de donnees reelles: simuler ──
    const simulated = generateSimulatedTracking(load, originCoords, destCoords);
    return NextResponse.json({ tracking: simulated, load, simulated: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST - Envoyer une mise a jour GPS ──
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const {
      loadId,
      lat,
      lng,
      altitude,
      accuracy,
      speed,
      heading,
      status: trackingStatus,
      battery_level,
      network_type,
    } = body;

    if (!loadId || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'loadId, lat, lng requis' }, { status: 400 });
    }

    // Verifier le chargement
    const { data: load } = await supabase
      .from('loads')
      .select('id, status, truck_id, origin, destination')
      .eq('id', loadId)
      .single();

    if (!load) {
      return NextResponse.json({ error: 'Chargement non trouve' }, { status: 404 });
    }

    // ── Trouver ou creer une session ──
    let { data: sessions } = await supabase
      .from('tracking_sessions')
      .select('id')
      .eq('load_id', loadId)
      .eq('status', 'active')
      .limit(1);

    let sessionId: string;

    if (sessions && sessions.length > 0) {
      sessionId = sessions[0].id;
    } else {
      // Creer une nouvelle session
      const origin = typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin;
      const dest = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;
      const originCoords = getCityCoords(origin);
      const destCoords = getCityCoords(dest);

      const { data: newSession, error: sessError } = await supabase
        .from('tracking_sessions')
        .insert({
          load_id: loadId,
          truck_id: load.truck_id || null,
          driver_user_id: auth.userId,
          status: 'active',
          origin_lat: originCoords.lat,
          origin_lng: originCoords.lng,
          destination_lat: destCoords.lat,
          destination_lng: destCoords.lng,
        })
        .select('id')
        .single();

      if (sessError) throw sessError;
      sessionId = newSession.id;

      // Mettre le load en transit si pas deja
      if (load.status !== 'in-transit' && load.status !== 'in_transit') {
        await supabase
          .from('loads')
          .update({ status: 'in-transit' })
          .eq('id', loadId);
      }
    }

    // ── Inserer la mise a jour GPS ──
    const { data: update, error: updateError } = await supabase
      .from('tracking_updates')
      .insert({
        session_id: sessionId,
        load_id: loadId,
        truck_id: load.truck_id || null,
        lat,
        lng,
        altitude: altitude || null,
        accuracy: accuracy || null,
        speed: speed || 0,
        heading: heading || 0,
        status: trackingStatus || 'moving',
        battery_level: battery_level || null,
        network_type: network_type || null,
      })
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      sessionId,
      update: {
        id: update.id,
        loadId,
        coordinates: { lat, lng },
        speed: speed || 0,
        heading: heading || 0,
        status: trackingStatus || 'moving',
        timestamp: update.recorded_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Haversine distance (km) ──
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Simulation pour loads sans session GPS ──
function generateSimulatedTracking(load: any, origin: any, dest: any) {
  const now = new Date();

  if (load.status === 'in-transit' || load.status === 'in_transit') {
    const progress = 0.4 + Math.random() * 0.3;
    const currentLat = origin.lat + (dest.lat - origin.lat) * progress;
    const currentLng = origin.lng + (dest.lng - origin.lng) * progress;

    const updates = [];
    for (let i = 0; i <= 10; i++) {
      const p = (progress * i) / 10;
      updates.push({
        id: `sim-${i}`,
        loadId: load.id,
        truckId: load.truck_id || '',
        coordinates: {
          lat: origin.lat + (dest.lat - origin.lat) * p,
          lng: origin.lng + (dest.lng - origin.lng) * p,
        },
        speed: 40 + Math.random() * 40,
        heading: Math.atan2(dest.lng - origin.lng, dest.lat - origin.lat) * (180 / Math.PI),
        timestamp: new Date(now.getTime() - (10 - i) * 15 * 60000).toISOString(),
        status: 'moving',
      });
    }

    return {
      status: 'active',
      loadId: load.id,
      truckId: load.truck_id,
      currentPosition: { lat: currentLat, lng: currentLng },
      origin,
      destination: dest,
      progress: Math.round(progress * 100),
      eta: new Date(now.getTime() + (1 - progress) * 3 * 3600000).toISOString(),
      speed: 45 + Math.random() * 30,
      distanceTotal: load.distance || Math.round(haversineDistance(origin.lat, origin.lng, dest.lat, dest.lng)),
      distanceRemaining: load.distance ? Math.round(load.distance * (1 - progress)) : null,
      updates,
      route: [origin, { lat: currentLat, lng: currentLng }, dest],
    };
  }

  return {
    status: load.status === 'completed' || load.status === 'delivered' ? 'completed' : 'inactive',
    loadId: load.id,
    truckId: load.truck_id,
    currentPosition: load.status === 'completed' ? dest : origin,
    origin,
    destination: dest,
    progress: load.status === 'completed' || load.status === 'delivered' ? 100 : 0,
    updates: [],
    route: [origin, dest],
  };
}
