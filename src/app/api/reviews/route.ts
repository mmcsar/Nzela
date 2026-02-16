import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// GET - Score de fiabilite d'une entite
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entity_type et entity_id requis' }, { status: 400 });
    }

    // Recuperer le score
    const { data: score } = await supabase
      .from('reliability_scores')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    // Recuperer les avis recents
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, reviewer:users!reviews_reviewer_id_fkey(full_name, email)')
      .eq('target_type', entityType)
      .eq('target_id', entityId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Si pas de score, calculer a partir des avis
    let computedScore = score;
    if (!computedScore && reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
      computedScore = {
        entity_type: entityType,
        entity_id: entityId,
        avg_rating: Math.round(avgRating * 100) / 100,
        total_reviews: reviews.length,
        total_deliveries: 0,
        on_time_rate: 0,
        completion_rate: 0,
        response_time_avg: 0,
      };
    }

    return NextResponse.json({
      score: computedScore || {
        entity_type: entityType,
        entity_id: entityId,
        avg_rating: 0,
        total_reviews: 0,
        total_deliveries: 0,
        on_time_rate: 0,
        completion_rate: 0,
        response_time_avg: 0,
      },
      reviews: reviews || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Laisser un avis
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { target_type, target_id, load_id, rating, comment, categories } = body;

    if (!target_type || !target_id || !rating) {
      return NextResponse.json({ error: 'target_type, target_id et rating requis' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating doit etre entre 1 et 5' }, { status: 400 });
    }

    // Verifier qu'on n'evalue pas sa propre entite
    const { data: user } = await supabase
      .from('users')
      .select('company_id, broker_id')
      .eq('id', auth.userId)
      .single();

    if (
      (target_type === 'company' && user?.company_id === target_id) ||
      (target_type === 'broker' && user?.broker_id === target_id)
    ) {
      return NextResponse.json({ error: 'Vous ne pouvez pas evaluer votre propre entite' }, { status: 400 });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: auth.userId,
        target_type,
        target_id,
        load_id: load_id || null,
        rating,
        comment: comment || null,
        categories: categories || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculer le score moyen
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('target_type', target_type)
      .eq('target_id', target_id);

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length;

      await supabase
        .from('reliability_scores')
        .upsert({
          entity_type: target_type,
          entity_id: target_id,
          avg_rating: Math.round(avgRating * 100) / 100,
          total_reviews: allReviews.length,
          last_calculated: new Date().toISOString(),
        }, {
          onConflict: 'entity_id',
        });
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
