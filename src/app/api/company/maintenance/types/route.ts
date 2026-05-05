import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCompany } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const auth = await requireCompany(supabase);
    if (!auth.allowed) return auth.response!;

    const { data, error } = await supabase
      .from('maintenance_types')
      .select('*')
      .eq('is_active', true)
      .order('label_fr', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ types: data || [] });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
