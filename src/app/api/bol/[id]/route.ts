import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// GET - Récupérer un BOL spécifique
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
      .from('bols')
      .select('*, broker:brokers(*), load:loads(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Vérifier que l'utilisateur a accès à ce BOL
    const { data: userData } = await supabase
      .from('users')
      .select('broker_id')
      .eq('id', user.id)
      .single();

    // Admin peut voir tous les BOL, sinon vérifier la propriété
    if (userData?.broker_id && data.broker_id !== userData.broker_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ bol: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Mettre à jour un BOL
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
    const { data: existingBOL } = await supabase
      .from('bols')
      .select('broker_id, status')
      .eq('id', id)
      .single();

    if (!existingBOL) {
      return NextResponse.json({ error: 'BOL introuvable' }, { status: 404 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('broker_id')
      .eq('id', user.id)
      .single();

    if (userData?.broker_id !== existingBOL.broker_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Ne pas permettre la modification si le BOL est signé
    if (existingBOL.status === 'signed') {
      return NextResponse.json(
        { error: 'Impossible de modifier un BOL signé' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.shipperName !== undefined) updateData.shipper_name = body.shipperName;
    if (body.shipperAddress !== undefined) updateData.shipper_address = body.shipperAddress;
    if (body.shipperPhone !== undefined) updateData.shipper_phone = body.shipperPhone;
    if (body.consigneeName !== undefined) updateData.consignee_name = body.consigneeName;
    if (body.consigneeAddress !== undefined) updateData.consignee_address = body.consigneeAddress;
    if (body.consigneePhone !== undefined) updateData.consignee_phone = body.consigneePhone;
    if (body.items !== undefined) updateData.items = body.items;
    if (body.specialInstructions !== undefined) updateData.special_instructions = body.specialInstructions;
    if (body.carrierName !== undefined) updateData.carrier_name = body.carrierName;
    if (body.carrierAddress !== undefined) updateData.carrier_address = body.carrierAddress;
    if (body.carrierPhone !== undefined) updateData.carrier_phone = body.carrierPhone;
    if (body.driverName !== undefined) updateData.driver_name = body.driverName;
    if (body.driverLicense !== undefined) updateData.driver_license = body.driverLicense;
    if (body.vehicleInfo !== undefined) updateData.vehicle_info = body.vehicleInfo;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('bols')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ bol: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer un BOL
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
    const { data: existingBOL } = await supabase
      .from('bols')
      .select('broker_id, status')
      .eq('id', id)
      .single();

    if (!existingBOL) {
      return NextResponse.json({ error: 'BOL introuvable' }, { status: 404 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('broker_id')
      .eq('id', user.id)
      .single();

    if (userData?.broker_id !== existingBOL.broker_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Ne pas permettre la suppression si le BOL est signé
    if (existingBOL.status === 'signed') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un BOL signé' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('bols').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'BOL supprimé avec succès' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

