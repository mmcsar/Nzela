import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// GET - Récupérer les avis d'une entité (company ou broker)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const entityType = searchParams.get('entityType'); // 'company' | 'broker'
    const loadId = searchParams.get('loadId');

    if (loadId) {
      // Récupérer les avis pour un chargement spécifique
      // Simuler les avis
      return NextResponse.json({
        ratings: [],
        canRate: true,
      });
    }

    if (!entityId || !entityType) {
      return NextResponse.json({ error: 'entityId et entityType requis' }, { status: 400 });
    }

    // Simuler des avis pour la démo
    const ratings = generateSampleRatings(entityId, entityType);

    // Calculer le résumé
    const totals = ratings.reduce(
      (acc: any, r: any) => ({
        overall: acc.overall + r.overall,
        communication: acc.communication + r.communication,
        punctuality: acc.punctuality + r.punctuality,
        reliability: acc.reliability + r.reliability,
      }),
      { overall: 0, communication: 0, punctuality: 0, reliability: 0 }
    );

    const count = ratings.length || 1;
    const summary = {
      entityId,
      entityType,
      averageOverall: Math.round((totals.overall / count) * 10) / 10,
      averageCommunication: Math.round((totals.communication / count) * 10) / 10,
      averagePunctuality: Math.round((totals.punctuality / count) * 10) / 10,
      averageReliability: Math.round((totals.reliability / count) * 10) / 10,
      totalReviews: ratings.length,
      recentReviews: ratings.slice(0, 5),
    };

    return NextResponse.json({ summary, ratings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Soumettre un avis
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { loadId, revieweeId, revieweeType, overall, communication, punctuality, reliability, comment } = body;

    if (!loadId || !revieweeId || !overall) {
      return NextResponse.json({ error: 'loadId, revieweeId, overall requis' }, { status: 400 });
    }

    // Vérifier que les notes sont valides (1-5)
    const validate = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

    // Récupérer le rôle de l'utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('role, email, full_name')
      .eq('id', auth.userId)
      .single();

    const rating = {
      id: `rat-${Date.now()}`,
      loadId,
      reviewerId: auth.userId,
      reviewerName: userData?.full_name || userData?.email || 'Utilisateur',
      reviewerRole: userData?.role || 'company',
      revieweeId,
      revieweeType: revieweeType || 'company',
      overall: validate(overall),
      communication: validate(communication || overall),
      punctuality: validate(punctuality || overall),
      reliability: validate(reliability || overall),
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ rating }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateSampleRatings(entityId: string, entityType: string) {
  const names = ['Pierre M.', 'Marie K.', 'Jean-Paul L.', 'Francine N.', 'David T.'];
  const comments = [
    'Très professionnel, livraison dans les temps.',
    'Bonne communication tout au long du transport.',
    'Camion propre et chauffeur ponctuel.',
    'Prix correct et service fiable.',
    'Recommandé ! Service impeccable.',
  ];

  return names.map((name, i) => ({
    id: `rat-${i}`,
    loadId: `load-${i}`,
    reviewerId: `user-${i}`,
    reviewerName: name,
    reviewerRole: i % 2 === 0 ? 'broker' : 'company',
    revieweeId: entityId,
    revieweeType: entityType,
    overall: 3 + Math.floor(Math.random() * 2.5),
    communication: 3 + Math.floor(Math.random() * 2.5),
    punctuality: 3 + Math.floor(Math.random() * 2.5),
    reliability: 3 + Math.floor(Math.random() * 2.5),
    comment: comments[i],
    createdAt: new Date(Date.now() - i * 5 * 86400000).toISOString(),
  }));
}
