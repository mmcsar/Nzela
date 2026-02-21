# Workflow d’expédition (chargement)

Ce document décrit le fonctionnement du **workflow** affiché sur la fiche d’un chargement (onglet « Workflow ») : étapes, progression et actions possibles.

---

## 1. Vue d’ensemble

Après qu’une **offre soit acceptée** sur un chargement, le statut du chargement suit une chaîne d’étapes jusqu’à **Terminé**. Chaque étape débloque la suivante ; on ne peut pas sauter d’étape.

---

## 2. Les étapes (ordre)

| Ordre | Code interne      | Libellé affiché        | Signification |
|-------|-------------------|------------------------|---------------|
| 1     | `available`       | Publié                 | Chargement publié, en attente d’offres |
| 2     | `bid_accepted`    | **Offre acceptée**     | Une offre (entreprise) a été acceptée par le courtier |
| 3     | `dispatched`      | Dispatché              | Le transport a été assigné / le chauffeur est notifié |
| 4     | `en_route_pickup` | En route (pickup)      | Le véhicule est en route vers le lieu de chargement |
| 5     | `at_pickup`       | Arrivé au chargement   | Sur place pour le chargement |
| 6     | `loaded`          | Chargé                 | Marchandise chargée, prêt à partir |
| 7     | `in_transit`      | En transit             | En route vers la destination |
| 8     | `at_delivery`     | Arrivé à destination   | Sur place pour la livraison |
| 9     | `delivered`       | Livré                  | Marchandise livrée |
| 10    | `pod_uploaded`    | POD soumis             | Preuve de livraison (POD) déposée |
| 11    | `completed`      | Terminé                | Dossier clôturé |

États spéciaux :

- **Annulé** (`cancelled`) : possible après « Publié » ou « Offre acceptée ».
- **Litige** (`disputed`) : possible après « Terminé ».

---

## 3. Comment ça s’affiche

- **Timeline** : toutes les étapes sont listées. Les étapes déjà passées sont cochées (vert), l’**étape actuelle** est mise en avant avec le badge « Étape actuelle » et la date/heure.
- **Prochaine étape** : en dessous, des boutons permettent de **faire avancer** le workflow (ex. « Dispatcher », « En route vers pickup », « Arrivé au pickup », etc.). Seules les transitions autorisées sont proposées.
- **Date** à côté de « Offre acceptée » : elle correspond à la date de l’événement (ex. 15 févr., 13:39) quand cette étape a été enregistrée.

---

## 4. Règles de progression (côté API)

Le fichier `src/app/api/shipment/workflow/route.ts` définit les **transitions autorisées** :

- `available` → `bid_accepted` ou `cancelled`
- `bid_accepted` → `dispatched` ou `cancelled`
- `dispatched` → `en_route_pickup` ou `cancelled`
- `en_route_pickup` → `at_pickup`
- `at_pickup` → `loaded`
- `loaded` → `in_transit`
- `in_transit` → `at_delivery`
- `at_delivery` → `delivered`
- `delivered` → `pod_uploaded`
- `pod_uploaded` → `completed`
- `completed` → `disputed` (optionnel)
- `cancelled` → aucune
- `disputed` → `completed` ou `cancelled`

Quand l’utilisateur clique sur un bouton (ex. « Dispatcher »), le front envoie un **POST** avec `loadId` et `newStatus` (ex. `dispatched`). L’API vérifie que la transition est autorisée, met à jour le chargement, puis renvoie la nouvelle timeline.

---

## 5. Où c’est utilisé

- **Page** : détail d’un chargement → onglet **Workflow**  
  `src/app/[locale]/(dashboard)/dashboard/loads/[id]/page.tsx`
- **Composant** : `src/components/shipment/ShipmentTimeline.tsx`  
  Il appelle `GET /api/shipment/workflow?loadId=...` pour afficher la timeline et les prochaines étapes, et `POST /api/shipment/workflow` pour avancer.
- **API** : `src/app/api/shipment/workflow/route.ts`  
  - **GET** : retourne le chargement, le statut actuel, la timeline générée et les prochaines étapes possibles.  
  - **POST** : met à jour le statut du chargement après vérification des transitions.

---

## 6. Persistance de l’étape détaillée

La table `loads` a un statut global : `available`, `booked`, `in-transit`, `completed`. Pour que l’**étape actuelle** affichée soit bien « Dispatché », « En route (pickup) », « Arrivé au chargement », etc., l’application utilise une colonne optionnelle **`workflow_step`** sur `loads`.

- **Si la colonne existe** : elle stocke l’étape courante (ex. `dispatched`, `en_route_pickup`). La timeline et le badge « Étape actuelle » reflètent cette valeur.
- **Si la colonne n’existe pas** : l’app déduit l’étape du statut (`booked` → Offre acceptée, `in-transit` → En transit, `completed` → Terminé). Les étapes intermédiaires (Dispatché, En route, …) ne peuvent pas être affichées comme « actuelles ».

Pour activer les étapes détaillées, exécuter la migration SQL :

```bash
# Dans le dossier du projet
supabase/migrations/20260221100000_add_workflow_step_to_loads.sql
```

Ou dans le **SQL Editor** Supabase : coller le contenu de ce fichier et exécuter.

---

## 7. Résumé

- **Offre acceptée** = première étape après la publication, avec une date/heure.
- **Étape actuelle** = l’étape où se trouve le chargement (badge « Étape actuelle ») ; elle est précise si la colonne `workflow_step` est en place.
- La liste (Dispatché, En route, Arrivé au chargement, Chargé, etc.) est l’ordre fixe des étapes ; l’utilisateur fait avancer en cliquant sur les boutons « Prochaine étape ».
- Le workflow va jusqu’à **Terminé**, avec **POD soumis** avant, et **Annulé** / **Litige** selon les règles ci-dessus.
