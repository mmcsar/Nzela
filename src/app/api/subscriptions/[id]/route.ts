import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Détails d'un abonnement
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
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Abonnement non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ subscription: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Modifier (renouveler / annuler) un abonnement
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
    const updates: Record<string, any> = {};

    if (body.status) updates.status = body.status;
    if (body.autoRenew !== undefined) updates.auto_renew = body.autoRenew;
    // Plan verrouille: seul "standard" est autorise
    if (body.plan && body.plan !== 'standard') {
      return NextResponse.json(
        { error: 'Changement de plan non autorise. Plan unique: standard (50 USD/mois).' },
        { status: 400 }
      );
    }

    // Si renouvellement, prolonger la date de fin
    if (body.renew) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      updates.end_date = endDate.toISOString();
      updates.status = 'active';
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ subscription: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
