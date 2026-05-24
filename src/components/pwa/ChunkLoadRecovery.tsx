'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'nzela-chunk-reload';

function isChunkLoadFailure(message: string): boolean {
  return (
    /loading chunk \d+/i.test(message) ||
    /chunkloaderror/i.test(message) ||
    /failed to fetch dynamically imported module/i.test(message)
  );
}

/**
 * Après un déploiement Vercel, une ancienne page peut référencer un chunk supprimé.
 * Recharge une fois pour récupérer le nouveau manifeste JS.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const tryReload = (message: string) => {
      if (!isChunkLoadFailure(message)) return;
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      tryReload(event.message || '');
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === 'string'
          ? reason
          : reason instanceof Error
            ? reason.message
            : '';
      tryReload(message);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
