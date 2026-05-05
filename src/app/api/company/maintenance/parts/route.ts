import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCompanyOnly } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';
import { parsePagination, applyPagination, paginatedResponse } from '@/lib/api/pagination';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;
    if (!auth.companyId) return paginatedResponse([], 0, parsePagination(request));

    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const onlyLowStock = searchParams.get('onlyLowStock') === 'true';

    let query = supabase
      .from('maintenance_parts')
      .select('*', { count: 'exact' })
      .eq('company_id', auth.companyId)
      .order('name', { ascending: true });

    if (q) query = query.or(`sku.ilike.%${q}%,name.ilike.%${q}%,category.ilike.%${q}%`);
    if (onlyLowStock) query = query.filter('stock_qty', 'lte', 'min_stock_qty');

    query = applyPagination(query, pagination);
    const { data, error, count } = await query;
    if (error) throw error;
    return paginatedResponse(data, count, pagination);
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireCompanyOnly(supabase);
    if (!auth.allowed) return auth.response!;
    if (!auth.companyId) return NextResponse.json({ error: 'Aucune entreprise associée' }, { status: 403 });

    const body = await request.json();
    const sku = String(body.sku || '').trim().toUpperCase();
    const name = String(body.name || '').trim();
    const category = body.category ? String(body.category).trim() : null;
    const unit = body.unit ? String(body.unit).trim() : 'unit';
    const stockQty = body.stockQty == null ? 0 : Number(body.stockQty);
    const minStockQty = body.minStockQty == null ? 0 : Number(body.minStockQty);
    const avgUnitCost = body.avgUnitCost == null ? 0 : Number(body.avgUnitCost);
    const currency = body.currency === 'CDF' ? 'CDF' : 'USD';

    if (!sku || !name) return NextResponse.json({ error: 'sku et name requis' }, { status: 400 });
    if ([stockQty, minStockQty, avgUnitCost].some((v) => Number.isNaN(v) || v < 0)) {
      return NextResponse.json({ error: 'Valeurs stock/cout invalides' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('maintenance_parts')
      .insert({
        company_id: auth.companyId,
        sku,
        name,
        category,
        unit,
        stock_qty: stockQty,
        min_stock_qty: minStockQty,
        avg_unit_cost: avgUnitCost,
        currency,
      })
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ part: data }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error) as Response;
  }
}
