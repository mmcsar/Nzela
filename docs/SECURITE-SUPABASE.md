# Sécurité Supabase – Projet Nzela

Ce document décrit les vulnérabilités identifiées liées à Supabase et les correctifs appliqués ou à appliquer.

---

## 1. Vulnérabilités corrigées dans le code

### 1.1 Redirection ouverte (Open Redirect) – auth callback

**Risque :** Le paramètre `next` de l’URL de callback Supabase (`/auth/callback?code=...&next=...`) n’était pas suffisamment validé. Un attaquant pouvait rediriger l’utilisateur vers un site externe après connexion (phishing).

**Correctif :** Dans `src/app/auth/callback/route.ts`, la valeur de `next` est maintenant limitée aux chemins internes commençant par `/fr/` ou `/en/`. Toute autre valeur est ignorée et la redirection par défaut vers `/fr/dashboard` est utilisée.

---

## 2. Vulnérabilités à corriger dans Supabase (RLS)

Ces correctifs doivent être appliqués **dans le projet Supabase** (SQL Editor).

### 2.1 Table `notifications` – INSERT trop permissif

**Risque :** Une policy RLS autorisait l’INSERT avec `WITH CHECK (TRUE)`, donc tout utilisateur authentifié pouvait créer des notifications pour **n’importe quel** `user_id`. Cela permettait du spam, de l’usurpation de notifications ou du phishing.

**Correctif :** Supprimer la policy d’INSERT pour les utilisateurs normaux. Seul le backend (clé `service_role`) doit pouvoir insérer des notifications (comme dans `api/auth/notify-signup`). Exécuter le script `supabase/security_fix_rls.sql` (section notifications).

### 2.2 Table `bols` – SELECT/INSERT/UPDATE trop permissifs

**Risque :** Les policies autorisaient tout utilisateur authentifié à :
- voir tous les BOLs,
- insérer n’importe quel BOL,
- modifier n’importe quel BOL.

Les BOLs (Bills of Lading) sont des données sensibles ; seuls le courtier associé au chargement et l’entreprise associée au camion (plus l’admin) doivent y avoir accès.

**Correctif :** Remplacer les policies par des règles strictes :
- **SELECT** : broker du load, ou company du truck, ou admin.
- **INSERT** : uniquement le broker propriétaire du load.
- **UPDATE** : broker du load ou company du truck ou admin.
- **DELETE** : broker du load ou admin.

Exécuter le script `supabase/security_fix_rls.sql` (section BOLs).

---

## 3. Bonnes pratiques déjà en place

- **Clé service role** : utilisée uniquement côté serveur (API routes), jamais exposée au client. Variables `SUPABASE_SERVICE_ROLE_KEY` non préfixées par `NEXT_PUBLIC_`.
- **Clé anon** : seule la clé anonyme et l’URL sont exposées côté client (`NEXT_PUBLIC_*`). La sécurité repose sur le RLS.
- **Fichiers sensibles** : `.env`, `.env*.local` sont dans `.gitignore`.
- **Headers de sécurité** : CSP, X-Frame-Options, etc. configurés dans `next.config.js` (dont les domaines Supabase autorisés).

---

## 4. Actions à faire de ton côté

1. **Exécuter le script SQL**  
   Dans le dashboard Supabase → SQL Editor, exécuter le contenu de **`supabase/security_fix_rls.sql`**.

2. **Vérifier les redirect URLs Supabase**  
   Dans Supabase → Authentication → URL Configuration, s’assurer que seules tes URLs de production et de dev sont autorisées (pas de wildcard trop large).

3. **Ne jamais commiter** les fichiers `.env` ou `.env.local` (déjà ignorés par le repo).

4. **En production (ex. Vercel)** : définir `SUPABASE_SERVICE_ROLE_KEY` uniquement dans les variables d’environnement du projet, jamais dans le code ou dans un fichier versionné.

---

## 5. Résumé des fichiers modifiés / ajoutés

| Fichier | Action |
|--------|--------|
| `src/app/auth/callback/route.ts` | Validation stricte du paramètre `next` (anti open redirect) |
| `supabase/security_fix_rls.sql` | **Nouveau** – Script à exécuter dans Supabase pour corriger les RLS notifications et BOLs |
| `docs/SECURITE-SUPABASE.md` | **Nouveau** – Ce document |

Après exécution du script SQL, les vulnérabilités RLS listées ci-dessus sont corrigées côté base Supabase.
