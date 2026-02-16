import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer la company de l'utilisateur
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Vous devez être une entreprise pour faire une offre' },
        { status: 403 }
      );
    }

    // Vérifier que le chargement existe et est disponible
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('id, status, price')
      .eq('id', body.loadId)
      .single();

    if (loadError || !load) {
      return NextResponse.json({ error: 'Chargement introuvable' }, { status: 404 });
    }

    if (load.status !== 'available') {
      return NextResponse.json({ error: 'Ce chargement n\'est plus disponible' }, { status: 400 });
    }

    // Insérer l'offre
    const bidData = {
      load_id: body.loadId,
      company_id: company.id,
      amount: parseFloat(body.amount),
      status: 'pending',
      notes: body.notes || '',
    };

    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert(bidData)
      .select()
      .single();

    if (bidError) {
      console.error('Error creating bid:', bidError);
      return NextResponse.json({ error: bidError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, bid }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/loads/bid:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get('loadId');

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let query = supabase
      .from('bids')
      .select('*, company:companies(name), load:loads(id, price)');

    if (loadId) {
      query = query.eq('load_id', loadId);
    } else {
      // Récupérer les offres de l'utilisateur
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (company) {
        query = query.eq('company_id', company.id);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bids: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/loads/bid:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


