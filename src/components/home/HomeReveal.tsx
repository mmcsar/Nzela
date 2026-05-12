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
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -5% 0px' }
    );
    io.observe(node);
    return () => io.disconnect();
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
