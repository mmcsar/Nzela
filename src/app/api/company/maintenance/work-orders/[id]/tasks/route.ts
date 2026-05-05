import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCompanyOnly } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('work_order_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ tasks: data || [] });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const title = String(body.title || '').trim();
    const instructions = body.instructions ? String(body.instructions).trim() : null;
    const checklistCode = body.checklistCode ? String(body.checklistCode).trim() : null;
    const isMandatory = body.isMandatory == null ? true : Boolean(body.isMandatory);

    if (!title) {
      return NextResponse.json({ error: 'title requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert({
        work_order_id: id,
        title,
        instructions,
        checklist_code: checklistCode,
        is_mandatory: isMandatory,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
