# WebSocket Realtime - Nzela

## Vue d'ensemble

Nzela utilise **Supabase Realtime** (WebSocket) pour des mises à jour instantanées sans rechargement de page.

## Tables écoutées

| Table   | Pages concernées        | Effet                              |
|---------|--------------------------|------------------------------------|
| `loads` | Load Board, Broker loads | Nouveaux chargements, changements   |
| `trucks`| (prévu)                  | Disponibilité camions              |
| `bols`  | Liste BOL broker         | Création / modification des BOL    |

## Activation

1. **Exécuter le script SQL** dans le SQL Editor Supabase :
   ```
   supabase/enable_realtime.sql
   ```
2. Vérifier que Realtime est activé : Dashboard Supabase > **Database** > **Replication** (publication `supabase_realtime`).

## Utilisation dans le code

```ts
import { useRealtimeLoads } from '@/hooks/useRealtimeLoads';

// Dans un composant
useRealtimeLoads(fetchLoads); // Appelle fetchLoads à chaque INSERT/UPDATE/DELETE
```

## Hooks disponibles

- `useRealtimeLoads(onRefresh)` – loads
- `useRealtimeTrucks(onRefresh)` – trucks  
- `useRealtimeBols(onRefresh)` – bols

## Architecture

- **Client** : `@supabase/supabase-js` (Realtime inclus)
- **Transport** : WebSocket (wss)
- **Événements** : `postgres_changes` (INSERT, UPDATE, DELETE)
- **Fallback** : polling toutes les 5 min sur le Load Board si WebSocket déconnecté

## Limites Supabase

- Plan gratuit : Realtime inclus
- Plan Pro : meilleure scalabilité pour des milliers de connexions simultanées
