# Formation Nzela — Parcours séparés Courtier / Entreprise

Ce document sert de **plan de cours** et de **support formateur**. Les parcours **courtier** et **entreprise** sont **distincts** : ne pas les mélanger dans la même session si l’objectif est une prise en main par rôle.

**Préfixe d’URL** : selon la config du site, les routes ci-dessous sont sous la locale (ex. `/fr/dashboard/...`).

---

## 1. Introduction commune (15–20 min) — optionnelle en ouverture

- Connexion, tableau de bord, langue.
- Rappel : un **courtier** gère surtout les **chargements** (fret à placer) ; une **entreprise** gère surtout les **camions / capacité** à proposer.
- Ensuite : **scinder le groupe** — session courtier d’un côté, entreprise de l’autre — ou **deux créneaux** distincts.

---

## 2. Parcours **COURTIER** (broker)

**Accueil typique** : `/dashboard/broker`

### 2.1 Cœur métier courtier

| Thème | Route indicative | Contenu pédagogique |
|--------|----------------|---------------------|
| **Publier un chargement** | `/dashboard/broker/loads/post` | Origine, destination, poids, dates, type de marchandise ; validation et visibilité sur le load board. |
| **Load board** | `/dashboard/loads/board` | Lire et filtrer les offres ; statuts. |
| **Recherche / navigation chargements** | `/dashboard/broker/loads/search` | Rechercher des opportunités selon vos critères. |
| **Bordereau (BOL)** | `/dashboard/broker/bol/list`, création `/dashboard/broker/bol/create` | Lier chargement + camion, génération PDF, rôle du courtier comme donneur d’ordre logistique. |

### 2.2 Suivi & documents

| Thème | Route indicative | Notes |
|--------|------------------|--------|
| **POD** (preuve de livraison) | `/dashboard/pod` | Remplissage, signature, PDF — en lien avec la livraison. |
| **Suivi** | `/dashboard/tracking` | Suivi des expéditions selon les fonctionnalités activées. |
| **Messagerie** | `/dashboard/messages` | Échanges avec partenaires. |

### 2.3 Outils transverses (courtier)

| Thème | Route indicative |
|--------|------------------|
| **Publier** (hub) | `/dashboard/publish` |
| **TMS** | `/dashboard/tms` — dont **facturation** `/dashboard/tms/facturation`, **coûts / carburant** `/dashboard/tms/couts` (onglet carburant) |
| **Tarifs / estimation** | `/dashboard/rates` |
| **Outils** (barème, carburant, etc.) | `/dashboard/tools` |
| **Matching** | `/dashboard/matching` |
| **Offres** | `/dashboard/offers` |
| **Camions (vue marché)** | `/dashboard/trucks/board` |
| **Alertes** | `/dashboard/loads/alerts` |
| **Paiements / abonnement** | `/dashboard/payments`, `/dashboard/subscription` |

> **Formateur** : adapter la profondeur (TMS, facturation, carburant) au niveau du groupe ; ce ne sont pas des prérequis pour « publier un chargement ».

---

## 3. Parcours **ENTREPRISE** (company / transporteur)

**Accueil typique** : `/dashboard/company`

### 3.1 Cœur métier entreprise

| Thème | Route indicative | Contenu pédagogique |
|--------|----------------|---------------------|
| **Publier un camion** | `/dashboard/company/trucks/post` | Capacité, localisation, disponibilité, type de véhicule ; mise en visibilité pour le matching. |
| **Mes camions / recherche** | `/dashboard/company/trucks/search` | Gérer la flotte affichée. |
| **Véhicules** | `/dashboard/company/vehicles` | Registre ou fiches véhicules selon votre usage. |
| **Load board** | `/dashboard/loads/board` | Voir les chargements ouverts ; répondre aux besoins. |

### 3.2 Suivi & offres

| Thème | Route indicative |
|--------|------------------|
| **Tableau des camions** | `/dashboard/trucks/board` |
| **POD** | `/dashboard/pod` |
| **Suivi** | `/dashboard/tracking` |
| **Offres** | `/dashboard/offers` |
| **Matching** | `/dashboard/matching` |
| **Messagerie** | `/dashboard/messages` |

### 3.3 Outils transverses (entreprise)

| Thème | Route indicative |
|--------|------------------|
| **Publier** (hub) | `/dashboard/publish` |
| **TMS** | `/dashboard/tms` — **facturation** `/dashboard/tms/facturation`, **coûts / carburant** `/dashboard/tms/couts` |
| **Tarifs** | `/dashboard/rates` |
| **Outils** | `/dashboard/tools` (dont estimateur carburant selon onglets) |
| **Alertes** | `/dashboard/loads/alerts` |
| **Paiements / abonnement** | `/dashboard/payments`, `/dashboard/subscription` |

> **Formateur** : insister sur la **différence** avec le courtier : l’entreprise **met de la capacité** (camions), le courtier **met du fret** (chargements). Les écrans communs (load board, matching, POD) se comprennent mieux avec cette distinction.

---

## 4. Modules **communs** (les deux profils)

À placer en **atelier séparé** ou en fin de journée si groupe mixte :

- **Estimation tarifaire** : `/dashboard/rates`
- **Carburant & coûts** : `/dashboard/tools` (onglet carburant) ou `/dashboard/tms/couts?tab=fuel`
- **Facturation transport** : `/dashboard/tms/facturation`
- **Conformité / crédit / vérification** : selon besoin (`/dashboard/credit-check`, `/dashboard/verification`)

---

## 5. Conseils pratiques

- **Comptes démo** : un compte **courtier** et un compte **entreprise** pour ne pas mélanger les données réelles.
- **Ne pas tout couvrir en une fois** : session **courtier** = sections 1–2 + outils prioritaires ; session **entreprise** = sections 1 + 3 + outils prioritaires.
- Mettre à jour ce fichier si les routes du menu évoluent (`dashboard/layout.tsx`).

---

*Document interne Nzela — à usage formation et documentation produit.*
