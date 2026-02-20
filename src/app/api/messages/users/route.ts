import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';

/**
 * GET /api/messages/users
 * Liste des utilisateurs avec qui on peut démarrer une conversation (broker, company).
 * Utilise le service role car le RLS sur users ne permet pas de lire les autres utilisateurs.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    let serviceClient;
    try {
      serviceClient = createServiceRoleClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('SERVICE_ROLE') || msg.includes('requis')) {
        return NextResponse.json({
          users: [],
          message: 'SUPABASE_SERVICE_ROLE_KEY non configurée. Liste des destinataires indisponible.',
        });
      }
      throw e;
    }

    const { data: users, error } = await serviceClient
      .from('users')
      .select('id, email, full_name, role')
      .in('role', ['broker', 'company', 'admin'])
      .neq('id', auth.userId)
      .order('full_name');

    if (error) throw error;

    return NextResponse.json({
      users: (users || []).map((u: { id: string; email?: string; full_name?: string; role?: string }) => ({
        id: u.id,
        name: u.full_name || u.email?.split('@')[0] || 'Utilisateur',
        email: u.email || '',
        role: u.role || 'user',
      })),
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
