import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Les favoris sont stockés dans la table users -> metadata (ou un champ dédié)
// Pour simplifier, on utilise localStorage côté client + un endpoint de sync

// GET - Récupérer les favoris de l'utilisateur
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'load' | 'truck'

    // Récupérer les favoris depuis les metadata utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les chargements favoris
    if (type === 'load' || !type) {
      const { data: loads } = await supabase
        .from('loads')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(20);

      return NextResponse.json({
        favorites: (loads || []).map((l) => ({
          id: l.id,
          type: 'load',
          data: l,
        })),
      });
    }

    if (type === 'truck') {
      const { data: trucks } = await supabase
        .from('trucks')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(20);

      return NextResponse.json({
        favorites: (trucks || []).map((t) => ({
          id: t.id,
          type: 'truck',
          data: t,
        })),
      });
    }

    return NextResponse.json({ favorites: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
