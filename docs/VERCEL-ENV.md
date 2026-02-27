# Variables d’environnement Vercel – Nzela

Tu as déjà **NEXT_PUBLIC_SUPABASE_URL** et **NEXT_PUBLIC_SUPABASE_ANON_KEY**. Voici les autres à ajouter dans **Vercel → Project → Settings → Environment Variables**.

---

## Obligatoire (pour que tout fonctionne)

| Variable | Où la trouver | Note |
|----------|----------------|------|
| **SUPABASE_SERVICE_ROLE_KEY** | Supabase → **Settings** → **API** → "service_role" (secret) | Nécessaire pour la messagerie (liste des destinataires), notifications admin, etc. **Ne jamais exposer côté client.** |

Sans cette clé, la messagerie ne peut pas afficher la liste des utilisateurs et certaines actions admin échouent.

---

## Recommandé

| Variable | Valeur exemple | Usage |
|----------|----------------|--------|
| **NEXT_PUBLIC_APP_URL** | `https://nzela.vercel.app` (ou ton domaine) | Redirections après login/logout, liens dans les e-mails, enregistrement. |

---

## Optionnel

| Variable | Usage |
|----------|--------|
| **NEXT_PUBLIC_SUPPORT_PHONE** | Numéro affiché (Contact, Footer). Défaut : +243 995 547 081 |
| **SUBSCRIPTION_GATE_ENABLED** | `true` = exiger un abonnement après la période gratuite |
| **FLUTTERWAVE_SECRET_KEY** | Paiements Flutterwave (Mobile Money) |
| **NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY** | Clé publique Flutterwave |
| **FLUTTERWAVE_WEBHOOK_HASH** | Webhook Flutterwave |
| **NEXT_PUBLIC_VAPID_PUBLIC_KEY** | Notifications push (PWA) |
| **VAPID_PRIVATE_KEY** | Notifications push |
| **VAPID_SUBJECT** | Ex. `mailto:info@nzelaa.com` |

---

## Résumé : minimum à ajouter sur Vercel

1. **SUPABASE_SERVICE_ROLE_KEY** (obligatoire pour messagerie + admin).
2. **NEXT_PUBLIC_APP_URL** = `https://ton-domaine.vercel.app` (recommandé).

Ensuite : **Redeploy** (ou un nouveau déploiement) pour que les variables soient prises en compte.
