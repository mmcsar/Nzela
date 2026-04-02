const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Revision pour la page offline (precache) : invalide le cache si le fichier change
const offlinePath = path.join(__dirname, 'public', 'offline.html');
const offlineRevision =
  fs.existsSync(offlinePath) ?
    crypto.createHash('md5').update(fs.readFileSync(offlinePath, 'utf8')).digest('hex') :
    '1';

const withSerwistInit = require('@serwist/next').default || require('@serwist/next');
const withSerwist = withSerwistInit({
  swSrc: 'src/lib/pwa/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [{ url: '/offline.html', revision: offlineRevision }],
});

const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** Alias Next Pages internes (webpack + turbopack) — hot-reloader / résolution edge cases */
function getNextPagesAliases() {
  try {
    const nextRoot = path.dirname(require.resolve('next/package.json'));
    return {
      'next/dist/pages/_app': path.join(nextRoot, 'dist/pages/_app.js'),
      'next/dist/pages/_error': path.join(nextRoot, 'dist/pages/_error.js'),
    };
  } catch {
    return {};
  }
}
const nextPagesAliases = getNextPagesAliases();

/** Relatif à la racine du projet — Turbopack sur Windows n’accepte pas les chemins absolus pour resolveAlias (voir message « windows imports »). */
const nextIntlRequestRelative = './src/i18n/request.ts';
/** Alias Webpack : chemin absolu OK */
const nextIntlRequestPath = path.join(__dirname, 'src', 'i18n', 'request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Corrige le warning "multiple lockfiles" - utilise le dossier nzela comme racine
  outputFileTracingRoot: path.join(__dirname),

  // ─── NEXT.JS 16.1 FEATURES ───
  // reactCompiler: true, // Temporairement désactivé pour debug

  // Next 16 : Turbopack par défaut ; si une config webpack existe (ci-dessous / plugins),
  // il faut aussi une section turbopack (voir message d'erreur sans ceci).
  turbopack: {
    resolveAlias: {
      ...nextPagesAliases,
      'next-intl/config': nextIntlRequestRelative,
    },
  },

  // ─── IMAGES ───
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
      { protocol: 'https', hostname: 'fretrdc.com' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ─── HEADERS ───
  async headers() {
    return [
      {
        source: '/:path(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com",
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
              "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com https://*.mapbox.com https://images.unsplash.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org",
              "worker-src 'self' blob:",
              "font-src 'self' data:",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(), microphone=()',
          },
        ],
      },
    ];
  },

  // ─── LOGGING (16.1 improved) ───
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },

  // ─── EXPERIMENTAL ───
  experimental: {
    webpackMemoryOptimizations: true,
    serverActions: {
      bodySizeLimit: '5mb',
    },
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'framer-motion',
      '@tanstack/react-query',
      'recharts',
      'jspdf',
      'leaflet',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@headlessui/react',
      'zustand',
    ],
  },

  // Éviter 404 : favicon.ico et apple-touch-icon demandés par les navigateurs
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/favicon.svg', permanent: true },
      { source: '/apple-touch-icon.png', destination: '/icons/apple-touch-icon.svg', permanent: true },
    ];
  },

  // Éviter 404 : manifest et worker PWA demandés avec préfixe locale (/fr/manifest.json, /en/sw.js)
  async rewrites() {
    return [
      { source: '/fr/manifest.json', destination: '/manifest.json' },
      { source: '/en/manifest.json', destination: '/manifest.json' },
      { source: '/fr/sw.js', destination: '/sw.js' },
      { source: '/en/sw.js', destination: '/sw.js' },
    ];
  },

  /**
   * Webpack (`next build --webpack`, `next dev --webpack`) : mêmes alias que turbopack.
   */
  webpack: (config) => {
    const alias = config.resolve.alias || (config.resolve.alias = {});
    Object.assign(alias, nextPagesAliases);
    // next-intl : withNextIntl ajoute déjà l'alias ; on le duplique si le plugin est contourné
    if (!alias['next-intl/config']) {
      alias['next-intl/config'] = nextIntlRequestPath;
    }
    return config;
  },
};

// Wrapper: Serwist + next-intl
const config = withSerwist(withNextIntl(nextConfig));

// Supprimer experimental.turbo si il existe (déprécié dans Next.js 16.1.6)
if (config.experimental && config.experimental.turbo) {
  delete config.experimental.turbo;
}

module.exports = config;
