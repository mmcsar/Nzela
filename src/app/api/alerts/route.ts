import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// GET - Liste des alertes de l'utilisateur + verification des correspondances
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const check = searchParams.get('check') === 'true';

    const { data: alerts, error } = await supabase
      .from('load_alerts')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (check && alerts && alerts.length > 0) {
      const { data: loads } = await supabase
        .from('loads')
        .select('*, broker:brokers(name)')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(100);

      const alertsWithMatches = alerts.map((alert: any) => {
        const matches = (loads || []).filter((load: any) => matchLoadToAlert(load, alert.criteria));
        return {
          ...alert,
          matches: matches.length,
          recentMatches: matches.slice(0, 5).map((l: any) => {
            const origin = typeof l.origin === 'string' ? JSON.parse(l.origin) : l.origin;
            const dest = typeof l.destination === 'string' ? JSON.parse(l.destination) : l.destination;
            return {
              id: l.id,
              origin_city: origin?.city || '',
              destination_city: dest?.city || '',
              price: l.price,
              weight: l.weight,
              trailer_type: l.trailer_type,
              broker_name: l.broker?.name || '',
              created_at: l.created_at,
            };
          }),
        };
      });

      return NextResponse.json({ alerts: alertsWithMatches });
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Creer une alerte
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { name, criteria, frequency, channels } = body;

    if (!name || !criteria) {
      return NextResponse.json({ error: 'name et criteria requis' }, { status: 400 });
    }

    const { data: alert, error } = await supabase
      .from('load_alerts')
      .insert({
        user_id: auth.userId,
        name,
        criteria: {
          originCity: criteria.originCity || null,
          originProvince: criteria.originProvince || null,
          destinationCity: criteria.destinationCity || null,
          destinationProvince: criteria.destinationProvince || null,
          trailerTypes: criteria.trailerTypes || [],
          minWeight: criteria.minWeight || null,
          maxWeight: criteria.maxWeight || null,
          minPrice: criteria.minPrice || null,
          maxPrice: criteria.maxPrice || null,
        },
        frequency: frequency || 'instant',
        channels: channels || ['push'],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ alert }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Activer/desactiver une alerte
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('load_alerts')
      .update({ is_active })
      .eq('id', id)
      .eq('user_id', auth.userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer une alerte
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('load_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', auth.userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function matchLoadToAlert(load: any, criteria: any): boolean {
  try {
    const origin = typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin;
    const dest = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;

    if (criteria.originCity && origin?.city?.toLowerCase() !== criteria.originCity.toLowerCase()) return false;
    if (criteria.destinationCity && dest?.city?.toLowerCase() !== criteria.destinationCity.toLowerCase()) return false;
    if (criteria.trailerTypes?.length > 0 && !criteria.trailerTypes.includes(load.trailer_type)) return false;
    if (criteria.minWeight && load.weight < criteria.minWeight) return false;
    if (criteria.maxWeight && load.weight > criteria.maxWeight) return false;
    if (criteria.minPrice && load.price < criteria.minPrice) return false;
    if (criteria.maxPrice && load.price > criteria.maxPrice) return false;

    return true;
  } catch {
    return false;
  }
}
