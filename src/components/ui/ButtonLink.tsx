import { Link } from '@/lib/i18n/routing';
import { buttonClassName, type ButtonSize, type ButtonVariant } from '@/components/ui/buttonStyles';
import type { ComponentProps } from 'react';

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'>;

/** Lien stylé bouton — évite <a><button> (HTML invalide, casse l’hydratation React). */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...linkProps
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClassName(variant, size, className)} {...linkProps}>
      {children}
    </Link>
  );
}
