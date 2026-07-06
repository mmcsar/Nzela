import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Link } from '@/lib/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HomeFloatingImage } from '@/components/home/HomeFloatingImage';
import { HomeCorridorBar } from '@/components/home/HomeCorridorBar';
import { HomeReveal } from '@/components/home/HomeReveal';
import { HomeEditorialBanner } from '@/components/home/HomeEditorialBanner';
import { HomeValueCards } from '@/components/home/HomeValueCards';
import { Clock } from '@/components/ui/Clock';
import Image from 'next/image';
import { Truck, Package, FileText, Shield, Smartphone, MapPin, Cpu, BarChart3, ArrowRight, Calculator, Fuel, FileCheck, Navigation, Sparkles } from 'lucide-react';
import { SUPPORT_PHONE, supportPhoneTel } from '@/lib/constants/support';

/** Camion route (hero / carte revenus — neutre, sans marque) */
const UNSPLASH_TRUCK = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7' as const;
const HERO_TRUCK_IMAGE = `${UNSPLASH_TRUCK}?w=800&q=80`;
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'info@nzelaa.com';

/**
 * Photos Unsplash (images.unsplash.com — déjà autorisé dans next.config).
 * Visuels pro / logistique (certaines scènes avec équipes ou opérateurs).
 */
const HOME_PHOTO = {
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
} as const;

const HOW_IT_WORKS = [
  {
    step: '01',
    titleKey: 'how1Title',
    descKey: 'how1Desc',
    icon: FileText,
    image: HOME_PHOTO.howPublish,
    imageClassName: 'object-[center_10%]',
    imageOverlayClassName: 'bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent',
    altKey: 'homePhotoHow1Alt' as const,
  },
  {
    step: '02',
    titleKey: 'how2Title',
    descKey: 'how2Desc',
    icon: Cpu,
    image: HOME_PHOTO.howMatch,
    imageClassName: 'object-center',
    imageOverlayClassName: 'bg-gradient-to-t from-slate-950/25 via-transparent to-transparent',
    altKey: 'homePhotoHow2Alt' as const,
  },
  {
    step: '03',
    titleKey: 'how3Title',
    descKey: 'how3Desc',
    icon: MapPin,
    image: HOME_PHOTO.howTrack,
    imageClassName: 'object-[center_28%]',
    imageOverlayClassName: 'bg-gradient-to-t from-slate-950/25 via-transparent to-transparent',
    altKey: 'homePhotoHow3Alt' as const,
  },
] as const;

const VALUE_CARDS = [
  { titleKey: 'value1Title', descKey: 'value1Desc', icon: BarChart3, image: HOME_PHOTO.valueOps, altKey: 'homePhotoValue1Alt' as const },
  { titleKey: 'value2Title', descKey: 'value2Desc', icon: FileText, image: HOME_PHOTO.valueDesk, altKey: 'homePhotoValue2Alt' as const },
  { titleKey: 'value3Title', descKey: 'value3Desc', icon: Package, image: HOME_PHOTO.valueRoad, altKey: 'homePhotoValue3Alt' as const },
] as const;

const HOME_FEATURES = [
  { icon: Truck, titleKey: 'feature1Title', descKey: 'feature1Desc' },
  { icon: Cpu, titleKey: 'feature2Title', descKey: 'feature2Desc' },
  { icon: MapPin, titleKey: 'feature3Title', descKey: 'feature3Desc' },
  { icon: FileText, titleKey: 'feature4Title', descKey: 'feature4Desc' },
  { icon: Shield, titleKey: 'feature5Title', descKey: 'feature5Desc' },
  { icon: Smartphone, titleKey: 'feature6Title', descKey: 'feature6Desc' },
] as const;

const HERO_CHIPS = ['heroChip1', 'heroChip2', 'heroChip3', 'heroChip4'] as const;

