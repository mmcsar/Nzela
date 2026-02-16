/**
 * API Utilities - Barrel Export
 * 
 * Toutes les utilitaires API centralisées:
 * - Error handling standardisé
 * - Pagination
 * - Rate limiting
 * - Versioning
 */

export { ApiError, handleApiError } from './error';
export { parsePagination, applyPagination, paginatedResponse } from './pagination';
export type { PaginationParams, PaginatedResult } from './pagination';
export { createRateLimiter, apiLimiter, authLimiter, matchingLimiter, messageLimiter } from './rate-limit';
export { API_VERSION, withApiVersion, isVersionSupported, apiHeaders } from './version';
