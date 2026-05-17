'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

const ROTATE_MS = 7500;

export type EditorialSlide = {
  src: string;
  alt: string;
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
      className="relative min-h-[min(42vh,280px)] sm:min-h-[300px] lg:min-h-[340px] overflow-hidden border-b border-slate-200/80"
      aria-labelledby="home-editorial-quote"
      aria-roledescription="carousel"
      aria-label={quote}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === active ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
          }`}
          aria-hidden={index !== active}
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
      ))}

      <div
        className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-950/90 via-slate-900/78 to-primary-900/55 sm:from-slate-950/88 sm:via-slate-900/75"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex max-w-7xl min-h-[min(42vh,280px)] sm:min-h-[300px] lg:min-h-[340px] flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <p
          id="home-editorial-quote"
          className="max-w-xl text-lg font-medium leading-snug text-white drop-shadow-md sm:max-w-2xl sm:text-xl md:text-2xl md:leading-snug border-l-4 border-amber-400/90 pl-5 sm:pl-6"
        >
          {quote}
        </p>

        {count > 1 && (
          <div
            className="mt-6 flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="Visuels plateforme"
          >
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={slide.alt}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === active
                    ? 'w-8 bg-amber-400'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
