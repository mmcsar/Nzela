# Dépannage : « Configuration serveur incomplète » et « Aucun profil entreprise lié »

## 0. « Rien ne marche » (courtier/entreprise ne peut pas publier)

**Diagnostic rapide :**

1. Connecte-toi avec le compte **courtier** ou **entreprise** concerné.
2. Ouvre dans le navigateur : **`/api/debug/profile`** (ex. `https://ton-site.vercel.app/api/debug/profile` ou `http://localhost:3000/api/debug/profile`).
3. Regarde la réponse JSON :
   - **`brokerId` ou `companyId` à `null`** → le profil n’est pas lié. Passe à l’étape 4.
   - **`serviceRoleConfigured: false`** → la clé **SUPABASE_SERVICE_ROLE_KEY** est absente (Vercel ou `.env.local`). Sans elle, les listes admin (courtiers/entreprises) sont vides et certains rattachements échouent.
   - **`subscription.hasAccess: false`** avec un message du type « Profil non lié » → idem : lier le profil (étape 4). Si le message parle d’abonnement ou d’essai expiré, vérifier Admin > Paramètres (porte abonnement).

**Checklist pour débloquer la publication :**

| Étape | Où | Action |
|--------|-----|--------|
| A | **Vercel** (ou `.env.local`) | Ajouter **SUPABASE_SERVICE_ROLE_KEY** (clé `service_role` du projet Supabase). Voir [docs/VERCEL-ENV.md](VERCEL-ENV.md). |
| B | **Supabase** → SQL Editor | Exécuter le script **`supabase/lier_courtier_utilisateur.sql`** pour lier les courtiers/entreprises aux utilisateurs (email / nom). |
| C | **Admin** → Utilisateurs | Si « Aucun courtier trouvé » : vérifier que la liste se charge (étape A). Sinon choisir le courtier/entreprise dans la liste et cliquer **Approuver**. |
| D | **Utilisateur** | Se déconnecter, se reconnecter (ou recharger la page **Publier**), puis réessayer. |

Après A + B (ou C), `/api/debug/profile` doit afficher un `brokerId` ou `companyId` non null et `subscription.hasAccess: true` (sauf si la porte abonnement est activée et l’essai est fini).

---

## 1. « Configuration serveur incomplète. Contactez l'administrateur »

**Cause :** La clé **SUPABASE_SERVICE_ROLE_KEY** est absente ou invalide dans `.env.local`. Elle est nécessaire pour que le bouton « Notifier l'administrateur » envoie les notifications aux admins.

**Correction :**

1. Ouvre **Supabase** → ton projet → **Settings** → **API**.
2. Copie la clé **service_role** (secret, ne jamais l’exposer côté client).
3. Dans la racine du projet Nzela, ouvre ou crée **`.env.local`** et ajoute (ou complète) :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...ta_clé_ici
   ```
4. Redémarre le serveur Next.js (`npm run dev`).

Après ça, quand un utilisateur « entreprise » ou « courtier » sans profil lié clique sur **Notifier l'administrateur**, la demande est bien enregistrée et les admins sont notifiés.

---

## 2. « Votre rôle est entreprise, mais aucun profil entreprise n'est lié »

**Cause :** L’utilisateur a le rôle **entreprise** mais la colonne **company_id** est vide dans la table `users` (profil non associé à une fiche entreprise).

**Correction côté admin :**

1. Connecte-toi en **admin**.
2. Va dans **Dashboard** → **Admin** → **Utilisateurs** (Gestion des utilisateurs).
3. Repère l’utilisateur concerné (ex. jhsfreight@gmail.com).
4. Dans la colonne **Entreprise / Courtier**, ouvre le menu **« — Associer entreprise — »**.
5. Choisis l’**entreprise** correspondante dans la liste (celle créée à l’inscription, si elle existe) puis valide.

L’utilisateur pourra alors **Publier un camion** et utiliser les fonctionnalités entreprise.

**Si l’entreprise n’apparaît pas dans la liste :** elle n’a peut‑être pas été créée à l’inscription (erreur ou RLS). Tu peux alors :

- Créer l’entreprise manuellement dans **Supabase** → **Table Editor** → **companies** (avec `owner_id` = l’UUID de l’utilisateur dans `auth.users`), puis refaire l’association à l’étape 4 ci‑dessus,  
- **ou** demander à l’utilisateur de se réinscrire via **Inscription entreprise** pour recréer le compte et la fiche entreprise.

---

## Règle plateforme

- **Courtier (broker)** : publie des **chargements** (loads).
- **Entreprise (company)** : publie des **camions** (trucks).

Un compte doit avoir un **profil entreprise** ou **courtier** lié (company_id ou broker_id) pour accéder aux actions « Publier un chargement » ou « Publier un camion ».
