import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error';
import { matchingLimiter } from '@/lib/api/rate-limit';
import { parsePagination } from '@/lib/api/pagination';

/**
 * Algorithme de matching intelligent entre chargements et camions
 * Score basé sur: distance, capacité, prix, disponibilité, type
 * 
 * Optimisé: 
 * - Batch fetching (2 requêtes au lieu de N+1)
 * - Pagination
 * - Rate limiting
 * - Map lookup O(1) au lieu de boucle O(n)
 */

interface MatchResult {
  loadId: string;
  truckId: string;
  score: number;
  reasons: string[];
  estimatedRevenue: number;
  distanceKm: number;
}

function calculateMatchScore(load: any, truck: any): MatchResult | null {
  let score = 0;
  const reasons: string[] = [];

  // 1. Correspondance de localisation (max 30 points)
  const loadOrigin = typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin;
  const truckLocation = typeof truck.current_location === 'string'
    ? JSON.parse(truck.current_location)
    : truck.current_location;

  if (loadOrigin?.city && truckLocation?.city) {
    if (loadOrigin.city.toLowerCase() === truckLocation.city.toLowerCase()) {
      score += 30;
      reasons.push('Même ville de départ');
    } else if (loadOrigin.province === truckLocation.province) {
      score += 15;
      reasons.push('Même province');
    }
  }

  // 2. Capacité suffisante (max 25 points)
  if (truck.capacity >= load.weight) {
    score += 25;
    reasons.push('Capacité suffisante');
    const utilization = load.weight / truck.capacity;
    if (utilization >= 0.7) {
      score += 10;
      reasons.push('Utilisation optimale du camion');
    }
  } else {
    return null;
  }

  // 3. Disponibilité (max 20 points)
  const truckAvailable = new Date(truck.available_date);
  const loadPickup = new Date(load.pickup_date);
  const daysDiff = Math.abs(
    (truckAvailable.getTime() - loadPickup.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 1) {
    score += 20;
    reasons.push('Disponible immédiatement');
  } else if (daysDiff <= 3) {
    score += 15;
    reasons.push('Disponible sous 3 jours');
  } else if (daysDiff <= 7) {
    score += 5;
    reasons.push('Disponible sous 7 jours');
  }

  // 4. Prix compétitif (max 15 points)
  if (truck.price_per_km > 0 && load.price_per_km > 0) {
    const priceRatio = truck.price_per_km / load.price_per_km;
    if (priceRatio <= 1) {
      score += 15;
      reasons.push('Prix très compétitif');
    } else if (priceRatio <= 1.2) {
      score += 10;
      reasons.push('Prix compétitif');
    } else if (priceRatio <= 1.5) {
      score += 5;
      reasons.push('Prix acceptable');
    }
  }

  if (score < 30) return null;

  const estimatedRevenue = load.price || (load.distance * (truck.price_per_km || 2500));

  return {
    loadId: load.id,
    truckId: truck.id,
    score: Math.min(score, 100),
    reasons,
    estimatedRevenue,
    distanceKm: load.distance || 0,
  };
}

// GET - Obtenir les matchs pour l'utilisateur connecté
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = matchingLimiter.check(user.id);
    if (!rateLimit.allowed) return rateLimit.response!;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const minScore = parseInt(searchParams.get('minScore') || '30');
    const pagination = parsePagination(request);

    // ── Batch fetch: 2 requêtes (au lieu de 40+) ──
    // Récupérer les chargements avec les détails broker en JOIN
    const { data: loads } = await supabase
      .from('loads')
      .select('*, broker:brokers(name, city)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(50);

    // Récupérer les camions avec les détails company en JOIN
    const { data: trucks } = await supabase
      .from('trucks')
      .select('*, company:companies(name, city)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!loads?.length || !trucks?.length) {
      return NextResponse.json({
        matches: [],
        total: 0,
        showing: 0,
        pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        message: 'Pas assez de données pour le matching',
      });
    }

    // Calculer les scores de matching
    const allMatches: MatchResult[] = [];

    for (const load of loads) {
      for (const truck of trucks) {
        const match = calculateMatchScore(load, truck);
        if (match && match.score >= minScore) {
          allMatches.push(match);
        }
      }
    }

    // Trier par score décroissant
    allMatches.sort((a, b) => b.score - a.score);

    // Appliquer pagination
    const totalMatches = allMatches.length;
    const paginatedMatches = allMatches.slice(pagination.offset, pagination.offset + limit);

    // ── Enrichir avec lookup O(1) via Map (au lieu de N requêtes DB) ──
    const loadMap = new Map(loads.map((l) => [l.id, l]));
    const truckMap = new Map(trucks.map((t) => [t.id, t]));

    const enrichedMatches = paginatedMatches.map((match) => ({
      ...match,
      load: loadMap.get(match.loadId) || null,
      truck: truckMap.get(match.truckId) || null,
    }));

    const totalPages = Math.ceil(totalMatches / limit);

    return NextResponse.json({
      matches: enrichedMatches,
      total: totalMatches,
      showing: enrichedMatches.length,
      pagination: {
        page: pagination.page,
        limit,
        total: totalMatches,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
