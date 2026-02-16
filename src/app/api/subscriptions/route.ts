import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/lib/utils/pricing';

// GET - Mes abonnements
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    // Si non-admin, filtrer par user_id
    if (userData?.role !== 'admin') {
      query = query.eq('user_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ subscriptions: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Créer un abonnement
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { plan = 'standard', autoRenew = false } = body;
    if (plan !== 'standard') {
      return NextResponse.json(
        { error: 'Plan invalide. Seul le plan standard (50 USD/mois) est disponible.' },
        { status: 400 }
      );
    }

    // Vérifier s'il y a déjà un abonnement actif
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement actif. Annulez-le d\'abord.' },
        { status: 409 }
      );
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // +1 mois

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan: 'standard',
        price: SUBSCRIPTION_PLANS.standard.priceUSD,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: autoRenew,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ subscription: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
