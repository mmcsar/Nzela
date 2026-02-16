import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Liste des BOL (pour l'utilisateur connecté)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get user's broker
    const { data: userData } = await supabase
      .from('users')
      .select('broker_id')
      .eq('id', user.id)
      .single();

    if (!userData?.broker_id) {
      return NextResponse.json({ error: 'Aucun broker associé' }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let query = supabase
      .from('bols')
      .select('*, broker:brokers(*), load:loads(*)')
      .eq('broker_id', userData.broker_id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ bols: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Créer un BOL
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get user's broker
    const { data: userData } = await supabase
      .from('users')
      .select('broker_id')
      .eq('id', user.id)
      .single();

    if (!userData?.broker_id) {
      return NextResponse.json({ error: 'Aucun broker associé' }, { status: 403 });
    }

    const body = await request.json();
    const {
      loadId,
      shipperName,
      shipperAddress,
      shipperPhone,
      consigneeName,
      consigneeAddress,
      consigneePhone,
      items,
      specialInstructions,
      carrierName,
      carrierAddress,
      carrierPhone,
      driverName,
      driverLicense,
      vehicleInfo,
    } = body;

    // Validation
    if (
      !loadId ||
      !shipperName ||
      !shipperAddress ||
      !consigneeName ||
      !consigneeAddress ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Vérifier que le load appartient au broker
    const { data: loadData } = await supabase
      .from('loads')
      .select('broker_id')
      .eq('id', loadId)
      .single();

    if (!loadData) {
      return NextResponse.json({ error: 'Load introuvable' }, { status: 404 });
    }

    if (loadData.broker_id !== userData.broker_id) {
      return NextResponse.json({ error: 'Accès refusé au load' }, { status: 403 });
    }

    // Générer un numéro de BOL unique
    const bolNumber = `BOL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data, error } = await supabase
      .from('bols')
      .insert({
        broker_id: userData.broker_id,
        load_id: loadId,
        bol_number: bolNumber,
        shipper_name: shipperName,
        shipper_address: shipperAddress,
        shipper_phone: shipperPhone || null,
        consignee_name: consigneeName,
        consignee_address: consigneeAddress,
        consignee_phone: consigneePhone || null,
        items: items,
        special_instructions: specialInstructions || null,
        carrier_name: carrierName || null,
        carrier_address: carrierAddress || null,
        carrier_phone: carrierPhone || null,
        driver_name: driverName || null,
        driver_license: driverLicense || null,
        vehicle_info: vehicleInfo || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ bol: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

