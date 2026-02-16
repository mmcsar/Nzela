import { NextResponse } from 'next/server';

/**
 * Pagination standardisée pour toutes les API
 * 
 * Usage dans une API route:
 *   const pagination = parsePagination(request);
 *   let query = supabase.from('loads').select('*', { count: 'exact' });
 *   query = applyPagination(query, pagination);
 *   const { data, count } = await query;
 *   return paginatedResponse(data, count, pagination);
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse les paramètres de pagination depuis l'URL
 */
export function parsePagination(request: Request): PaginationParams {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Applique la pagination à une requête Supabase
 */
export function applyPagination(query: any, pagination: PaginationParams) {
  return query.range(pagination.offset, pagination.offset + pagination.limit - 1);
}

/**
 * Génère une réponse paginée standardisée
 */
export function paginatedResponse<T>(
  data: T[] | null,
  total: number | null,
  pagination: PaginationParams,
  meta?: Record<string, any>
): Response {
  const items = data || [];
  const totalCount = total || 0;
  const totalPages = Math.ceil(totalCount / pagination.limit);

  const result: PaginatedResult<T> = {
    data: items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: totalCount,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };

  return NextResponse.json({ ...result, ...meta });
}
