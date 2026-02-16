# Nzela - Plateforme de Logistique

Plateforme de logistique pour le Haut-Katanga et Lualaba (RDC).

## Fonctionnalités

- 🚛 **Trouver des camions** - Les entreprises peuvent poster leurs camions
- 📦 **Trouver des chargements** - Les brokers peuvent poster leurs chargements
- 📄 **BOL Management** - Gestion des bordereaux de chargement
- 🤝 **Matching intelligent** - Correspondance automatique chargements/camions
- 💳 **Système d'abonnements** - Plans tarifaires pour entreprises et brokers
- 👥 **Gestion multi-rôles** - Admin (MMC SARL), Entreprises, Brokers
- 🌍 **Multilingue** - Français et Anglais
- 📱 **PWA** - Application Progressive Web App
- ⚡ **WebSocket Realtime** - Mises à jour instantanées (loads, trucks, BOL) sans rechargement

## Technologies

- **Next.js 16.1.6** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **Supabase** - Backend (PostgreSQL, Auth, Storage)
- **PWA** - Progressive Web App
- **next-intl** - Internationalisation

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
```bash
cp .env.local.example .env.local
```

Remplir les valeurs dans `.env.local` :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

3. Lancer le serveur de développement :
```bash
npm run dev
```

## Structure du projet

```
nzela/
├── src/
│   ├── app/              # Pages Next.js App Router
│   ├── components/       # Composants React
│   ├── lib/             # Utilitaires et configurations
│   ├── types/           # Types TypeScript
│   └── locales/         # Traductions i18n
├── public/              # Fichiers statiques
└── ...
```

## Rôles utilisateurs

- **Admin (MMC SARL)** - Contrôle total de la plateforme
- **Company** - Entreprises qui postent des camions
- **Broker** - Courtiers qui postent des chargements

## Développement

```bash
# Développement
npm run dev

# Build production
npm run build

# Démarrer production
npm start
```

## CI/CD (GitHub Actions + Vercel)

Pipelines crees dans `.github/workflows`:

- `ci.yml`: lint + build sur `pull_request` et `push` (`main`, `staging`)
- `deploy-staging.yml`: deploiement auto vers staging sur `push` branche `staging`
- `deploy-production.yml`: deploiement auto vers production sur `push` branche `main`
- `rollback.yml`: rollback manuel rapide (redeploy d'un commit/tag)

### Secrets GitHub requis

À configurer dans **Settings → Secrets and variables → Actions** (ou dans l’environnement **production** si utilisé) :

| Secret | Où le récupérer |
|--------|------------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Projet Vercel → Settings → General (ou `.vercel/project.json` après `vercel link`) |
| `VERCEL_PROJECT_ID` | Même page, champ **Project ID** |

### Stratégie de branches

- `staging` -> environnement de pre-production
- `main` -> production

### Rollback rapide

Lancer le workflow `Rollback` depuis l'onglet **Actions**:

1. Choisir `target` (`staging` ou `production`)
2. Entrer `git_ref` (SHA commit, tag, ou branche)
3. Executer: le commit choisi est redeploye sur Vercel

## Licence

Propriété de MMC SARL




