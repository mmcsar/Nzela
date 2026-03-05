import { getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { PrefetchLink } from '@/components/navigation/PrefetchLink';

export const dynamic = 'force-dynamic';
import { DashboardAuthProvider } from '@/components/dashboard/DashboardAuthProvider';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  Home, Truck, Package, FileText, CreditCard, Settings,
  Building2, Users, Car, BarChart3, Zap, Wrench, Navigation,
  MessageSquare, LayoutDashboard, ChevronDown, FileSignature,
  Satellite, Wallet, ShieldCheck, AlertTriangle, Mail, Phone, LogOut, Plus,
  Bell, Handshake, TrendingUp, Shield,
} from 'lucide-react';

// Navigation config par role
function getNavLinks(role: string) {
  const shared = [
    { href: '/dashboard/publish', icon: Plus, label: 'Publier' },
    { href: '/dashboard/loads/board', icon: Package, label: 'Load Board' },
    { href: '/dashboard/trucks/board', icon: Truck, label: 'Truck Board' },
    { href: '/dashboard/loads/alerts', icon: Bell, label: 'Alertes' },
    { href: '/dashboard/rates', icon: TrendingUp, label: 'Tarifs' },
    { href: '/dashboard/offers', icon: Handshake, label: 'Offres' },
    { href: '/dashboard/tracking', icon: Satellite, label: 'Tracking' },
    { href: '/dashboard/matching', icon: Zap, label: 'Matching' },
    { href: '/dashboard/pod', icon: FileSignature, label: 'POD' },
    { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/dashboard/payments', icon: Wallet, label: 'Paiements' },
    { href: '/dashboard/credit-check', icon: Shield, label: 'Credit' },
    { href: '/dashboard/verification', icon: ShieldCheck, label: 'KYC' },
  ];

  if (role === 'company') {
    return [
      { href: '/dashboard/company', icon: Home, label: 'Dashboard' },
      { href: '/dashboard/publish', icon: Plus, label: 'Publier' },
      { href: '/dashboard/company/trucks/post', icon: Truck, label: 'Publier un camion' },
      { href: '/dashboard/loads/board', icon: Package, label: 'Load Board' },
      { href: '/dashboard/company/trucks/search', icon: Truck, label: 'Camions' },
      { href: '/dashboard/company/vehicles', icon: Car, label: 'Vehicules' },
      { href: '/dashboard/trucks/board', icon: Truck, label: 'Truck Board' },
      { href: '/dashboard/loads/alerts', icon: Bell, label: 'Alertes' },
      { href: '/dashboard/rates', icon: TrendingUp, label: 'Tarifs' },
      { href: '/dashboard/offers', icon: Handshake, label: 'Offres' },
      { href: '/dashboard/tracking', icon: Satellite, label: 'Tracking' },
      { href: '/dashboard/matching', icon: Zap, label: 'Matching' },
      { href: '/dashboard/pod', icon: FileSignature, label: 'POD' },
      { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
      { href: '/dashboard/payments', icon: Wallet, label: 'Paiements' },
      { href: '/dashboard/credit-check', icon: Shield, label: 'Credit' },
      { href: '/dashboard/verification', icon: ShieldCheck, label: 'KYC' },
      { href: '/dashboard/subscription', icon: CreditCard, label: 'Abonnement' },
    ];
  }

  if (role === 'broker') {
    return [
      { href: '/dashboard/broker', icon: Home, label: 'Dashboard' },
      { href: '/dashboard/publish', icon: Plus, label: 'Publier' },
      { href: '/dashboard/broker/loads/post', icon: Package, label: 'Publier un chargement' },
      { href: '/dashboard/loads/board', icon: Package, label: 'Load Board' },
      { href: '/dashboard/broker/loads/search', icon: Navigation, label: 'Recherche Loads' },
      { href: '/dashboard/trucks/board', icon: Truck, label: 'Truck Board' },
      { href: '/dashboard/loads/alerts', icon: Bell, label: 'Alertes' },
      { href: '/dashboard/rates', icon: TrendingUp, label: 'Tarifs' },
      { href: '/dashboard/offers', icon: Handshake, label: 'Offres' },
      { href: '/dashboard/tracking', icon: Satellite, label: 'Tracking' },
      { href: '/dashboard/broker/bol/list', icon: FileText, label: 'BOL' },
      { href: '/dashboard/pod', icon: FileSignature, label: 'POD' },
      { href: '/dashboard/matching', icon: Zap, label: 'Matching' },
      { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
      { href: '/dashboard/payments', icon: Wallet, label: 'Paiements' },
      { href: '/dashboard/credit-check', icon: Shield, label: 'Credit' },
      { href: '/dashboard/verification', icon: ShieldCheck, label: 'KYC' },
      { href: '/dashboard/subscription', icon: CreditCard, label: 'Abonnement' },
    ];
  }

  // Admin - acces complet
  return [
    { href: '/dashboard/admin', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/loads/board', icon: Package, label: 'Load Board' },
    { href: '/dashboard/trucks/board', icon: Truck, label: 'Truck Board' },
    { href: '/dashboard/loads/alerts', icon: Bell, label: 'Alertes' },
    { href: '/dashboard/rates', icon: TrendingUp, label: 'Tarifs' },
    { href: '/dashboard/offers', icon: Handshake, label: 'Offres' },
    { href: '/dashboard/tracking', icon: Satellite, label: 'Tracking GPS' },
    { href: '/dashboard/admin/companies', icon: Building2, label: 'Entreprises' },
    { href: '/dashboard/admin/users', icon: Users, label: 'Utilisateurs' },
    { href: '/dashboard/admin/brokers', icon: Users, label: 'Courtiers' },
    { href: '/dashboard/admin/trucks', icon: Truck, label: 'Camions' },
    { href: '/dashboard/admin/loads', icon: Navigation, label: 'Chargements' },
    { href: '/dashboard/admin/bol', icon: FileText, label: 'BOL' },
    { href: '/dashboard/pod', icon: FileSignature, label: 'POD' },
    { href: '/dashboard/matching', icon: Zap, label: 'Matching' },
    { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/dashboard/payments', icon: Wallet, label: 'Paiements' },
    { href: '/dashboard/credit-check', icon: Shield, label: 'Credit Check' },
    { href: '/dashboard/admin/payments', icon: CreditCard, label: 'Admin Paiements' },
    { href: '/dashboard/admin/kyc', icon: ShieldCheck, label: 'Admin KYC' },
    { href: '/dashboard/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/dashboard/admin/settings', icon: Settings, label: 'Parametres' },
  ];
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user, role, suspended, accountStatus, companyId, brokerId } = await getAuthUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  const isPending = accountStatus === 'pending';

  // Bloquer l'acces aux comptes suspendus ou en attente — afficher la page appropriee
  if (suspended) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-14">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-primary-600">Nzela</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden sm:inline">{user.email}</span>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
                  >
                    Deconnexion
                  </button>
                </form>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="max-w-lg w-full mx-4">
              <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
                {/* Header rouge */}
                <div className={`px-8 py-6 text-center ${isPending ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">
                    {isPending ? 'Compte en attente' : 'Compte Suspendu'}
                  </h1>
                </div>
                {/* Contenu */}
                <div className="px-8 py-8 space-y-6">
                  <p className="text-gray-600 text-center leading-relaxed">
                    {isPending
                      ? 'Votre inscription a bien ete enregistree. Un administrateur doit valider votre compte avant que vous puissiez acceder aux fonctionnalites du tableau de bord. Vous recevrez un email ou une notification une fois votre compte approuve.'
                      : 'Votre compte a ete temporairement suspendu par l\'administrateur de la plateforme Nzela. Vous ne pouvez pas acceder aux fonctionnalites du tableau de bord pour le moment.'}
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-800 mb-2">Raisons possibles :</h3>
                    <ul className="text-sm text-amber-700 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="mt-1">&bull;</span>
                        <span>Documents de verification non soumis ou expires</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1">&bull;</span>
                        <span>Non-respect des conditions d&apos;utilisation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1">&bull;</span>
                        <span>Paiement en attente ou impaye</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1">&bull;</span>
                        <span>Verification de securite en cours</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Contactez-nous pour resoudre ce probleme :</h3>
                    <div className="space-y-2">
                      <a
                        href="mailto:info@nzelaa.com"
                        className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>info@nzelaa.com</span>
                      </a>
                      <a
                        href="tel:+243990243584"
                        className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        <span>+243 990 243 584</span>
                      </a>
                    </div>
                  </div>
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Se deconnecter
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const navLinks = getNavLinks(role);

  // Premiere ligne (principaux) et deuxieme ligne (reste) si > 8 liens
  const primaryLinks = navLinks.slice(0, 8);
  const secondaryLinks = navLinks.slice(8);

  const authContextValue = {
    user,
    role: role as 'admin' | 'company' | 'broker',
    companyId: companyId ?? null,
    brokerId: brokerId ?? null,
  };

  return (
    <DashboardAuthProvider value={authContextValue}>
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Ligne principale */}
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-6">
              <PrefetchLink href="/dashboard" className="text-xl font-bold text-primary-600 flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-white" />
                </div>
                Nzela
              </PrefetchLink>
              <div className="hidden md:flex items-center gap-1 overflow-x-auto">
                {primaryLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <PrefetchLink
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {link.label}
                    </PrefetchLink>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              {role === 'admin' && (
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-200">
                  ADMIN
                </span>
              )}
              <span className="text-xs text-gray-500 hidden sm:inline">{user.email}</span>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  Deconnexion
                </button>
              </form>
            </div>
          </div>

          {/* Deuxieme ligne si beaucoup de liens (admin) */}
          {secondaryLinks.length > 0 && (
            <div className="hidden md:flex items-center gap-1 pb-2 border-t border-gray-100 pt-1.5 -mt-px overflow-x-auto">
              {secondaryLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <PrefetchLink
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-all whitespace-nowrap"
                  >
                    <Icon className="w-3 h-3" />
                    {link.label}
                  </PrefetchLink>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation mobile */}
        <div className="md:hidden overflow-x-auto border-t border-gray-100">
          <div className="flex items-center gap-0.5 px-4 py-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <PrefetchLink
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center gap-0.5 px-2.5 py-1 text-gray-500 hover:text-primary-600 transition-colors min-w-fit"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[9px] font-medium whitespace-nowrap">{link.label}</span>
                </PrefetchLink>
              );
            })}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
    </DashboardAuthProvider>
  );
}
