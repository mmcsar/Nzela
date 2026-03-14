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
      .select('id, load_id, broker_id, company_id, amount, currency, status, invoice_number, notes, created_at, load:loads(origin, destination, price, status), broker:brokers(name, address, city, phone, registration_number), company:companies(name, address, city, phone, registration_number)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return NextResponse.json({ invoices: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST - Créer une facture : à partir d'un chargement terminé OU manuellement (montant + devise) */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { loadId, amount, currency, notes } = body as {
      loadId?: string;
      amount?: number;
      currency?: string;
      notes?: string;
    };

    let load_id: string | null = null;
    let broker_id: string | null = auth.brokerId ?? null;
    let company_id: string | null = null;
    let finalAmount: number;
    let finalCurrency: string;

    if (loadId) {
      // Création à partir d'un chargement
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

      load_id = load.id;
      broker_id = load.broker_id ?? broker_id;
      finalAmount = Number(load.price) || 0;
      finalCurrency = 'CDF';
    } else {
      // Création manuelle : montant et devise requis
      const numAmount = amount != null ? Number(amount) : NaN;
      if (Number.isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: 'Montant invalide (obligatoire pour une facture manuelle)' }, { status: 400 });
      }
      finalAmount = numAmount;
      finalCurrency = currency === 'USD' ? 'USD' : 'CDF';
      if (auth.role === 'broker' && !broker_id) {
        return NextResponse.json({ error: 'Aucun profil courtier lié' }, { status: 403 });
      }
    }

    const suffix = load_id ? load_id.slice(0, 8) : Date.now().toString(36);
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${suffix}`;

    const { data: invoice, error: insertErr } = await supabase
      .from('transport_invoices')
      .insert({
        load_id: load_id,
        broker_id: broker_id,
        company_id: company_id,
        amount: finalAmount,
        currency: finalCurrency,
        status: 'draft',
        invoice_number: invoiceNumber,
        notes: notes && String(notes).trim() ? String(notes).trim() : null,
      })
      .select('id, load_id, amount, currency, status, invoice_number, notes, created_at')
      .single();

    if (insertErr) throw insertErr;
    return NextResponse.json({ invoice });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
