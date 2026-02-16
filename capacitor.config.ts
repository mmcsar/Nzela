import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nzela.app',
  appName: 'Nzela',
  webDir: 'out',

  // ─── Mode "Live URL" (recommandé avec Next.js + API routes) ───
  // Décommente et mets l’URL de prod pour que l’app native ouvre directement le site.
  // server: {
  //   url: 'https://ton-domaine-nzela.com',
  //   cleartext: true, // uniquement pour dev (ex: http://localhost:3000)
  // },

  // Plugins natifs (décommenter si besoin)
  // plugins: {
  //   SplashScreen: { launchShowDuration: 0 },
  // },
};

export default config;
