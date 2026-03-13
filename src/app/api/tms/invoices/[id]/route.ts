import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET - Détail d'une facture transport */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { data, error } = await supabase
      .from('transport_invoices')
      .select('*, load:loads(origin, destination, price, status, broker_id), broker:brokers(name, phone, email, address)')
      .eq('id', id)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    return NextResponse.json({ invoice: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH - Mettre à jour statut et/ou notes */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { status, notes } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status !== undefined) {
      if (!['draft', 'sent', 'paid', 'cancelled'].includes(status)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
      }
      updates.status = status;
    }
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('transport_invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ invoice: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
