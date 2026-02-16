import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireBroker } from '@/lib/auth/checkRole';

// Stockage temporaire en mémoire (à remplacer par une table Supabase)
// En production, créer une table 'load_templates' dans Supabase
const templates: Map<string, any[]> = new Map();

// GET - Liste des templates de l'utilisateur
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireBroker(supabase);
    if (!auth.allowed) return auth.response!;

    const userTemplates = templates.get(auth.userId) || getDefaultTemplates();

    return NextResponse.json({ templates: userTemplates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Créer un template
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireBroker(supabase);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { name, origin, destination, trailerType, weight, cargoType, price, notes, recurring } = body;

    if (!name || !origin || !destination) {
      return NextResponse.json({ error: 'name, origin, destination requis' }, { status: 400 });
    }

    const template = {
      id: `tpl-${Date.now()}`,
      userId: auth.userId,
      name,
      origin,
      destination,
      trailerType: trailerType || 'flatbed',
      weight: weight || 0,
      cargoType: cargoType || 'general',
      price: price || 0,
      notes: notes || '',
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    const userTemplates = templates.get(auth.userId) || [];
    userTemplates.push(template);
    templates.set(auth.userId, userTemplates);

    // Si récurrent, créer la récurrence
    let recurringLoad = null;
    if (recurring) {
      recurringLoad = {
        id: `rec-${Date.now()}`,
        templateId: template.id,
        userId: auth.userId,
        frequency: recurring.frequency || 'weekly',
        dayOfWeek: recurring.dayOfWeek,
        dayOfMonth: recurring.dayOfMonth,
        startDate: recurring.startDate || new Date().toISOString(),
        endDate: recurring.endDate || null,
        isActive: true,
        nextGeneration: calculateNextGeneration(recurring),
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ template, recurringLoad }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Utiliser un template pour créer un load
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId requis' }, { status: 400 });
    }

    const userTemplates = templates.get(user.id) || getDefaultTemplates();
    const template = userTemplates.find((t) => t.id === templateId);

    if (!template) {
      return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 });
    }

    // Récupérer le broker_id de l'utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('broker_id')
      .eq('id', user.id)
      .single();

    if (!userData?.broker_id) {
      return NextResponse.json({ error: 'Utilisateur non lié à un courtier' }, { status: 403 });
    }

    // Créer le load à partir du template
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .insert({
        broker_id: userData.broker_id,
        origin: typeof template.origin === 'string' ? template.origin : JSON.stringify(template.origin),
        destination: typeof template.destination === 'string' ? template.destination : JSON.stringify(template.destination),
        trailer_type: template.trailerType,
        weight: template.weight,
        cargo_type: template.cargoType,
        price: template.price,
        pickup_date: new Date().toISOString(),
        status: 'available',
      })
      .select()
      .single();

    if (loadError) throw loadError;

    // Incrémenter le compteur d'utilisation
    template.usageCount = (template.usageCount || 0) + 1;

    return NextResponse.json({ load, template });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDefaultTemplates() {
  return [
    {
      id: 'tpl-default-1',
      name: 'Minerais Lubumbashi → Kolwezi',
      origin: { city: 'Lubumbashi', province: 'haut-katanga', address: '' },
      destination: { city: 'Kolwezi', province: 'lualaba', address: '' },
      trailerType: 'flatbed',
      weight: 25000,
      cargoType: 'minerais',
      price: 350000,
      notes: 'Route habituelle minerais',
      usageCount: 12,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'tpl-default-2',
      name: 'Ciment Likasi → Lubumbashi',
      origin: { city: 'Likasi', province: 'haut-katanga', address: '' },
      destination: { city: 'Lubumbashi', province: 'haut-katanga', address: '' },
      trailerType: 'dry-van',
      weight: 30000,
      cargoType: 'ciment',
      price: 150000,
      notes: '',
      usageCount: 8,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];
}

function calculateNextGeneration(recurring: any): string {
  const now = new Date();
  switch (recurring.frequency) {
    case 'daily':
      return new Date(now.getTime() + 86400000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 86400000).toISOString();
    case 'biweekly':
      return new Date(now.getTime() + 14 * 86400000).toISOString();
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
    default:
      return new Date(now.getTime() + 7 * 86400000).toISOString();
  }
}
