# Dépannage : « Configuration serveur incomplète » et « Aucun profil entreprise lié »

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
