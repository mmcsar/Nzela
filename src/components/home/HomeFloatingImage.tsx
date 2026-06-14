'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type Phase = 0 | 1 | 2 | 3;

type HomeFloatingImageProps = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Décalage pour que plusieurs images ne bougent pas à l'unisson */
  phase?: Phase;
  /** Plus lent — grands bandeaux */
  slow?: boolean;
};

function motionClasses(phase: Phase, slow: boolean, reduced: boolean): string {
  if (reduced) return '';
  const parts = ['home-photo-ken-burns'];
  if (slow) parts.push('home-photo-ken-burns-slow');
  if (phase > 0) parts.push(`home-photo-ken-burns-delay-${phase}`);
  return parts.join(' ');
}

export function HomeFloatingImage({
  src,
  alt,
  sizes,
  priority,
  className = 'object-cover',
  style,
  phase = 0,
  slow = false,
}: HomeFloatingImageProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 ${motionClasses(phase, slow, reduced)}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className={className}
          style={style}
          sizes={sizes}
          priority={priority}
        />
      </div>
    </div>
  );
}
