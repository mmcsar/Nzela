import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Link } from '@/lib/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Clock } from '@/components/ui/Clock';
import Image from 'next/image';
import { Truck, Package, FileText, Shield, Smartphone, MapPin, Cpu, BarChart3, ArrowRight, Calculator, Fuel, FileCheck, Navigation, CheckCircle, Sparkles } from 'lucide-react';

/** Camion route (même visuel hero / carte revenus — neutre, sans marque) */
const UNSPLASH_TRUCK = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7' as const;
const HERO_TRUCK_IMAGE = `${UNSPLASH_TRUCK}?w=800&q=80`;

/**
 * Photos Unsplash (images.unsplash.com — déjà autorisé dans next.config).
 * Visuels pro / logistique (certaines scènes avec équipes ou opérateurs).
 */
const HOME_PHOTO = {
  editorial: 'https://images.unsplash.com/photo-1570805252434-9e62f73aa955?w=1600&q=80',
  /** Bandeau logistique au-dessus des 3 cartes « valeur » */
  valueSectionBanner: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&q=80',
  valueOps: '/api/home-images/value-ops',
  /** Carte « Améliorez votre efficacité » : pilotage / indicateurs sur laptop */
  valueDesk: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=85',
  /** Carte « Augmentez vos revenus » : poids lourd sur route */
  valueRoad: `${UNSPLASH_TRUCK}?w=900&q=80`,
  /** Étape « Publiez en quelques clics » : écran type load board / tableau de fret */
  howPublish: '/api/home-images/how-publish',
  howMatch: '/api/home-images/value-ops',
  howTrack: '/api/home-images/how-track',
  whyPanel: `${UNSPLASH_TRUCK}?w=1000&q=80`,
} as const;

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Publiez en quelques clics',
    desc: 'Créez un chargement ou publiez un camion avec toutes les informations nécessaires.',
    icon: FileText,
    image: HOME_PHOTO.howPublish,
    imageClassName: 'object-[center_10%]',
    imageOverlayClassName: 'bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent',
    altKey: 'homePhotoHow1Alt' as const,
  },
  {
    step: '02',
    title: 'Match intelligent en temps réel',
    desc: 'Nzela propose automatiquement les meilleures correspondances transporteur-courtier.',
    icon: Cpu,
    image: HOME_PHOTO.howMatch,
    imageClassName: 'object-center',
    imageOverlayClassName: 'bg-gradient-to-t from-slate-950/25 via-transparent to-transparent',
    altKey: 'homePhotoHow2Alt' as const,
  },
  {
    step: '03',
    title: 'Exécutez et suivez',
    desc: 'Gérez BOL, suivi GPS et communication depuis un seul espace opérationnel.',
    icon: MapPin,
    image: HOME_PHOTO.howTrack,
    imageClassName: 'object-[center_28%]',
    imageOverlayClassName: 'bg-gradient-to-t from-slate-950/25 via-transparent to-transparent',
    altKey: 'homePhotoHow3Alt' as const,
  },
];

const VALUE_CARDS = [
  {
    title: 'Gerez facilement votre activite',
    desc: 'Envoyez des devis ou reservez des chargements en un clic, a tout moment.',
    icon: BarChart3,
    image: HOME_PHOTO.valueOps,
    altKey: 'homePhotoValue1Alt' as const,
  },
  {
    title: 'Ameliorez votre efficacite',
    desc: 'Plus de 20 outils et fonctionnalites pour gagner du temps sur la route et au bureau.',
    icon: FileText,
    image: HOME_PHOTO.valueDesk,
    altKey: 'homePhotoValue2Alt' as const,
  },
  {
    title: 'Augmentez vos revenus',
    desc: "Trouvez des chargements et des recharges pour remplir votre planning à l'avance.",
    icon: Package,
    image: HOME_PHOTO.valueRoad,
    altKey: 'homePhotoValue3Alt' as const,
  },
] as const;

