import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCompanyOnly } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = String(body.title || '').trim();
    if (body.instructions !== undefined) updateData.instructions = body.instructions ? String(body.instructions).trim() : null;
    if (body.checklistCode !== undefined) updateData.checklist_code = body.checklistCode ? String(body.checklistCode).trim() : null;
    if (body.isMandatory !== undefined) updateData.is_mandatory = Boolean(body.isMandatory);
    if (body.status !== undefined) updateData.status = String(body.status);
    if (body.resultNote !== undefined) updateData.result_note = body.resultNote ? String(body.resultNote).trim() : null;

    if (body.status === 'done' || body.status === 'failed' || body.status === 'skipped') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = auth.userId;
    }

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;

    const { error } = await supabase.from('maintenance_tasks').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
