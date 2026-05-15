'use client';

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';

type HomeRevealProps = {
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<'section'>, 'className' | 'children'>;

/**
 * Révélation au scroll (style landing institutionnelle), couleurs inchangées.
 * Respecte prefers-reduced-motion via globals.css.
 */
export function HomeReveal({ className = '', children, ...rest }: HomeRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reveal = () => setVisible(true);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          io.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -5% 0px' },
    );
    io.observe(node);

    // Si l’hydratation échoue ou l’IO ne déclenche pas, éviter des sections invisibles (opacity: 0).
    const fallback = window.setTimeout(reveal, 1200);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <section
      ref={ref}
      className={`home-reveal${visible ? ' home-reveal-visible' : ''}${className ? ` ${className}` : ''}`.trim()}
      {...rest}
    >
      {children}
    </section>
  );
}
