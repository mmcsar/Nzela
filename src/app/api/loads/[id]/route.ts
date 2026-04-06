import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// GET - Récupérer un load spécifique
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
      .from('loads')
      .select('*, broker:brokers(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Vérifier que l'utilisateur a accès à ce load
    const { data: userData } = await supabase
      .from('users')
      .select('broker_id')
      .eq('id', user.id)
      .single();

    // Admin peut voir tous les loads, sinon vérifier la propriété
    if (userData?.broker_id && data.broker_id !== userData.broker_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ load: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Mettre à jour un load
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
    const { data: existingLoad } = await supabase
      .from('loads')
      .select('broker_id')
      .eq('id', id)
      .single();

    if (!existingLoad) {
      return NextResponse.json({ error: 'Load introuvable' }, { status: 404 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('broker_id')
      .eq('id', user.id)
      .single();

    if (userData?.broker_id !== existingLoad.broker_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.origin !== undefined) updateData.origin = body.origin;
    if (body.destination !== undefined) updateData.destination = body.destination;
    if (body.trailerType !== undefined) updateData.trailer_type = body.trailerType;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.distance !== undefined) updateData.distance = body.distance;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.pricePerKm !== undefined) updateData.price_per_km = body.pricePerKm;
    if (body.pickupDate !== undefined) updateData.pickup_date = body.pickupDate;
    if (body.deliveryDate !== undefined) updateData.delivery_date = body.deliveryDate;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('loads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ load: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer un load
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

    const { data: existingLoad } = await supabase
      .from('loads')
      .select('broker_id, status')
      .eq('id', id)
      .single();

    if (!existingLoad) {
      return NextResponse.json({ error: 'Load introuvable' }, { status: 404 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('broker_id, role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const isOwner =
      userData?.broker_id != null && userData.broker_id === existingLoad.broker_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Admin (sans être le courtier propriétaire) : nettoyer les chargements déjà pris — pas les offres encore « disponibles »
    if (isAdmin && !isOwner) {
      if (existingLoad.status === 'available') {
        return NextResponse.json(
          {
            error:
              'Un chargement encore disponible doit être retiré par le courtier propriétaire.',
          },
          { status: 403 }
        );
      }
      let adminClient;
      try {
        adminClient = createServiceRoleClient();
      } catch {
        return NextResponse.json(
          { error: 'Suppression admin indisponible (configuration serveur).' },
          { status: 503 }
        );
      }
      const { error } = await adminClient.from('loads').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ message: 'Load supprimé avec succès' });
    }

    const { error } = await supabase.from('loads').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Load supprimé avec succès' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

