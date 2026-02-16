import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// GET - Recuperer le credit check d'une entite
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entity_type et entity_id requis' }, { status: 400 });
    }

    // Chercher un credit check recent (< 30 jours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await supabase
      .from('credit_checks')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ creditCheck: existing, cached: true });
    }

    return NextResponse.json({ creditCheck: null, cached: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Demander un credit check
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { entity_type, entity_id } = body;

    if (!entity_type || !entity_id) {
      return NextResponse.json({ error: 'entity_type et entity_id requis' }, { status: 400 });
    }

    // Recuperer les infos de l'entite
    const table = entity_type === 'broker' ? 'brokers' : 'companies';
    const { data: entity } = await supabase
      .from(table)
      .select('*')
      .eq('id', entity_id)
      .single();

    if (!entity) {
      return NextResponse.json({ error: 'Entite non trouvee' }, { status: 404 });
    }

    // Recuperer l'historique de paiements de l'entite
    const { data: entityUser } = await supabase
      .from('users')
      .select('id')
      .eq(entity_type === 'broker' ? 'broker_id' : 'company_id', entity_id)
      .single();

    let payments: any[] = [];
    let completedLoads = 0;

    if (entityUser) {
      // Paiements
      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', entityUser.id)
        .order('created_at', { ascending: false })
        .limit(50);
      payments = paymentData || [];
    }

    // Loads completes
    if (entity_type === 'broker') {
      const { count } = await supabase
        .from('loads')
        .select('*', { count: 'exact', head: true })
        .eq('broker_id', entity_id)
        .eq('status', 'completed');
      completedLoads = count || 0;
    }

    // Recuperer le score de fiabilite
    const { data: reliability } = await supabase
      .from('reliability_scores')
      .select('*')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .single();

    // Calculer le credit score
    const totalPayments = payments.length;
    const completedPayments = payments.filter((p: any) => p.status === 'completed').length;
    const failedPayments = payments.filter((p: any) => p.status === 'failed').length;
    const totalAmount = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const paymentRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 50;

    // Score: 0-100
    let creditScore = 50; // Score de base
    creditScore += (paymentRate - 50) * 0.3; // +/- 15 points basees sur les paiements
    creditScore += Math.min(completedLoads * 2, 20); // +20 max pour les livraisons
    creditScore += (reliability?.avg_rating || 2.5 - 2.5) * 4; // +/- 10 pour la fiabilite
    if (entity.status === 'active') creditScore += 5;
    if (entity.status === 'suspended') creditScore -= 20;
    creditScore = Math.max(0, Math.min(100, Math.round(creditScore)));

    // Niveau de risque
    let riskLevel: string;
    if (creditScore >= 75) riskLevel = 'low';
    else if (creditScore >= 50) riskLevel = 'medium';
    else if (creditScore >= 25) riskLevel = 'high';
    else riskLevel = 'critical';

    // Sauvegarder le credit check
    const { data: creditCheck, error } = await supabase
      .from('credit_checks')
      .insert({
        entity_type,
        entity_id,
        requested_by: auth.userId,
        credit_score: creditScore,
        risk_level: riskLevel,
        payment_history: {
          total: totalPayments,
          completed: completedPayments,
          failed: failedPayments,
          totalAmount,
          paymentRate: Math.round(paymentRate),
        },
        outstanding_balance: 0,
        total_transactions: totalPayments + completedLoads,
        avg_payment_days: 0,
        status: 'completed',
        report: {
          entityName: entity.name,
          entityStatus: entity.status,
          registrationNumber: entity.registration_number,
          reliabilityScore: reliability?.avg_rating || 0,
          completedDeliveries: completedLoads,
        },
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ creditCheck }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
