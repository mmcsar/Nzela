import { NextResponse } from 'next/server';

/**
 * Rate Limiter en mémoire (pour déploiement simple)
 * Pour la production avec plusieurs instances : migrer vers Redis/Upstash
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60000, max: 30 });
 *   // Dans la route:
 *   const rateLimitResult = limiter.check(userId);
 *   if (!rateLimitResult.allowed) return rateLimitResult.response;
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  /** Fenêtre de temps en millisecondes (défaut: 60s) */
  windowMs?: number;
  /** Nombre max de requêtes par fenêtre (défaut: 30) */
  max?: number;
  /** Message d'erreur personnalisé */
  message?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  response?: Response;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Nettoyage automatique des entrées expirées toutes les 5 minutes
if (typeof globalThis !== 'undefined') {
  const cleanupInterval = 5 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        if (entry.resetAt < now) {
          store.delete(key);
        }
      }
    }
  }, cleanupInterval);
}

export function createRateLimiter(config: RateLimiterConfig = {}) {
  const {
    windowMs = 60_000,
    max = 30,
    message = 'Trop de requêtes. Réessayez plus tard.',
  } = config;

  const storeKey = `${windowMs}-${max}`;
  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map());
  }
  const store = stores.get(storeKey)!;

  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || entry.resetAt < now) {
        // Nouvelle fenêtre
        store.set(identifier, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
      }

      entry.count++;

      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.resetAt,
          response: NextResponse.json(
            {
              error: {
                code: 'RATE_LIMITED',
                message,
                retryAfter,
              },
            },
            {
              status: 429,
              headers: {
                'Retry-After': String(retryAfter),
                'X-RateLimit-Limit': String(max),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(entry.resetAt),
              },
            }
          ),
        };
      }

      return {
        allowed: true,
        remaining: max - entry.count,
        resetAt: entry.resetAt,
      };
    },
  };
}

// Rate limiters pré-configurés pour différentes routes
export const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });       // 60 req/min - routes générales
export const authLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });       // 10 req/min - login/register
export const matchingLimiter = createRateLimiter({ windowMs: 60_000, max: 15 });   // 15 req/min - matching (coûteux)
export const messageLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });    // 30 req/min - messages
