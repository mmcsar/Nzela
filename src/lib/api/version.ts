import { NextResponse } from 'next/server';

/**
 * API Versioning Helper
 * 
 * Ajoute des headers de version standardisés à chaque réponse API.
 * Permet une migration future vers /api/v2/ sans casser les clients existants.
 * 
 * Usage dans une API route:
 *   return withApiVersion(NextResponse.json({ data }));
 * 
 * Ou dans un middleware:
 *   Les headers sont ajoutés automatiquement.
 */

export const API_VERSION = '1.0.0';
export const API_MIN_SUPPORTED_VERSION = '1.0.0';

/**
 * Ajoute les headers de version à une réponse
 */
export function withApiVersion(response: NextResponse): NextResponse {
  response.headers.set('X-API-Version', API_VERSION);
  response.headers.set('X-API-Min-Version', API_MIN_SUPPORTED_VERSION);
  return response;
}

/**
 * Vérifie si la version demandée par le client est supportée
 */
export function isVersionSupported(requestedVersion?: string): boolean {
  if (!requestedVersion) return true;
  // Simple version comparison (semver-light)
  return requestedVersion >= API_MIN_SUPPORTED_VERSION;
}

/**
 * Headers standards pour toutes les réponses API
 */
export const apiHeaders = {
  'X-API-Version': API_VERSION,
  'X-RateLimit-Policy': 'sliding-window',
  'Cache-Control': 'no-store, max-age=0',
};
