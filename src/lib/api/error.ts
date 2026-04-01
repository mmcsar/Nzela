import { NextResponse } from 'next/server';

/**
 * Classe d'erreur standardisée pour toutes les API routes
 * Usage: throw new ApiError(404, 'Load not found', 'LOAD_NOT_FOUND');
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || statusCodeToCode(statusCode);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
      },
    };
  }
}

function statusCodeToCode(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 422: return 'VALIDATION_ERROR';
    case 429: return 'RATE_LIMITED';
    default:  return 'INTERNAL_ERROR';
  }
}

/**
 * Extrait un message d'erreur exploitable depuis une réponse API.
 * Évite "[object Object]" quand l'API renvoie { error: { message, ... } }.
 */
export function toErrorMessage(val: unknown, fallback = 'Erreur inconnue'): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && 'message' in val) {
    const m = (val as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return fallback;
}

/**
 * Extrait un message lisible depuis n'importe quelle valeur d'erreur.
 * Gère Error, PostgrestError (objet avec .message) et valeurs brutes.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  if (typeof error === 'string') return error;
  return 'Erreur interne du serveur';
}

/**
 * Handler d'erreur standardisé pour les API routes
 * Usage: return handleApiError(error);
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  const message = extractErrorMessage(error);

  // Log côté serveur pour faciliter le débogage (visible dans le terminal)
  console.error('[API Error]', message, error);

  const apiError = new ApiError(500, message);
  return NextResponse.json(apiError.toJSON(), { status: 500 });
}
