'use client';

import { useEffect, useRef } from 'react';
import { subscribeToTrucks } from '@/lib/supabase/realtime';

/**
 * Hook pour écouter les changements en temps réel sur la table trucks (WebSocket).
 */
export function useRealtimeTrucks(onRefresh: () => void) {
  const callbackRef = useRef(onRefresh);
  useEffect(() => {
    callbackRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const unsubscribe = subscribeToTrucks(() => {
      callbackRef.current();
    });
    return unsubscribe;
  }, []);
}