export default async function HomePage() {
  const t = await getTranslations('home');
  const te = await getTranslations('estimators');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Bandeau défilant — bienvenue & sortie (texte doré sur fond profond) */}
      <div
        className="flex items-stretch bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b border-amber-600/40 shadow-[inset_0_1px_0_rgba(253,230,138,0.12)]"
        role="region"
        aria-label="Annonce"
      >
        <div className="flex shrink-0 items-center border-r border-amber-600/35 bg-amber-950/60 px-3 sm:px-4 py-2.5" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, small decorative */}
          <img
            src="/images/flag-rdc.svg"
            alt=""
            width={22}
            height={29}
            className="h-[1.35rem] w-auto rounded-sm shadow-md ring-1 ring-amber-500/45 sm:h-6"
          />
        </div>
        <div className="ticker-wrap min-w-0 flex-1 py-2.5">
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
      <main className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-800 to-primary-700 text-white">
        <div
          className="absolute inset-0 z-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />
        <div className="absolute inset-0 opacity-10 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl animate-float-soft" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl animate-float-soft" style={{ animationDelay: '1.2s' }} />
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
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-slate-950/85 via-primary-900/55 to-transparent pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36">
          <div className="absolute top-6 right-4 sm:right-6 md:right-8 z-20 animate-fade-in animation-delay-200 opacity-0-init">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 shadow-lg backdrop-blur-md">
              <Clock />
            </div>
          </div>
          <div className="max-w-3xl opacity-0-init animate-fade-in-left animation-delay-100 rounded-3xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.03] p-8 sm:p-10 shadow-2xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-md">
            <div className="inline-flex items-center gap-2.5 mb-5 rounded-full border border-amber-300/35 bg-amber-400/15 px-3.5 sm:px-4 py-1.5 text-xs font-medium text-amber-50 backdrop-blur-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG flag */}
              <img
                src="/images/flag-rdc.svg"
                alt={t('rdcFlagAlt')}
                width={24}
                height={32}
                className="h-5 w-auto shrink-0 rounded-sm shadow-sm ring-1 ring-amber-200/30 sm:h-6"
              />
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200" />
              {t('heroBadge')}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 leading-[1.08] bg-gradient-to-br from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
              {t('heroTitle')}
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-amber-100/95 mb-4 leading-snug">
              {t('heroTagline')}
            </p>
            <p className="text-base sm:text-lg md:text-xl mb-4 text-white/85 leading-relaxed border-l-4 border-amber-400/80 pl-4">
              {t('heroLaunch')}
            </p>
            <p className="text-base sm:text-lg mb-8 text-primary-100/95 leading-relaxed">
              {t('heroLead')}
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {[t('heroChip1'), t('heroChip2'), t('heroChip3')].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/25 bg-white/10 text-xs sm:text-sm text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200" />
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/register/broker" className="sm:inline-flex">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto shadow-lg shadow-amber-900/20 ring-1 ring-amber-200/40">
                  Publier un chargement <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/register/company" className="sm:inline-flex">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/40 bg-white/5 text-white hover:bg-white/15">
                  Trouver un chargement
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-sm text-white/75">
              <span>{t('homeLoginPrompt')}</span>{' '}
              <Link href="/login" className="font-semibold text-amber-200 underline decoration-amber-400/60 underline-offset-4 transition hover:text-amber-100">
                {t('homeLoginLink')}
              </Link>
            </p>
            <p className="mt-3 text-xs text-amber-100/90">
              Anti-phishing: utilisez uniquement l&apos;email officiel <span className="font-semibold">info@nzelaa.com</span>.
            </p>
          </div>
        </div>
      </main>

      {/* Trust Bar */}
      <section className="relative py-10 sm:py-12 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80 opacity-0-init animate-slide-up animation-delay-200">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/60 to-transparent" aria-hidden />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 mb-2">{t('homeTrustHeading')}</p>
            <p className="text-sm sm:text-base text-slate-600">{t('homeTrustSub')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 text-center">
            {[
              { n: '50+', l: 'Utilisateurs actifs' },
              { n: '120+', l: 'Chargements traites' },
              { n: '26', l: 'Provinces couvertes' },
              { n: '99.9%', l: 'Disponibilite' },
            ].map((s) => (
              <div
                key={s.l}
                className="group rounded-2xl bg-white/90 border border-slate-200/90 py-5 px-3 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary-100"
              >
                <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-br from-primary-600 via-primary-700 to-slate-800 bg-clip-text text-transparent tabular-nums">
                  {s.n}
                </div>
                <div className="text-xs text-slate-500 mt-1.5 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau éditorial photo + citation (overlay slate/primary existants) */}
      <section className="relative min-h-[200px] sm:min-h-[260px] overflow-hidden border-b border-slate-200/80" aria-labelledby="home-editorial-quote">
        <Image
          src={HOME_PHOTO.editorial}
          alt={t('homePhotoCorridorAlt')}
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-900/75 to-primary-900/60"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex max-w-7xl min-h-[200px] sm:min-h-[260px] items-center px-4 py-12 sm:px-6 lg:px-8">
          <p
            id="home-editorial-quote"
            className="max-w-2xl text-lg font-medium leading-snug text-white drop-shadow-sm sm:text-xl md:text-2xl md:leading-snug border-l-4 border-amber-400/90 pl-5 sm:pl-6"
          >
            {t('homePhotoEditorialQuote')}
          </p>
        </div>
      </section>

      {/* Value Props - 3 columns */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-primary-400 to-amber-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('homeValueHeading')}</h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">{t('homeValueSub')}</p>
          </div>
          <div className="relative mb-10 md:mb-12 mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-lg ring-1 ring-slate-100 opacity-0-init animate-scale-in animation-delay-150 aspect-[16/9] min-h-[180px] sm:min-h-[220px] md:aspect-[21/9] md:min-h-[240px]">
            <Image
              src={HOME_PHOTO.valueSectionBanner}
              alt={t('valueSectionBannerAlt')}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1152px"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {VALUE_CARDS.map((card, index) => (
              <div
                key={card.title}
                className={`group overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 shadow-md ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary-100 opacity-0-init animate-scale-in ${
                  index === 0 ? 'animation-delay-200' : index === 1 ? 'animation-delay-300' : 'animation-delay-400'
                }`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
                  <Image
                    src={card.image}
                    alt={t(card.altKey)}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-7 sm:p-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-inner ring-1 ring-primary-100/80">
                    <card.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-primary-400 to-amber-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('homeHowHeading')}</h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">{t('homeHowSub')}</p>
          </div>
          <div className="flex flex-col gap-6 sm:gap-8">
            {HOW_IT_WORKS.map((item, index) => {
              const reverse = index % 2 === 1;
              return (
                <div
                  key={item.step}
                  className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-xl md:flex-row md:items-stretch opacity-0-init animate-slide-up ${
                    reverse ? 'md:flex-row-reverse' : ''
                  }`}
                  style={{ animationDelay: `${220 + index * 90}ms` }}
                >
                  <div className="relative min-h-[200px] w-full md:w-[44%] md:min-h-[240px] shrink-0 bg-slate-200">
                    <Image
                      src={item.image}
                      alt={t(item.altKey)}
                      fill
                      className={`object-cover ${item.imageClassName || 'object-center'} transition duration-500 group-hover:scale-[1.02]`}
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                    <div
                      className={`absolute inset-0 ${item.imageOverlayClassName || 'bg-gradient-to-t from-slate-950/25 via-transparent to-transparent'}`}
                      aria-hidden
                    />
                  </div>
                  <div className="relative flex flex-1 flex-col justify-center p-7 sm:p-8 md:p-10">
                    <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary-500/5 blur-2xl transition group-hover:bg-primary-500/10" aria-hidden />
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-700 bg-gradient-to-r from-primary-50 to-amber-50 px-3 py-1.5 rounded-full border border-primary-100/80">
                        Etape {item.step}
                      </span>
                      <item.icon className="h-7 w-7 text-primary-500 transition-transform group-hover:scale-110" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900 sm:text-xl">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-[15px]">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 sm:py-20 bg-slate-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-primary-400 to-amber-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('homeFeaturesHeading')}</h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">{t('homeFeaturesSub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: Truck, title: 'Load Board', desc: 'Acces a des chargements en temps reel. Plus de chargements fantomes.' },
              { icon: Cpu, title: 'Matching intelligent', desc: 'Notre algorithme trouve les meilleures correspondances automatiquement.' },
              { icon: MapPin, title: 'Suivi GPS', desc: 'Suivez chaque expedition en temps reel, du chargement a la livraison.' },
              { icon: FileText, title: 'Gestion BOL', desc: 'Creez et signez vos bordereaux de chargement numeriquement.' },
              { icon: Shield, title: 'Securise & RBAC', desc: 'Plateforme securisee avec controle d\'acces base sur les roles.' },
              { icon: Smartphone, title: 'PWA Mobile', desc: 'Installez l\'app sur votre telephone. Fonctionne hors connexion.' },
            ].map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md ring-1 ring-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary-100 opacity-0-init animate-slide-up"
                style={{ animationDelay: `${300 + i * 80}ms` }}
              >
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/80 p-3 ring-1 ring-primary-100">
                  <f.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why teams choose Nzela */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-primary-400 to-amber-400 lg:mx-0" aria-hidden />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">{t('homeWhyHeading')}</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                {t('homeWhySub')}
              </p>
              <div className="space-y-4">
                {[
                  'Un seul outil pour le Load Board, le Truck Board, le BOL et le tracking GPS',
                  'Mise en relation plus rapide entre courtiers et transporteurs',
                  'Processus plus fiable avec des informations normalisées et centralisées',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                    <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-primary-200/60 shadow-lg ring-1 ring-primary-100/50">
              <div className="absolute inset-0">
                <Image
                  src={HOME_PHOTO.whyPanel}
                  alt={t('homePhotoWhyAlt')}
                  fill
                  className="object-cover object-center opacity-[0.22] sm:opacity-[0.28]"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-primary-50/95 via-white/96 to-amber-50/90"
                aria-hidden
              />
              <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-amber-200/25 blur-3xl" aria-hidden />
              <div className="relative p-7 sm:p-9">
              <p className="relative text-xs uppercase tracking-[0.2em] text-primary-700 font-bold mb-5">Performance operationnelle</p>
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { v: '+38%', l: 'Temps gagné sur la coordination' },
                  { v: '-27%', l: 'Trajets à vide sur les flottes suivies' },
                  { v: '24/7', l: 'Visibilité sur les opérations' },
                  { v: '100%', l: 'Flux centralisé dans l’interface' },
                ].map((k) => (
                  <div key={k.v} className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                    <p className="text-2xl font-extrabold bg-gradient-to-br from-primary-600 to-slate-800 bg-clip-text text-transparent">{k.v}</p>
                    <p className="text-xs text-slate-600 mt-1.5 leading-snug">{k.l}</p>
                  </div>
                ))}
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
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-primary-400 to-amber-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('homeTestimonialsHeading')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { quote: 'Grace a Nzela, je ne fais plus de trajets a vide. Je trouve toujours un chargement de retour avant d\'arriver a destination.', name: 'Jean-Pierre K.', role: 'Transporteur' },
              { quote: 'L\'application est facile a utiliser. Mes chauffeurs trouvent des chargements directement depuis leur telephone.', name: 'Marie T.', role: 'Proprietaire de flotte' },
              { quote: 'Le Load Board est toujours a jour. D\'un clic, je reserve un chargement. Fini les appels telephoniques interminables.', name: 'Patrick M.', role: 'Chauffeur independant' },
            ].map((row, i) => (
              <div
                key={row.name}
                className="relative rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md ring-1 ring-slate-100 opacity-0-init animate-slide-up transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                <span className="absolute left-5 top-5 text-4xl font-serif text-primary-200/90 leading-none" aria-hidden>
                  &ldquo;
                </span>
                <p className="relative text-slate-600 text-sm leading-relaxed mb-6 pl-1 pt-6">{row.quote}</p>
                <div className="border-t border-slate-100 pt-4">
                  <p className="font-semibold text-slate-900 text-sm">{row.name}</p>
                  <p className="text-xs text-primary-600 font-medium mt-0.5">{row.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20 sm:py-24 bg-gradient-to-br from-primary-800 via-primary-600 to-indigo-900 text-white opacity-0-init animate-fade-in animation-delay-300">
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-primary-300/25 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">
            {t('homeCtaTitle')}
          </h2>
          <p className="text-lg sm:text-xl mb-10 sm:mb-12 text-primary-100/95 max-w-2xl mx-auto leading-relaxed">
            {t('homeCtaSub')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 text-left">
            <div className="rounded-2xl bg-white/10 border border-white/25 p-6 sm:p-7 shadow-lg backdrop-blur-md ring-1 ring-white/10 transition hover:bg-white/[0.14]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/90 mb-2">Je suis courtier</p>
              <h3 className="text-xl font-semibold mb-2">Publiez plus vite, remplissez plus vite</h3>
              <p className="text-sm text-primary-100/95 mb-5 leading-relaxed">Diffusez vos chargements, trouvez des transporteurs qualifiés et suivez l&apos;exécution.</p>
              <Link href="/register/broker">
                <Button size="lg" variant="secondary" className="shadow-lg">
                  Commencer en tant que courtier <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/25 p-6 sm:p-7 shadow-lg backdrop-blur-md ring-1 ring-white/10 transition hover:bg-white/[0.14]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/90 mb-2">Je suis transporteur</p>
              <h3 className="text-xl font-semibold mb-2">Réduisez les trajets à vide</h3>
              <p className="text-sm text-primary-100/95 mb-5 leading-relaxed">Accédez aux chargements en temps réel et pilotez votre flotte depuis un seul tableau de bord.</p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Link href="/register/company">
                  <Button size="lg" variant="secondary" className="shadow-lg">
                    Créer mon compte transporteur <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="border-white/40 bg-white/5 text-white hover:bg-white/15">
                    Abonnement unique 50 USD/mois
                  </Button>
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

