import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface AssociationRequestRow {
  id: string;
  user_id: string;
  entity_type: 'company' | 'broker';
  created_at: string;
  email?: string | null;
  full_name?: string | null;
}

/**
 * GET: liste des demandes d'association (admin only, RLS is_admin()).
 * DELETE: supprimer une demande (marquer comme traitée).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: adminData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (adminData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin requis' }, { status: 403 });
    }

    const { data: requests, error: reqErr } = await supabase
      .from('association_requests')
      .select('id, user_id, entity_type, created_at')
      .order('created_at', { ascending: false });

    if (reqErr) {
      console.error('association-requests GET:', reqErr);
      return NextResponse.json({ error: reqErr.message }, { status: 500 });
    }

    if (!requests?.length) {
      return NextResponse.json({ requests: [] });
    }

    const userIds = [...new Set((requests as { user_id: string }[]).map((r) => r.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds);

    const userMap = new Map(
      (users || []).map((u: { id: string; email?: string; full_name?: string }) => [u.id, u])
    );

    const result: AssociationRequestRow[] = (requests || []).map((r: { id: string; user_id: string; entity_type: 'company' | 'broker'; created_at: string }) => {
      const u = userMap.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        entity_type: r.entity_type,
        created_at: r.created_at,
        email: u?.email ?? null,
        full_name: u?.full_name ?? null,
      };
    });

    return NextResponse.json({ requests: result });
  } catch (error: unknown) {
    console.error('association-requests GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: supprimer une demande (admin only).
 * Body: { id: string }
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: adminData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (adminData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin requis' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { id } = body as { id?: string };
    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('association_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('association-requests DELETE:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('association-requests DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
