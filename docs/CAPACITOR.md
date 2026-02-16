# Nzela – Capacitor (app native Android / iOS)

Capacitor est configuré pour embarquer Nzela en app Android et iOS.

## Utilisation recommandée : mode « Live URL »

Comme Nzela utilise des **API routes Next.js**, l’export statique n’est pas possible sans migrer les API. La solution simple : l’app native charge ton site en prod.

1. Dans `capacitor.config.ts`, décommente `server` et mets l’URL de prod :
   ```ts
   server: {
     url: 'https://ton-domaine-nzela.com',
     cleartext: true,  // seulement pour dev (ex: http://localhost:3000)
   },
   ```
2. Sync et ouverture du projet Android :
   ```bash
   npm run cap:sync
   npm run cap:android
   ```
3. Ouvre le projet dans Android Studio et lance l’app sur un appareil ou un émulateur.

## Scripts npm

| Script          | Description                    |
|-----------------|--------------------------------|
| `npm run cap:sync`    | Copie le `webDir` (out) vers les projets natifs |
| `npm run cap:android` | Ouvre le projet Android dans Android Studio     |
| `npm run cap:ios`     | Ouvre le projet iOS dans Xcode (sur Mac)        |

## iOS (Mac uniquement)

Sous Windows, `cap add ios` crée le dossier `ios/` mais `pod install` échoue (CocoaPods absent). Sur un Mac :

```bash
cd ios/App && pod install && cd ../..
npm run cap:ios
```

## Option future : app 100 % embarquée

Pour embarquer le front dans l’app (sans charger une URL), il faudrait :

- soit exposer les API Next via une autre URL (ex. backend déployé) et faire un **export statique** (`output: 'export'` dans `next.config.js`, build → `out/`), puis `npm run cap:sync` ;
- soit migrer les API vers Supabase / autre backend et faire pareil.

Pour l’instant, le mode Live URL est le plus simple et garde tout ton code actuel.
