'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'loading'> {
  fallback?: React.ReactNode;
}

/**
 * Composant Image optimisé avec:
 * - Lazy loading par défaut
 * - Formats modernes (avif, webp)
 * - Fallback en cas d'erreur
 * - Responsive sizing automatique
 */
export const OptimizedImage = React.memo(function OptimizedImage({
  fallback,
  alt,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = React.useState(false);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <Image
      {...props}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      quality={80}
    />
  );
});
