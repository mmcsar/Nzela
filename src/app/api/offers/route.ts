import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// GET - Liste des offres pour un load ou pour l'utilisateur
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get('load_id');
    const direction = searchParams.get('direction') || 'all'; // sent, received, all

    let query = supabase
      .from('offers')
      .select('*, load:loads(id, origin, destination, price, trailer_type, weight), from_user:users!offers_from_user_id_fkey(id, email, full_name, role), to_user:users!offers_to_user_id_fkey(id, email, full_name, role)')
      .order('created_at', { ascending: false });

    if (loadId) {
      query = query.eq('load_id', loadId);
    } else {
      if (direction === 'sent') {
        query = query.eq('from_user_id', auth.userId);
      } else if (direction === 'received') {
        query = query.eq('to_user_id', auth.userId);
      } else {
        query = query.or(`from_user_id.eq.${auth.userId},to_user_id.eq.${auth.userId}`);
      }
    }

    const { data: offers, error } = await query.limit(50);
    if (error) throw error;

    return NextResponse.json({ offers: offers || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Creer une offre ou contre-offre
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { load_id, to_user_id, amount, currency, message, parent_offer_id } = body;

    if (!load_id || !to_user_id || !amount) {
      return NextResponse.json({ error: 'load_id, to_user_id et amount requis' }, { status: 400 });
    }

    // Verifier que l'offre n'est pas a soi-meme
    if (to_user_id === auth.userId) {
      return NextResponse.json({ error: 'Vous ne pouvez pas faire une offre a vous-meme' }, { status: 400 });
    }

    // Si c'est une contre-offre, mettre a jour l'offre parent
    if (parent_offer_id) {
      await supabase
        .from('offers')
        .update({ status: 'countered' })
        .eq('id', parent_offer_id);
    }

    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        load_id,
        from_user_id: auth.userId,
        to_user_id,
        amount,
        currency: currency || 'CDF',
        message: message || null,
        parent_offer_id: parent_offer_id || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ offer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Accepter, refuser ou annuler une offre
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'id et action requis' }, { status: 400 });
    }

    const validActions = ['accepted', 'rejected', 'cancelled'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Verifier que l'utilisateur est concerne par l'offre
    const { data: offer } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .single();

    if (!offer) {
      return NextResponse.json({ error: 'Offre non trouvee' }, { status: 404 });
    }

    // Seul le destinataire peut accepter/rejeter, l'emetteur peut annuler
    if (action === 'cancelled' && offer.from_user_id !== auth.userId) {
      return NextResponse.json({ error: 'Seul l\'emetteur peut annuler' }, { status: 403 });
    }
    if ((action === 'accepted' || action === 'rejected') && offer.to_user_id !== auth.userId) {
      return NextResponse.json({ error: 'Seul le destinataire peut accepter/refuser' }, { status: 403 });
    }

    const { error } = await supabase
      .from('offers')
      .update({ status: action })
      .eq('id', id);

    if (error) throw error;

    // Si accepte, mettre a jour le prix du load
    if (action === 'accepted') {
      await supabase
        .from('loads')
        .update({ price: offer.amount, status: 'booked' })
        .eq('id', offer.load_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