const WHY_KPIS = [
  { v: '+38%', lKey: 'whyKpi1' },
  { v: '-27%', lKey: 'whyKpi2' },
  { v: '24/7', lKey: 'whyKpi3' },
  { v: '100%', lKey: 'whyKpi4' },
] as const;

const TRUST_STATS = [
  { vKey: 'trustStat1Value', lKey: 'trustStat1' },
  { vKey: 'trustStat2Value', lKey: 'trustStat2' },
  { vKey: 'trustStat3Value', lKey: 'trustStat3' },
  { vKey: 'trustStat4Value', lKey: 'trustStat4' },
] as const;

/** Bandeau éditorial — URLs directes (mêmes visuels que /api/home-images, compatibles next/image) */
const HOME_EDITORIAL = {
  corridor: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1600&q=80',
  warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80',
  docs: 'https://images.unsplash.com/photo-1771923082503-0a3381c46cef?w=1600&q=85',
} as const;

const EDITORIAL_SLIDE_KEYS = [
  {
    src: HOME_EDITORIAL.corridor,
    altKey: 'homePhotoEditorial1Alt' as const,
    captionKey: 'homePhotoEditorial1Caption' as const,
    objectPosition: '55% center',
  },
  {
    src: HOME_EDITORIAL.warehouse,
    altKey: 'homePhotoEditorial2Alt' as const,
    captionKey: 'homePhotoEditorial2Caption' as const,
    objectPosition: 'center center',
  },
  {
    src: HOME_EDITORIAL.docs,
    altKey: 'homePhotoEditorial3Alt' as const,
    captionKey: 'homePhotoEditorial3Caption' as const,
    objectPosition: 'center 22%',
  },
] as const;

const TESTIMONIALS = [
  { quoteKey: 'testimonial1Quote', nameKey: 'testimonial1Name', roleKey: 'testimonial1Role' },
  { quoteKey: 'testimonial2Quote', nameKey: 'testimonial2Name', roleKey: 'testimonial2Role' },
  { quoteKey: 'testimonial3Quote', nameKey: 'testimonial3Name', roleKey: 'testimonial3Role' },
] as const;

