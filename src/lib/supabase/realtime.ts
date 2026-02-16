/**
 * Utilitaire Supabase Realtime (WebSocket)
 * Écoute les changements INSERT/UPDATE/DELETE sur les tables
 */

import { createClient } from './client';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeCallbackPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

/**
 * S'abonner aux changements d'une table (loads, trucks, bols)
 * @param table - Nom de la table
 * @param onPayload - Callback appelé à chaque changement
 * @param event - Type d'événement ('*' = tous)
 * @returns Fonction pour se désabonner
 */
export function subscribeToTable(
  table: 'loads' | 'trucks' | 'bols',
  onPayload: (payload: RealtimeCallbackPayload) => void,
  event: RealtimeEvent = '*'
): () => void {
  const supabase = createClient();
  const channelName = `realtime:${table}:${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
      },
      (payload) => {
        onPayload({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: (payload.new || {}) as Record<string, unknown>,
          old: (payload.old || {}) as Record<string, unknown>,
        });
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn(`[Realtime] Erreur channel ${table}:`, status);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Hook-friendly : s'abonner aux loads et appeler un callback à chaque changement
 * Utile pour déclencher un refetch sans polling
 */
export function subscribeToLoads(onChange: () => void): () => void {
  return subscribeToTable('loads', () => onChange());
}

export function subscribeToTrucks(onChange: () => void): () => void {
  return subscribeToTable('trucks', () => onChange());
}

export function subscribeToBols(onChange: () => void): () => void {
  return subscribeToTable('bols', () => onChange());
}
