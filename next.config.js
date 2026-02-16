const withSerwistInit = require('@serwist/next').default || require('@serwist/next');
const withSerwist = withSerwistInit({
  swSrc: 'src/lib/pwa/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  disable: process.env.NODE_ENV === 'development',
});

const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Corrige le warning "multiple lockfiles" - utilise le dossier nzela comme racine
  outputFileTracingRoot: path.join(__dirname),

  // ─── NEXT.JS 16.1 FEATURES ───
  // reactCompiler: true, // Temporairement désactivé pour debug

  // ─── IMAGES ───
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
      { protocol: 'https', hostname: 'fretrdc.com' },
      { protocol: 'https', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ─── HEADERS ───
  async headers() {
    return [
      {
        source: '/(.*)',
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
              "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com https://*.mapbox.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com",
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
};

// Wrapper: Serwist + next-intl
const config = withSerwist(withNextIntl(nextConfig));

// Supprimer experimental.turbo si il existe (déprécié dans Next.js 16.1.6)
if (config.experimental && config.experimental.turbo) {
  delete config.experimental.turbo;
}

module.exports = config;
