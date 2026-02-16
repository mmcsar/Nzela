'use client';

import { Link, useRouter } from '@/lib/i18n/routing';
import type { ComponentProps } from 'react';

type PrefetchLinkProps = ComponentProps<typeof Link>;

export function PrefetchLink(props: PrefetchLinkProps) {
  const router = useRouter();

  const handleMouseEnter = () => {
    const hrefValue = props.href;
    if (typeof hrefValue === 'string') {
      router.prefetch(hrefValue);
    }
  };

  return <Link {...props} onMouseEnter={handleMouseEnter} />;
}
