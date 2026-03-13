import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

export const dynamic = 'force-dynamic';

/** GET - Liste des factures transport (pour le broker/company/admin connecté) */
export async function GET() {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { data, error } = await supabase
      .from('transport_invoices')
      .select('id, load_id, broker_id, company_id, amount, currency, status, invoice_number, notes, created_at, load:loads(origin, destination, price, status), broker:brokers(name)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return NextResponse.json({ invoices: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST - Créer une facture à partir d'un chargement terminé */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { loadId } = body;
    if (!loadId) return NextResponse.json({ error: 'loadId requis' }, { status: 400 });

    const { data: load, error: loadErr } = await supabase
      .from('loads')
      .select('id, broker_id, price, status')
      .eq('id', loadId)
      .single();

    if (loadErr || !load) return NextResponse.json({ error: 'Chargement non trouvé' }, { status: 404 });
    if (load.status !== 'completed') return NextResponse.json({ error: 'Seuls les chargements terminés peuvent être facturés' }, { status: 400 });

    if (auth.role === 'broker' && auth.brokerId && load.broker_id !== auth.brokerId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from('transport_invoices')
      .select('id')
      .eq('load_id', loadId)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: 'Une facture existe déjà pour ce chargement' }, { status: 409 });

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${loadId.slice(0, 8)}`;
    const { data: invoice, error: insertErr } = await supabase
      .from('transport_invoices')
      .insert({
        load_id: loadId,
        broker_id: load.broker_id,
        amount: Number(load.price) || 0,
        currency: 'CDF',
        status: 'draft',
        invoice_number: invoiceNumber,
      })
      .select('id, load_id, amount, currency, status, invoice_number, created_at')
      .single();

    if (insertErr) throw insertErr;
    return NextResponse.json({ invoice });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
