'use client';

import { useEffect, useRef } from 'react';
import { subscribeToLoads } from '@/lib/supabase/realtime';

/**
 * Hook pour écouter les changements en temps réel sur la table loads (WebSocket).
 * Appelle onRefresh à chaque INSERT/UPDATE/DELETE.
 */
export function useRealtimeLoads(onRefresh: () => void) {
  const callbackRef = useRef(onRefresh);
  useEffect(() => {
    callbackRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const unsubscribe = subscribeToLoads(() => {
      callbackRef.current();
    });
    return unsubscribe;
  }, []);
}
