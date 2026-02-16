# Publier Nzela sur Vercel (production)

## Ce qu’il reste à faire avant / au moment du déploiement

### 1. Supabase (production)

- [ ] **Projet Supabase** créé (ou utiliser celui existant).
- [ ] **Script SQL** : exécuter `supabase/a_coller_sur_supabase.sql` dans **SQL Editor** (tables, RLS, `app_settings`, etc.).
- [ ] **URL et clés** : dans Supabase → **Settings** → **API**, noter :
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secret, jamais côté client).

### 2. Variables d’environnement sur Vercel

Dans **Vercel** → ton projet → **Settings** → **Environment Variables**, ajouter :

| Variable | Où la trouver | Obligatoire |
|----------|-----------------------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role) | Oui (notifications admin) |
| `NEXT_PUBLIC_APP_URL` | URL de prod, ex. `https://nzela.vercel.app` ou ton domaine | Oui |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Ex. `+243 995 547 081` | Recommandé |
| `NEXT_PUBLIC_APP_NAME` | Ex. `Nzela` | Optionnel |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Courte description | Optionnel |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave dashboard (clé **live** en prod) | Si paiements |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | Flutterwave (clé publique live) | Si paiements |
| `FLUTTERWAVE_WEBHOOK_HASH` | Flutterwave → Webhooks | Si paiements |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Généré (web-push) | Si notifications push |
| `VAPID_PRIVATE_KEY` | Généré (web-push) | Si notifications push |
| `VAPID_SUBJECT` | Ex. `mailto:contact@nzela.cd` | Si push |

**Optionnel (monétisation plus tard)** : `SUBSCRIPTION_GATE_ENABLED=true` — ou activer via **Admin → Paramètres → Métier → Monétisation**.

### 3. Flutterwave (si vous utilisez les paiements)

- [ ] Passer en **mode Live** dans le dashboard Flutterwave.
- [ ] **Webhook** : URL = `https://VOTRE_DOMAINE_VERCEL/api/payments/webhook` (ex. `https://nzela.vercel.app/api/payments/webhook`).
- [ ] Copier le **Webhook secret** dans `FLUTTERWAVE_WEBHOOK_HASH` sur Vercel.

### 4. Supabase – Auth (URL de redirection)

- [ ] Dans **Supabase** → **Authentication** → **URL Configuration** :
  - **Site URL** : `https://VOTRE_DOMAINE_VERCEL` (ex. `https://nzela.vercel.app`).
  - **Redirect URLs** : ajouter `https://VOTRE_DOMAINE_VERCEL/**` et `https://VOTRE_DOMAINE_VERCEL/auth/callback`.

### 5. Vérifications techniques (déjà OK si vous les avez faites)

- [ ] `npm run build` réussit.
- [ ] `npm run lint` sans erreur.
- [ ] Aucune clé secrète dans le dépôt Git (tout reste dans les variables Vercel).

---

## Étapes pour publier sur Vercel

1. **Pousser le code**  
   - Projet sous Git : `git push origin main` (ou la branche que vous utilisez).

2. **Connecter le repo à Vercel**  
   - [vercel.com](https://vercel.com) → **Add New** → **Project** → importer le dépôt GitHub/GitLab/Bitbucket.  
   - Framework : **Next.js** (détecté automatiquement).  
   - **Root Directory** : laisser vide si le projet est à la racine du repo.

3. **Configurer les variables**  
   - Dans **Environment Variables**, ajouter toutes les variables listées ci-dessus pour **Production** (et **Preview** si vous voulez les mêmes en préview).

4. **Déployer**  
   - Cliquer sur **Deploy**.  
   - Vercel exécute `npm run build` et déploie.  
   - À la fin, vous obtenez une URL du type `https://nzela-xxx.vercel.app`.

5. **Domaine personnalisé (optionnel)**  
   - **Settings** → **Domains** → ajouter votre domaine (ex. `nzela.cd`).  
   - Suivre les instructions DNS (enregistrement A ou CNAME vers Vercel).

6. **Après le premier déploiement**  
   - Mettre à jour **Site URL** et **Redirect URLs** dans Supabase avec l’URL Vercel finale.  
   - Si paiements : mettre à jour l’URL du webhook Flutterwave.  
   - Tester : inscription, connexion, publication (truck/load), admin, et un paiement test si applicable.

---

## Résumé : ce qu’il reste pour passer en production

| À faire | Où / Comment |
|--------|----------------------|
| Exécuter le SQL Supabase | Supabase → SQL Editor → coller `supabase/a_coller_sur_supabase.sql` |
| Renseigner les variables d’env | Vercel → Project → Settings → Environment Variables |
| Configurer Auth Supabase | Supabase → Auth → URL Configuration (Site URL + Redirect URLs) |
| Flutterwave (si paiements) | Mode Live + webhook vers `https://VOTRE_DOMAIN/api/payments/webhook` |
| Déployer | Vercel → Deploy (ou push sur la branche connectée) |

Une fois ces points faits, vous pouvez considérer que vous êtes en production et publié sur Vercel.
