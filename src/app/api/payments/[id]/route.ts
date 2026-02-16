import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { linkSubscriptionToEntity } from '@/lib/payments/link-subscription';

// GET - Détails d'un paiement
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*, subscription:subscriptions(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ payment: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Mettre à jour le statut d'un paiement (webhook / admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide. Valeurs: pending, completed, failed' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', id)
      .select('*, subscription:subscriptions(*)')
      .single();

    if (error) throw error;

    // Si le paiement est complété, activer l'abonnement et lier à company/broker
    if (status === 'completed' && data?.subscription_id) {
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', data.subscription_id);
      await linkSubscriptionToEntity(supabase, data);
    }

    return NextResponse.json({ payment: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
