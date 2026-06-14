import type { LucideIcon } from 'lucide-react';
import { HomeFloatingImage } from '@/components/home/HomeFloatingImage';

export type ValueCardItem = {
  titleKey: string;
  title: string;
  desc: string;
  image: string;
  alt: string;
  Icon: LucideIcon;
};

type HomeValueCardsProps = {
  cards: ValueCardItem[];
};

const CARD_PHASES = [1, 2, 3] as const;

export function HomeValueCards({ cards }: HomeValueCardsProps) {
  return (
    <>
      {/* Mobile / tablette : swipe horizontal */}
      <div
        className="home-value-scroll -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scroll-smooth md:hidden"
        aria-label="Valeurs Nzela"
      >
        {cards.map((card, index) => (
          <article
            key={card.titleKey}
            className="home-value-card group w-[min(88vw,340px)] shrink-0 snap-center overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-b from-white/95 to-primary-50/50 shadow-md ring-1 ring-primary-50/60"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
              <HomeFloatingImage
                src={card.image}
                alt={card.alt}
                sizes="88vw"
                phase={CARD_PHASES[index % CARD_PHASES.length]}
              />
            </div>
            <div className="p-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-inner ring-1 ring-primary-100/80">
                <card.Icon className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-slate-900">{card.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{card.desc}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Desktop : grille 3 colonnes */}
      <div className="hidden gap-8 md:grid md:grid-cols-3 md:gap-10">
        {cards.map((card, index) => (
          <article
            key={card.titleKey}
            className="group overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-b from-white/95 to-primary-50/50 shadow-md ring-1 ring-primary-50/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
              <HomeFloatingImage
                src={card.image}
                alt={card.alt}
                sizes="33vw"
                phase={CARD_PHASES[index % CARD_PHASES.length]}
              />
            </div>
            <div className="p-7 text-center lg:p-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-inner ring-1 ring-primary-100/80">
                <card.Icon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{card.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
