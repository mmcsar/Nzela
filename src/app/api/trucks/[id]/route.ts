import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// GET - Récupérer un truck spécifique
export async function GET(
  request: NextRequest,
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
      .from('trucks')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Vérifier que l'utilisateur a accès à ce truck
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    // Admin peut voir tous les trucks, sinon vérifier la propriété
    if (userData?.company_id && data.company_id !== userData.company_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ truck: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Mettre à jour un truck
export async function PUT(
  request: NextRequest,
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

    // Vérifier la propriété
    const { data: existingTruck } = await supabase
      .from('trucks')
      .select('company_id')
      .eq('id', id)
      .single();

    if (!existingTruck) {
      return NextResponse.json({ error: 'Truck introuvable' }, { status: 404 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (userData?.company_id !== existingTruck.company_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.type !== undefined) updateData.type = body.type;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.currentLocation !== undefined) updateData.current_location = body.currentLocation;
    if (body.availableDate !== undefined) updateData.available_date = body.availableDate;
    if (body.destination !== undefined) updateData.destination = body.destination;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.pricePerKm !== undefined) updateData.price_per_km = body.pricePerKm;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('trucks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ truck: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer un truck
export async function DELETE(
  request: NextRequest,
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

    // Vérifier la propriété
    const { data: existingTruck } = await supabase
      .from('trucks')
      .select('company_id')
      .eq('id', id)
      .single();

    if (!existingTruck) {
      return NextResponse.json({ error: 'Truck introuvable' }, { status: 404 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (userData?.company_id !== existingTruck.company_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { error } = await supabase.from('trucks').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Truck supprimé avec succès' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

