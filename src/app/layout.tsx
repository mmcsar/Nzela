import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nzela — Fret et talents | RDC',
  description:
    'Mise en relation pour le fret et les talents en RDC. Lancement officiel le 2 mai 2026. Outils au service de la performance logistique et des parcours professionnels, dans une perspective de développement économique.',
  manifest: '/manifest.json',
  applicationName: 'Nzela',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nzela',
    startupImage: [
      {
        url: '/icons/icon-512x512.svg',
        media: '(device-width: 375px) and (device-height: 812px)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Nzela',
    title: 'Nzela — Fret et talents | RDC',
    description:
      'Fret et talents en RDC. Lancement le 2 mai 2026. Une plateforme pour renforcer la logistique et les opportunités professionnelles, au service du développement national.',
  },
  twitter: {
    card: 'summary',
    title: 'Nzela — Fret et talents | RDC',
    description:
      'Fret et talents en RDC. Lancement le 2 mai 2026. Logistique et opportunités professionnelles au service du développement national.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#047857' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nzela" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.svg" />
        {/* Apple splash screens for iOS */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.svg" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
