'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

const ROTATE_MS = 5500;

export type EditorialSlide = {
  src: string;
  alt: string;
  caption?: string;
  objectPosition?: string;
};

type HomeEditorialBannerProps = {
  quote: string;
  slides: EditorialSlide[];
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

export function HomeEditorialBanner({ quote, slides }: HomeEditorialBannerProps) {
  const [active, setActive] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const count = slides.length;

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActive(((index % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (reducedMotion || count <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [count, reducedMotion]);

  if (count === 0) return null;

  return (
    <section
      className="relative min-h-[220px] overflow-hidden border-b border-slate-200/80 sm:min-h-[280px] md:min-h-[300px] lg:min-h-[360px]"
      aria-labelledby="home-editorial-quote"
      aria-roledescription="carousel"
      aria-label={quote}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
            index === active ? 'z-0 opacity-100' : 'z-0 pointer-events-none opacity-0'
          }`}
          aria-hidden={index !== active}
        >
          <div
            className={`absolute inset-0 ${index === active && !reducedMotion ? 'editorial-ken-burns' : ''}`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              style={slide.objectPosition ? { objectPosition: slide.objectPosition } : undefined}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
              priority={index === 0}
            />
          </div>
        </div>
      ))}

      <div
        className="absolute inset-0 z-[1] bg-gradient-to-b from-slate-950/92 via-slate-900/78 to-primary-900/55 sm:bg-gradient-to-r sm:from-slate-950/88 sm:via-slate-900/72 sm:to-primary-900/45 md:from-slate-950/82 md:via-slate-900/65 md:to-primary-900/40"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[220px] max-w-7xl flex-col justify-center gap-4 px-4 py-6 sm:min-h-[280px] sm:gap-6 sm:px-6 sm:py-8 md:min-h-[300px] md:py-10 lg:min-h-[360px] lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10 lg:px-8">
        <div className="flex flex-col justify-center">
          <p
            id="home-editorial-quote"
            className="max-w-xl border-l-4 border-amber-400/90 pl-3 text-sm font-medium leading-relaxed text-white drop-shadow-md sm:max-w-2xl sm:pl-5 sm:text-lg sm:leading-snug md:pl-6 md:text-xl lg:text-2xl"
          >
            {quote}
          </p>

          {count > 1 && (
            <div className="mt-4 sm:mt-5 md:mt-6">
              <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Visuels plateforme">
                {slides.map((slide, index) => (
                  <button
                    key={slide.src}
                    type="button"
                    role="tab"
                    aria-selected={index === active}
                    aria-label={slide.alt}
                    onClick={() => goTo(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === active ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
              {slides[active]?.caption && (
                <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-amber-200/90 sm:text-xs sm:tracking-[0.15em] md:text-sm">
                  {slides[active].caption}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Aperçus flottants — desktop */}
        {count > 1 && (
          <div className="hidden flex-col items-end gap-3 pr-2 lg:flex" aria-hidden>
            {slides.map((slide, index) => (
              <button
                key={`thumb-${slide.src}`}
                type="button"
                onClick={() => goTo(index)}
                className={`relative h-[4.5rem] w-[7.5rem] overflow-hidden rounded-xl border-2 shadow-xl transition-all duration-500 ${
                  index === active
                    ? 'editorial-thumb-float scale-105 border-amber-400/90 shadow-amber-900/30'
                    : 'translate-x-2 border-white/25 opacity-75 hover:translate-x-0 hover:opacity-95'
                }`}
                tabIndex={-1}
              >
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  className="object-cover"
                  style={slide.objectPosition ? { objectPosition: slide.objectPosition } : undefined}
                  sizes="120px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Aperçus horizontaux — tablette uniquement (mobile : points suffisent) */}
        {count > 1 && (
          <div className="hidden gap-2.5 overflow-x-auto pb-1 sm:flex lg:hidden" aria-hidden>
            {slides.map((slide, index) => (
              <button
                key={`mthumb-${slide.src}`}
                type="button"
                onClick={() => goTo(index)}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 shadow-md transition-all duration-500 md:h-16 md:w-24 ${
                  index === active
                    ? 'editorial-thumb-float border-amber-400 scale-[1.02]'
                    : 'border-white/30 opacity-80'
                }`}
                tabIndex={-1}
              >
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  className="object-cover"
                  style={slide.objectPosition ? { objectPosition: slide.objectPosition } : undefined}
                  sizes="96px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
