export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const baseStyles =
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98]';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-md focus:ring-primary-500',
  secondary:
    'bg-gray-600 text-white hover:bg-gray-700 hover:-translate-y-0.5 hover:shadow-md focus:ring-gray-500',
  outline:
    'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 hover:-translate-y-0.5 focus:ring-primary-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-md focus:ring-red-500',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
  disabled = false,
): string {
  return `${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${
    disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
  }`.trim();
}
