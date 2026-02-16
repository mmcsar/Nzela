import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// Status transitions autorisées
const VALID_TRANSITIONS: Record<string, string[]> = {
  available: ['bid_accepted', 'cancelled'],
  bid_accepted: ['dispatched', 'cancelled'],
  dispatched: ['en_route_pickup', 'cancelled'],
  en_route_pickup: ['at_pickup'],
  at_pickup: ['loaded'],
  loaded: ['in_transit'],
  in_transit: ['at_delivery'],
  at_delivery: ['delivered'],
  delivered: ['pod_uploaded'],
  pod_uploaded: ['completed'],
  completed: ['disputed'],
  cancelled: [],
  disputed: ['completed', 'cancelled'],
};

// GET - Historique des événements d'un chargement
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get('loadId');

    if (!loadId) {
      return NextResponse.json({ error: 'loadId requis' }, { status: 400 });
    }

    const { data: load } = await supabase
      .from('loads')
      .select('*')
      .eq('id', loadId)
      .single();

    if (!load) {
      return NextResponse.json({ error: 'Chargement non trouvé' }, { status: 404 });
    }

    // Générer la timeline basée sur le statut actuel
    const timeline = generateTimeline(load);

    return NextResponse.json({
      load,
      currentStatus: load.status,
      timeline,
      nextSteps: VALID_TRANSITIONS[load.status] || [],
      workflow: Object.keys(VALID_TRANSITIONS),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Mettre à jour le statut du chargement
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { loadId, newStatus, notes, photos, signature, location } = body;

    if (!loadId || !newStatus) {
      return NextResponse.json({ error: 'loadId et newStatus requis' }, { status: 400 });
    }

    // Vérifier le chargement
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('*')
      .eq('id', loadId)
      .single();

    if (loadError || !load) {
      return NextResponse.json({ error: 'Chargement non trouvé' }, { status: 404 });
    }

    // Vérifier que la transition est valide
    const currentStatus = load.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json({
        error: `Transition invalide: ${currentStatus} → ${newStatus}. Transitions autorisées: ${allowedTransitions.join(', ')}`,
      }, { status: 400 });
    }

    // Mapper le statut vers les statuts de la DB (qui utilise un format différent)
    const dbStatusMap: Record<string, string> = {
      bid_accepted: 'booked',
      dispatched: 'booked',
      en_route_pickup: 'booked',
      at_pickup: 'booked',
      loaded: 'in-transit',
      in_transit: 'in-transit',
      at_delivery: 'in-transit',
      delivered: 'completed',
      pod_uploaded: 'completed',
      completed: 'completed',
      cancelled: 'available', // ou un statut cancelled dédié
      disputed: 'completed',
    };

    const dbStatus = dbStatusMap[newStatus] || newStatus;

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('loads')
      .update({ status: dbStatus })
      .eq('id', loadId);

    if (updateError) throw updateError;

    // Créer l'événement
    const event = {
      id: `evt-${Date.now()}`,
      loadId,
      status: newStatus,
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      notes: notes || null,
      photos: photos || [],
      signature: signature || null,
      location: location || null,
    };

    return NextResponse.json({
      success: true,
      event,
      previousStatus: currentStatus,
      newStatus,
      dbStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateTimeline(load: any) {
  const statusOrder = [
    'available', 'bid_accepted', 'dispatched', 'en_route_pickup',
    'at_pickup', 'loaded', 'in_transit', 'at_delivery',
    'delivered', 'pod_uploaded', 'completed',
  ];

  const statusLabels: Record<string, string> = {
    available: 'Publié',
    bid_accepted: 'Offre acceptée',
    dispatched: 'Dispatché',
    en_route_pickup: 'En route (pickup)',
    at_pickup: 'Arrivé au chargement',
    loaded: 'Chargé',
    in_transit: 'En transit',
    at_delivery: 'Arrivé à destination',
    delivered: 'Livré',
    pod_uploaded: 'POD soumis',
    completed: 'Terminé',
    cancelled: 'Annulé',
    disputed: 'Litige',
  };

  // Map DB status to workflow status
  const dbToWorkflow: Record<string, string> = {
    available: 'available',
    booked: 'bid_accepted',
    'in-transit': 'in_transit',
    completed: 'completed',
  };

  const currentWorkflowStatus = dbToWorkflow[load.status] || load.status;
  const currentIdx = statusOrder.indexOf(currentWorkflowStatus);

  const baseTime = new Date(load.created_at || Date.now());

  return statusOrder.map((status, i) => ({
    status,
    label: statusLabels[status] || status,
    completed: i <= currentIdx,
    current: i === currentIdx,
    timestamp: i <= currentIdx
      ? new Date(baseTime.getTime() + i * 3600000).toISOString()
      : null,
  }));
}
