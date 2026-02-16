# Déploiement Nzela sur Vercel

## 1. Prérequis
- Compte [Vercel](https://vercel.com)
- Projet Nzela poussé sur GitHub/GitLab/Bitbucket

## 2. Importer le projet
1. Va sur [vercel.com/new](https://vercel.com/new)
2. Clique **Import** sur ton repo contenant Nzela
3. Si le code est dans un sous-dossier `nzela`, définit **Root Directory** : `nzela`

## 3. Variables d'environnement
Dans **Settings → Environment Variables**, ajoute :

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co | Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ta clé anon | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | ta clé service role | Oui |
| `NEXT_PUBLIC_APP_URL` | https://ton-projet.vercel.app | Oui |

**Optionnel** (Flutterwave, notifications push) :
- `FLUTTERWAVE_SECRET_KEY`
- `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`
- `FLUTTERWAVE_WEBHOOK_HASH`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

## 4. Supabase - URLs de production
Dans **Supabase Dashboard → Authentication → URL Configuration** :
- **Site URL** : `https://ton-projet.vercel.app`
- **Redirect URLs** : `https://ton-projet.vercel.app/**`

## 5. Déployer
Clique **Deploy**. Le build utilise `npm run build` (Next.js 16 + webpack).

## 6. Après le premier déploiement
1. Copie l’URL générée (ex. `https://nzela-xxx.vercel.app`)
2. Mets à jour `NEXT_PUBLIC_APP_URL` avec cette URL
3. Mets à jour les URLs dans Supabase
4. Redéploie si nécessaire
