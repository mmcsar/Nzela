import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Liste des entreprises
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le rôle
    const { data: userData } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');

    let query = supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    // Si non-admin, ne voir que sa propre entreprise
    if (userData?.role !== 'admin') {
      if (!userData?.company_id) {
        return NextResponse.json({ companies: [] });
      }
      query = query.eq('id', userData.company_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ companies: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Créer une entreprise
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
    const { name, registrationNumber, address, city, province, phone, email } = body;

    // Validation
    if (!name || !registrationNumber || !address || !city || !province || !phone || !email) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis: name, registrationNumber, address, city, province, phone, email' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        name,
        registration_number: registrationNumber,
        address,
        city,
        province,
        phone,
        email,
        owner_id: user.id,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Lier l'entreprise à l'utilisateur
    await supabase
      .from('users')
      .update({ company_id: data.id })
      .eq('id', user.id);

    return NextResponse.json({ company: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
