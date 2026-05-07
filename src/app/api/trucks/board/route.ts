import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitRaw = Number(searchParams.get('limit') || 80);
    const limit = Number.isNaN(limitRaw) ? 80 : Math.min(Math.max(limitRaw, 1), 200);

    let query = supabase
      .from('trucks')
      .select(
        `
          id,
          created_at,
          type,
          capacity,
          current_location,
          destination,
          price,
          price_per_km,
          available_date,
          status,
          features,
          company:companies(name, phone, email, city)
        `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
