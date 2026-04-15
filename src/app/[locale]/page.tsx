import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Link } from '@/lib/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Clock } from '@/components/ui/Clock';
import Image from 'next/image';
import { Truck, Package, FileText, Shield, Smartphone, MapPin, Cpu, BarChart3, ArrowRight, Calculator, Fuel, FileCheck, Navigation, CheckCircle, Sparkles } from 'lucide-react';

const HERO_TRUCK_IMAGE = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80';
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Publiez en quelques clics',
    desc: 'Créez un chargement ou publiez un camion avec toutes les informations nécessaires.',
    icon: FileText,
  },
  {
    step: '02',
    title: 'Match intelligent en temps réel',
    desc: 'Nzela propose automatiquement les meilleures correspondances transporteur-courtier.',
    icon: Cpu,
  },
  {
    step: '03',
    title: 'Exécutez et suivez',
    desc: 'Gérez BOL, suivi GPS et communication depuis un seul espace opérationnel.',
    icon: MapPin,
  },
];

export default async function HomePage() {
  const t = await getTranslations('home');
  const te = await getTranslations('estimators');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Bandeau défilant — bienvenue & sortie (texte doré sur fond profond) */}
      <div
        className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 py-2.5 border-b border-amber-600/40 shadow-[inset_0_1px_0_rgba(253,230,138,0.12)]"
        role="region"
        aria-label="Annonce"
      >
        <div className="ticker-wrap">
          <div className="ticker-inner">
            <span className="bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-200 bg-clip-text font-semibold tracking-wide text-transparent drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              {t('ticker')}
            </span>
            <span className="bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-200 bg-clip-text font-semibold tracking-wide text-transparent drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              {t('ticker')}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-10 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-float-soft" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-float-soft" style={{ animationDelay: '1.2s' }} />
        </div>
        {/* Real truck image background - visible */}
        <div className="absolute inset-0 z-[1] flex items-center justify-end pointer-events-none" aria-hidden>
          <Image
            src={HERO_TRUCK_IMAGE}
            alt=""
            width={800}
            height={533}
            className="h-[85vh] w-auto max-w-[75vw] object-contain object-right opacity-70 md:opacity-80"
            priority
            sizes="(max-width: 768px) 60vw, 520px"
          />
        </div>
        {/* Overlay left pour garder le texte lisible */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-primary-700/90 via-primary-700/40 to-transparent pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="absolute top-6 right-4 sm:right-6 md:right-8 z-20 animate-fade-in animation-delay-200 opacity-0-init">
            <Clock />
          </div>
          <div className="max-w-3xl opacity-0-init animate-fade-in-left animation-delay-100">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm animate-glow-soft">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              Plateforme logistique nouvelle génération
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight bg-gradient-to-br from-amber-50 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(251,191,36,0.25)] [text-shadow:none]">
              {t('heroTitle')}
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-amber-100/95 mb-4">
              {t('heroTagline')}
            </p>
            <p className="text-base sm:text-lg md:text-xl mb-4 text-amber-50/90">
              {t('heroLaunch')}
            </p>
            <p className="text-base sm:text-lg mb-8 text-primary-100/90">
              {t('heroLead')}
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['RDC + Zambie', 'FR / EN', 'Bourse de fret en temps réel'].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-xs sm:text-sm text-white/95 backdrop-blur-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/register/broker">
                <Button size="lg" variant="secondary">
                  Publier un chargement <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/register/company">
                <Button size="lg" variant="outline">Trouver un chargement</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Bar */}
      <section className="py-6 sm:py-8 bg-gray-50 border-b opacity-0-init animate-slide-up animation-delay-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm py-4 px-3 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="text-xl sm:text-2xl font-bold text-primary-600">50+</div>
              <div className="text-xs text-gray-500 mt-1">Utilisateurs actifs</div>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm py-4 px-3 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="text-xl sm:text-2xl font-bold text-primary-600">120+</div>
              <div className="text-xs text-gray-500 mt-1">Chargements traites</div>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm py-4 px-3 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="text-xl sm:text-2xl font-bold text-primary-600">26</div>
              <div className="text-xs text-gray-500 mt-1">Provinces couvertes</div>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm py-4 px-3 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="text-xl sm:text-2xl font-bold text-primary-600">99.9%</div>
              <div className="text-xs text-gray-500 mt-1">Disponibilite</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props - 3 columns */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            <div className="text-center opacity-0-init animate-scale-in animation-delay-200 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gerez facilement votre activite</h3>
              <p className="text-gray-500 text-sm">
                Envoyez des devis ou reservez des chargements en un clic, a tout moment.
              </p>
            </div>
            <div className="text-center opacity-0-init animate-scale-in animation-delay-300 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ameliorez votre efficacite</h3>
              <p className="text-gray-500 text-sm">
                Plus de 20 outils et fonctionnalites pour gagner du temps sur la route et au bureau.
              </p>
            </div>
            <div className="text-center opacity-0-init animate-scale-in animation-delay-400 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Augmentez vos revenus</h3>
              <p className="text-gray-500 text-sm">
                Trouvez des chargements et des recharges pour remplir votre planning a l&apos;avance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Comment Nzela fonctionne</h2>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto text-sm sm:text-base">
            Un flux simple, pensé pour accélérer les opérations sans complexifier le travail de vos équipes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item, index) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 opacity-0-init animate-slide-up"
                style={{ animationDelay: `${220 + index * 90}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full group-hover:bg-primary-100 transition-colors">
                    ETAPE {item.step}
                  </span>
                  <item.icon className="w-5 h-5 text-primary-500 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Fonctionnalites principales</h2>
          <p className="text-center text-gray-500 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Tout ce dont les transporteurs et courtiers ont besoin, sur une seule plateforme.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: Truck, title: 'Load Board', desc: 'Acces a des chargements en temps reel. Plus de chargements fantomes.' },
              { icon: Cpu, title: 'Matching intelligent', desc: 'Notre algorithme trouve les meilleures correspondances automatiquement.' },
              { icon: MapPin, title: 'Suivi GPS', desc: 'Suivez chaque expedition en temps reel, du chargement a la livraison.' },
              { icon: FileText, title: 'Gestion BOL', desc: 'Creez et signez vos bordereaux de chargement numeriquement.' },
              { icon: Shield, title: 'Securise & RBAC', desc: 'Plateforme securisee avec controle d\'acces base sur les roles.' },
              { icon: Smartphone, title: 'PWA Mobile', desc: 'Installez l\'app sur votre telephone. Fonctionne hors connexion.' },
            ].map((f, i) => (
              <div key={f.title} className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 opacity-0-init animate-slide-up" style={{ animationDelay: `${300 + i * 80}ms` }}>
                <f.icon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why teams choose Nzela */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Pourquoi les équipes choisissent Nzela</h2>
              <p className="text-gray-500 mb-6">
                Nzela combine acquisition de fret, exécution documentaire et visibilité terrain dans une expérience unique.
              </p>
              <div className="space-y-3">
                {[
                  'Un seul outil pour le Load Board, le Truck Board, le BOL et le tracking GPS',
                  'Mise en relation plus rapide entre courtiers et transporteurs',
                  'Processus plus fiable avec des informations normalisées et centralisées',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-6 sm:p-8">
              <p className="text-xs uppercase tracking-wider text-primary-600 font-semibold mb-4">Performance opérationnelle</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-2xl font-bold text-primary-700">+38%</p>
                  <p className="text-xs text-gray-500 mt-1">Temps gagné sur la coordination</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-2xl font-bold text-primary-700">-27%</p>
                  <p className="text-xs text-gray-500 mt-1">Trajets à vide sur les flottes suivies</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-2xl font-bold text-primary-700">24/7</p>
                  <p className="text-xs text-gray-500 mt-1">Visibilité sur les opérations</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-2xl font-bold text-primary-700">100%</p>
                  <p className="text-xs text-gray-500 mt-1">Flux centralisé dans l’interface</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outils : teaser vers la page dédiée */}
      <section className="py-12 sm:py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-8 opacity-0-init animate-fade-in animation-delay-200">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{te('homeToolsTitle')}</h2>
            <p className="text-gray-500 text-sm sm:text-base mb-6">{te('homeToolsIntro')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/dashboard/tools">
                <Button size="lg" className="gap-2">
                  <Calculator className="w-5 h-5" />
                  {te('homeToolsCta')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/products/toolkit">
                <Button size="lg" variant="outline" className="gap-2">
                  {te('homeToolsToolkit')}
                </Button>
              </Link>
            </div>
            <p className="text-gray-400 text-xs mt-4 max-w-lg mx-auto">{te('homeToolsFootnote')}</p>
          </div>
        </div>
      </section>

      {/* Des outils pour la route et le bureau */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{te('toolsSectionTitle')}</h2>
          <p className="text-center text-gray-500 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            {te('toolsSectionIntro')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {[
              { icon: Calculator, titleKey: 'toolTileRatesTitle' as const, descKey: 'toolTileRatesDesc' as const },
              { icon: Fuel, titleKey: 'toolTileFuelTitle' as const, descKey: 'toolTileFuelDesc' as const },
              { icon: FileCheck, titleKey: 'toolTileDocsTitle' as const, descKey: 'toolTileDocsDesc' as const },
              { icon: Navigation, titleKey: 'toolTileNavTitle' as const, descKey: 'toolTileNavDesc' as const },
              { icon: Smartphone, titleKey: 'toolTileMobileTitle' as const, descKey: 'toolTileMobileDesc' as const },
            ].map((f, i) => (
              <div key={f.titleKey} className="bg-white rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 opacity-0-init animate-scale-in" style={{ animationDelay: `${400 + i * 60}ms` }}>
                <f.icon className="w-10 h-10 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{te(f.titleKey)}</h3>
                <p className="text-sm text-gray-500">{te(f.descKey)}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-10">
            <Link href="/products/toolkit">
              <Button size="lg" variant="outline">
                {te('discoverAllTools')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10">Ce que disent nos utilisateurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: 'Grace a Nzela, je ne fais plus de trajets a vide. Je trouve toujours un chargement de retour avant d\'arriver a destination.', name: 'Jean-Pierre K.', role: 'Transporteur' },
              { quote: 'L\'application est facile a utiliser. Mes chauffeurs trouvent des chargements directement depuis leur telephone.', name: 'Marie T.', role: 'Proprietaire de flotte' },
              { quote: 'Le Load Board est toujours a jour. D\'un clic, je reserve un chargement. Fini les appels telephoniques interminables.', name: 'Patrick M.', role: 'Chauffeur independant' },
            ].map((t, i) => (
              <div key={t.name} className="bg-gray-50 rounded-xl p-5 sm:p-6 opacity-0-init animate-slide-up transition-all duration-300 hover:shadow-md hover:-translate-y-1" style={{ animationDelay: `${500 + i * 100}ms` }}>
                <p className="text-gray-600 text-sm italic mb-4">&quot;{t.quote}&quot;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-primary-600 text-white opacity-0-init animate-fade-in animation-delay-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Le fret n&apos;a jamais ete aussi simple</h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-primary-100">
            Rejoignez Nzela et transformez votre gestion logistique
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="rounded-2xl bg-white/10 border border-white/20 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-wider text-primary-100 mb-2">Je suis courtier</p>
              <h3 className="text-xl font-semibold mb-2">Publiez plus vite, remplissez plus vite</h3>
              <p className="text-sm text-primary-100 mb-4">Diffusez vos chargements, trouvez des transporteurs qualifiés et suivez l&apos;exécution.</p>
              <Link href="/register/broker">
                <Button size="lg" variant="secondary">
                  Commencer en tant que courtier <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-wider text-primary-100 mb-2">Je suis transporteur</p>
              <h3 className="text-xl font-semibold mb-2">Réduisez les trajets à vide</h3>
              <p className="text-sm text-primary-100 mb-4">Accédez aux chargements en temps réel et pilotez votre flotte depuis un seul tableau de bord.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register/company">
                  <Button size="lg" variant="secondary">
                    Créer mon compte transporteur <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">Abonnement unique 50 USD/mois</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