export default async function HomePage() {
  const t = await getTranslations('home');
  const te = await getTranslations('estimators');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Contact bar */}
      <div className="bg-slate-950 text-slate-100 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs sm:text-sm">
          <p className="text-slate-300">{t('homeContactBar')}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a href={`tel:${supportPhoneTel()}`} className="font-medium text-amber-200 hover:text-amber-100 transition-colors">
              {SUPPORT_PHONE}
            </a>
            <span className="text-slate-500" aria-hidden>•</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-amber-200 hover:text-amber-100 transition-colors">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>

      {/* Bandeau défilant — texte doré */}
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

      {/* Hero — structure nzelaa.com, palette émeraude + carte corridor */}
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
        <div className="home-hero-aurora pointer-events-none absolute inset-0 z-0" aria-hidden />
        <div className="absolute inset-0 z-0 opacity-[0.26] pointer-events-none">
          <div className="absolute top-16 left-8 w-80 h-80 bg-amber-200/45 rounded-full blur-3xl animate-float-soft" />
          <div className="absolute bottom-8 right-16 w-[28rem] h-[28rem] bg-primary-300/45 rounded-full blur-3xl animate-float-soft" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,42rem)] h-64 bg-white/20 rounded-full blur-3xl animate-float-soft opacity-70" style={{ animationDelay: '2.1s' }} />
        </div>
        {/* Camion à droite — visible à partir de md (comme nzelaa.com) */}
        <div className="absolute inset-0 z-[1] hidden items-center justify-end pointer-events-none md:flex hero-truck-drift" aria-hidden>
          <Image
            src={HERO_TRUCK_IMAGE}
            alt=""
            width={800}
            height={533}
            className="h-[85vh] w-auto max-w-[75vw] object-contain object-right opacity-70 lg:opacity-80"
            priority
            sizes="520px"
          />
        </div>
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-slate-950/90 via-primary-900/75 to-primary-800/85 pointer-events-none md:bg-gradient-to-r md:from-slate-950/85 md:via-primary-900/55 md:to-transparent" aria-hidden />
        <div className="home-hero-aurora-veil pointer-events-none absolute inset-0 z-[3]" aria-hidden />

        <div className="relative z-10 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-28 lg:py-32">
          {/* Horloge : dans le flux sur mobile (évite le chevauchement), flottante sur md+ */}
          <div className="mb-3 flex justify-end sm:mb-0 md:absolute md:top-6 md:right-6 lg:right-8 md:z-20 animate-fade-in animation-delay-200 opacity-0-init">
            <div className="rounded-xl sm:rounded-2xl border border-white/20 bg-white/10 px-1.5 py-1 sm:px-3 sm:py-2 shadow-lg backdrop-blur-md">
              <Clock />
            </div>
          </div>

          {/* Carte glass — même cadrage que nzelaa.com (max-w-3xl à gauche) */}
          <div className="relative max-w-3xl overflow-hidden opacity-0-init animate-fade-in-left animation-delay-100 rounded-2xl sm:rounded-3xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.03] p-4 sm:p-8 md:p-10 shadow-2xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-md">
            <div className="home-hero-card-sheen pointer-events-none absolute inset-0 rounded-3xl" aria-hidden />
            <div className="relative z-10">
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
                <h1 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight mb-3 sm:mb-4 leading-[1.12] sm:leading-[1.1] bg-gradient-to-br from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
                  {t('heroTitle')}
                </h1>
                <p className="text-base sm:text-xl md:text-2xl font-semibold text-amber-100/95 mb-3 sm:mb-4 leading-snug">
                  {t('heroTagline')}
                </p>
                <p className="text-sm sm:text-base md:text-lg mb-3 sm:mb-4 text-white/85 leading-relaxed border-l-4 border-amber-400/80 pl-3 sm:pl-4">
                  {t('heroLaunch')}
                </p>
                <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-primary-100/95 leading-relaxed">
                  {t('heroLead')}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                  {HERO_CHIPS.map((chipKey, chipIndex) => (
                    <span
                      key={chipKey}
                      className="home-hero-chip inline-flex items-center gap-1 px-2.5 py-1 sm:gap-1.5 sm:px-3.5 sm:py-1.5 rounded-full border border-white/25 bg-white/10 text-[11px] sm:text-xs md:text-sm text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15"
                      style={{ animationDelay: `${80 * chipIndex}ms` }}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200" />
                      {t(chipKey)}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <ButtonLink
                    href="/register/broker"
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto shadow-lg shadow-amber-900/20 ring-1 ring-amber-200/40"
                  >
                    {t('heroCtaPublish')} <ArrowRight className="w-4 h-4 ml-2" />
                  </ButtonLink>
                  <ButtonLink
                    href="/register/company"
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                  >
                    {t('heroCtaFind')}
                  </ButtonLink>
                </div>
                <p className="mt-8 text-sm text-white/75">
                  <span>{t('homeLoginPrompt')}</span>{' '}
                  <Link href="/login" className="font-semibold text-amber-200 underline decoration-amber-400/60 underline-offset-4 transition hover:text-amber-100">
                    {t('homeLoginLink')}
                  </Link>
                </p>
              <p className="mt-3 text-xs text-amber-100/90">
                {t('homeAntiPhishing')} <span className="font-semibold">info@nzelaa.com</span>.
              </p>
            </div>
          </div>

          {/* Bandeau corridor — intégré au bas du hero, verre dépoli, camion libre au-dessus */}
          <div className="relative z-10 mt-6 w-full opacity-0-init animate-fade-in animation-delay-400 sm:mt-10 md:mt-14 lg:mt-16">
            <HomeCorridorBar
              label={t('corridorCardLabel')}
              title={t('corridorCardTitle')}
              titleHighlight={t('corridorCardHighlight')}
              nodes={[
                { city: t('corridorNode1City'), meta: t('corridorNode1Meta'), active: true },
                { city: t('corridorNode2City'), meta: t('corridorNode2Meta') },
                { city: t('corridorNode3City'), meta: t('corridorNode3Meta') },
                { city: t('corridorNode4City'), meta: t('corridorNode4Meta'), active: true },
              ]}
              countries={[
                t('corridorCountry1'),
                t('corridorCountry2'),
                t('corridorCountry3'),
                t('corridorCountry4'),
                t('corridorCountry5'),
              ]}
            />
          </div>
        </div>
      </main>

      {/* Trust Bar */}
      <HomeReveal className="relative py-10 sm:py-12 bg-gradient-to-b from-primary-50/55 to-white border-b border-primary-100/50">
        <div className="trust-line-sheen pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/60 to-transparent" aria-hidden />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 mb-2">{t('homeTrustHeading')}</p>
            <p className="text-sm sm:text-base text-slate-600">{t('homeTrustSub')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 text-center">
            {TRUST_STATS.map((s) => (
              <div
                key={s.lKey}
                className="group rounded-2xl bg-white/90 border border-primary-100/70 py-4 px-2 sm:py-5 sm:px-3 shadow-sm ring-1 ring-primary-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary-100"
              >
                <div className="text-lg sm:text-xl font-extrabold bg-gradient-to-br from-primary-600 via-primary-700 to-slate-800 bg-clip-text text-transparent leading-tight">
                  {t(s.vKey)}
                </div>
                <div className="text-xs text-slate-500 mt-1.5 font-medium">{t(s.lKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </HomeReveal>

      {/* Bandeau éditorial : fret (corridor) → flotte (entrepôt) → documents */}
      <HomeReveal>
        <HomeEditorialBanner
          quote={t('homePhotoEditorialQuote')}
          slides={EDITORIAL_SLIDE_KEYS.map((slide) => ({
            src: slide.src,
            alt: t(slide.altKey),
            caption: t(slide.captionKey),
            objectPosition: slide.objectPosition,
          }))}
        />
      </HomeReveal>

      {/* Value Props - 3 columns */}
      <HomeReveal className="py-12 sm:py-16 md:py-20 bg-emerald-50/45">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-primary-400 to-emerald-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('homeValueHeading')}</h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">{t('homeValueSub')}</p>
          </div>
          <div className="relative mb-6 sm:mb-8 md:mb-12 mx-auto w-full max-w-6xl overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 bg-slate-200 shadow-lg ring-1 ring-slate-100 aspect-[16/9] min-h-[140px] sm:aspect-[16/10] sm:min-h-[180px] md:min-h-[240px] lg:aspect-[21/9]">
            <HomeFloatingImage
              src={HOME_PHOTO.valueSectionBanner}
              alt={t('valueSectionBannerAlt')}
              sizes="(max-width: 1280px) 100vw, 1152px"
              slow
            />
          </div>
          <HomeValueCards
            cards={VALUE_CARDS.map((card) => ({
              titleKey: card.titleKey,
              title: t(card.titleKey),
              desc: t(card.descKey),
              image: card.image,
              alt: t(card.altKey),
              Icon: card.icon,
            }))}
          />
          <p className="mt-3 text-center text-xs text-slate-400 md:hidden">
            {t('homeValueSwipeHint')}
          </p>
        </div>
      </HomeReveal>

      {/* How it works */}
      <HomeReveal className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-emerald-50/35 via-emerald-50/50 to-emerald-50/30 border-t border-emerald-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-primary-400 to-emerald-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('homeHowHeading')}</h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">{t('homeHowSub')}</p>
          </div>
          <div className="flex flex-col gap-6 sm:gap-8">
            {HOW_IT_WORKS.map((item, index) => {
              const reverse = index % 2 === 1;
              return (
                <div
                  key={item.step}
                  className={`group flex flex-col overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/95 shadow-md ring-1 ring-emerald-50/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-xl md:flex-row md:items-stretch ${
                    reverse ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="relative min-h-[168px] w-full overflow-hidden sm:min-h-[200px] md:w-[44%] md:min-h-[240px] shrink-0 bg-slate-200">
                    <HomeFloatingImage
                      src={item.image}
                      alt={t(item.altKey)}
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className={`object-cover ${item.imageClassName || 'object-center'}`}
                      phase={((index % 3) + 1) as 1 | 2 | 3}
                    />
                    <div
                      className={`absolute inset-0 z-[1] ${item.imageOverlayClassName || 'bg-gradient-to-t from-slate-950/25 via-transparent to-transparent'}`}
                      aria-hidden
                    />
                  </div>
                  <div className="relative flex flex-1 flex-col justify-center p-5 sm:p-7 md:p-10">
                    <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary-500/5 blur-2xl transition group-hover:bg-primary-500/10" aria-hidden />
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-700 bg-gradient-to-r from-primary-50 to-emerald-50 px-3 py-1.5 rounded-full border border-primary-100/80">
                        {t('howStepLabel', { step: item.step })}
                      </span>
                      <item.icon className="h-7 w-7 text-primary-500 transition-transform group-hover:scale-110" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900 sm:text-xl">{t(item.titleKey)}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-[15px]">{t(item.descKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </HomeReveal>

      {/* Feature Highlights */}
      <HomeReveal className="py-16 sm:py-20 bg-gradient-to-b from-emerald-100/30 to-emerald-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-primary-400 to-emerald-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('homeFeaturesHeading')}</h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">{t('homeFeaturesSub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {HOME_FEATURES.map((f) => (
              <div
                key={f.titleKey}
                className="rounded-2xl border border-emerald-100/80 bg-white/95 p-6 sm:p-7 shadow-md ring-1 ring-emerald-50/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary-100"
              >
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/80 p-3 ring-1 ring-primary-100">
                  <f.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900">{t(f.titleKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </HomeReveal>

      {/* Why teams choose Nzela */}
      <HomeReveal className="py-16 sm:py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[26px] bg-gradient-to-br from-primary-900 to-primary-700 p-8 sm:p-12 text-white shadow-[0_30px_70px_-28px_rgba(5,61,44,0.42)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-12 items-center">
              <div>
                <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary-300 mb-3 before:inline-block before:mr-2 before:h-px before:w-5 before:bg-primary-300 before:align-middle">
                  {t('whyPerfHeading')}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">{t('homeWhyHeading')}</h2>
                <p className="text-[#d6f5e8] leading-relaxed max-w-[42ch]">
                  {t('homeWhySub')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:gap-8">
                {WHY_KPIS.map((k) => (
                  <div key={k.v}>
                    <p className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-none">
                      {k.v.replace('%', '')}
                      {k.v.includes('%') && <span className="text-primary-300">%</span>}
                    </p>
                    <p className="text-sm text-[#bfe9d6] mt-2 leading-snug">{t(k.lKey)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </HomeReveal>

      {/* Outils : teaser vers la page dédiée */}
      <HomeReveal className="py-12 sm:py-16 bg-emerald-50/40 border-t border-emerald-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{te('homeToolsTitle')}</h2>
            <p className="text-gray-500 text-sm sm:text-base mb-6">{te('homeToolsIntro')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <ButtonLink href="/dashboard/tools" size="lg" className="gap-2">
                <Calculator className="w-5 h-5" />
                {te('homeToolsCta')}
                <ArrowRight className="w-4 h-4" />
              </ButtonLink>
              <ButtonLink href="/products/toolkit" size="lg" variant="outline" className="gap-2">
                {te('homeToolsToolkit')}
              </ButtonLink>
            </div>
            <p className="text-gray-400 text-xs mt-4 max-w-lg mx-auto">{te('homeToolsFootnote')}</p>
          </div>
        </div>
      </HomeReveal>

      {/* Des outils pour la route et le bureau */}
      <HomeReveal className="py-12 sm:py-16 bg-emerald-50/35">
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
            ].map((f) => (
              <div key={f.titleKey} className="bg-white/95 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-emerald-100/70 ring-1 ring-emerald-50/40">
                <f.icon className="w-10 h-10 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{te(f.titleKey)}</h3>
                <p className="text-sm text-gray-500">{te(f.descKey)}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-10">
            <ButtonLink href="/products/toolkit" size="lg" variant="outline">
              {te('discoverAllTools')} <ArrowRight className="w-4 h-4 ml-2" />
            </ButtonLink>
          </div>
        </div>
      </HomeReveal>

      {/* Testimonials */}
      <HomeReveal className="py-16 sm:py-20 bg-gradient-to-b from-emerald-50/50 to-emerald-50/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-primary-400 to-emerald-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('homeTestimonialsHeading')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {TESTIMONIALS.map((row) => (
              <div
                key={row.nameKey}
                className="relative rounded-2xl border border-emerald-100/80 bg-white/95 p-6 sm:p-7 shadow-md ring-1 ring-emerald-50/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="absolute left-5 top-5 text-4xl font-serif text-primary-200/90 leading-none" aria-hidden>
                  &ldquo;
                </span>
                <p className="relative text-slate-600 text-sm leading-relaxed mb-6 pl-1 pt-6">{t(row.quoteKey)}</p>
                <div className="border-t border-slate-100 pt-4">
                  <p className="font-semibold text-slate-900 text-sm">{t(row.nameKey)}</p>
                  <p className="text-xs text-primary-600 font-medium mt-0.5">{t(row.roleKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </HomeReveal>

      {/* CTA Section */}
      <HomeReveal className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary-700 mb-3">
              {t('homeCtaEyebrow')}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-ink mb-3">
              {t('homeCtaTitle')}
            </h2>
            <p className="text-base sm:text-lg text-ink-soft leading-relaxed">
              {t('homeCtaSub')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="rounded-[22px] border border-primary-100 bg-gradient-to-br from-white to-primary-50 p-7 sm:p-9 shadow-[0_1px_2px_rgba(8,35,26,0.04),0_12px_32px_-12px_rgba(6,95,70,0.18)]">
              <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary-700 mb-2">{t('ctaBrokerBadge')}</p>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink mb-2">{t('ctaBrokerTitle')}</h3>
              <p className="text-sm text-ink-soft mb-5 leading-relaxed">{t('ctaBrokerDesc')}</p>
              <ButtonLink href="/register/broker" size="lg" className="shadow-[0_10px_24px_-10px_rgba(4,120,87,0.6)]">
                {t('ctaBrokerButton')} <ArrowRight className="w-4 h-4 ml-2" />
              </ButtonLink>
            </div>
            <div className="rounded-[22px] border border-primary-100 bg-white p-7 sm:p-9 shadow-[0_1px_2px_rgba(8,35,26,0.04),0_12px_32px_-12px_rgba(6,95,70,0.18)]">
              <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary-700 mb-2">{t('ctaCarrierBadge')}</p>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink mb-2">{t('ctaCarrierTitle')}</h3>
              <p className="text-sm text-ink-soft mb-5 leading-relaxed">{t('ctaCarrierDesc')}</p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <ButtonLink
                  href="/register/company"
                  size="lg"
                  className="bg-ink text-white hover:bg-primary-900 hover:-translate-y-0.5 hover:shadow-md focus:ring-ink"
                >
                  {t('ctaCarrierButton')} <ArrowRight className="w-4 h-4 ml-2" />
                </ButtonLink>
                <ButtonLink href="/pricing" size="lg" variant="outline" className="border-primary-200 text-primary-800">
                  {t('ctaCarrierPricing')}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </HomeReveal>

      <Footer />
    </div>
  );
}

