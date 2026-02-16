import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const KEY = 'subscription_gate_enabled';

/**
 * GET - Lecture du flag "exiger abonnement" (admin ou tout authentifié pour affichage).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', KEY)
      .maybeSingle();

    if (error) throw error;
    const enabled = data?.value?.enabled === true;
    return NextResponse.json({ enabled });
  } catch (e) {
    console.error('subscription-gate GET:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Activer/désactiver l'exigence d'abonnement (admin uniquement).
 * Body: { enabled: boolean }
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const enabled = Boolean(body?.enabled);

    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key: KEY, value: { enabled }, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;
    return NextResponse.json({ enabled });
  } catch (e) {
    console.error('subscription-gate PATCH:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur' },
      { status: 500 }
    );
  }
}
