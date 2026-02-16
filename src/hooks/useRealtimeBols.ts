'use client';

import { useEffect, useRef } from 'react';
import { subscribeToBols } from '@/lib/supabase/realtime';

/**
 * Hook pour écouter les changements en temps réel sur la table bols (WebSocket).
 */
export function useRealtimeBols(onRefresh: () => void) {
  const callbackRef = useRef(onRefresh);
  useEffect(() => {
    callbackRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const unsubscribe = subscribeToBols(() => {
      callbackRef.current();
    });
    return unsubscribe;
  }, []);
}
