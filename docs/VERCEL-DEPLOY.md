# Déploiement Nzela sur Vercel

## Checklist avant déploiement

### 1. Variables d'environnement (Vercel → Settings → Environment Variables)

Copier depuis `.env.local.example` et renseigner pour **Production** (et Preview si besoin) :

| Variable | Requis | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Clé service role (notifications, admin) |
| `NEXT_PUBLIC_APP_URL` | Oui | URL de prod (ex. `https://nzela.vercel.app`) |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Optionnel | Numéro affiché (Contact, Footer) |
| `NEXT_PUBLIC_APP_NAME` | Optionnel | Nom de l'app (PWA) |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Optionnel | Description (PWA) |
| `FLUTTERWAVE_*` | Si paiements | Clés Flutterwave + webhook hash |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_*` | Si push | Clés Web Push |

### 2. Node.js

- Le projet utilise **Node >= 18.17** (`package.json` → `engines`, `.nvmrc` = 20).
- Vercel lit `.nvmrc` automatiquement ; pas besoin de configurer la version à la main.

### 3. Si le **build** bloque sur Vercel

- **Logs** : Vercel → onglet **Deployments** → clic sur le déploiement → **Building** pour voir l’erreur exacte.
- **Mémoire (SIGKILL / OOM)** :  
  - `next.config.js` contient déjà `experimental.webpackMemoryOptimizations: true`.  
  - Si ça suffit pas : plan Pro → **Enhanced Builds** (plus de mémoire), ou réduire les dépendances / pages statiques.
- **Timeout** :  
  - Par défaut ~10 min (Hobby).  
  - Pour augmenter : **Settings → General → Build Command** (ou laisser `npm run build`) et **Build & Development Settings** ; timeout max selon le plan dans la doc Vercel.

### 4. Si la **production** bloque (après build)

- **Erreur « Your project's URL and API key are required to create a Supabase client »** (500 sur /login, /register) : les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` ne sont pas définies ou pas prises en compte. Vérifier qu’elles existent pour **Production** dans Environment Variables, puis **Redeploy** en décochant **Use existing Build Cache** (les `NEXT_PUBLIC_*` sont injectées au build).
- **Functions** : Vercel → **Functions** pour voir timeouts / erreurs des routes API.
- **Edge / middleware** : le projet utilise encore `middleware.ts` (Next 16 déprécie en faveur de `proxy.ts`) ; pour l’instant on garde le middleware pour éviter les soucis Cloudflare/Vercel.
- **Région** : `vercel.json` impose `regions: ["fra1"]` ; adapter si besoin.

### 5. Commandes de build utilisées

- **Install** : `npm install --legacy-peer-deps` (défini dans `vercel.json`).
- **Build** : `npm run build` (= `next build --webpack`).

En cas d’erreur précise (message Vercel ou screenshot des logs), on peut cibler le correctif (env, mémoire, timeout, ou une route précise).
