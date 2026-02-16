# Configuration Supabase - Confirmation email

## Modifications effectuees

1. **Route /auth/callback** : echanger le code de confirmation et rediriger vers le dashboard
2. **Inscription** : `emailRedirectTo` pointe vers `{origine}/auth/callback`
3. **Middleware** : `/auth/callback` ajoute aux routes publiques

## Configuration requise dans Supabase Dashboard

1. **Authentication** > **URL Configuration**
2. **Site URL** : `https://votre-domaine.com` (ex: `https://nzela.vercel.app`)
3. **Redirect URLs** : ajouter :
   - `https://votre-domaine.com/auth/callback`
   - `http://localhost:3000/auth/callback` (dev)

Sans cette configuration, Supabase refusera la redirection et la confirmation echouera.
