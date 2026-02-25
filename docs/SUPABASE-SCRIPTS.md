# Scripts SQL Supabase – Quel script utiliser ?

## Si les loads, trucks ou utilisateurs ont « disparu »

Si tu as exécuté **`full_setup.sql`** (ou un script qui fait `DROP TABLE`), les données ont été **supprimées**. Ce script recrée les tables vides et est destiné à une **première installation uniquement**.

- **Récupération possible** : Supabase propose le **Point-in-Time Recovery (PITR)** sur les plans Pay-as-you-go et au-dessus. Dans le dashboard : **Settings → Database → Point in time recovery** pour restaurer à une date/heure avant l’exécution du script.
- **Sans PITR** : les données sont perdues ; il faut recréer les comptes et republier les loads/trucks.

## Scripts à utiliser selon la situation

| Situation | Script à exécuter | Effet |
|-----------|-------------------|--------|
| **Nouvelle base vide** (première fois) | `full_setup.sql` | Crée toutes les tables (⚠️ efface tout si ré-exécuté). |
| **Base déjà en place** (RLS, corrections, is_admin) | `a_coller_sur_supabase.sql` | Ne supprime pas les données. Corrige payments, is_admin(), RLS. |
| **Étendre aux 26 provinces RDC** | `migrations/20260224100000_provinces_toute_rdc.sql` | Supprime uniquement la contrainte CHECK sur `province`. |
| **Triggers updated_at** (sans tout recréer) | `schema.sql` (section triggers uniquement) | DROP IF EXISTS + CREATE des triggers. |

En résumé : **ne jamais lancer `full_setup.sql` sur une base qui contient déjà des utilisateurs, loads ou trucks.**
