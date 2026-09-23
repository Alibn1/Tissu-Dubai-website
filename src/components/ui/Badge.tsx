import {cn} from '@/lib/utils';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-brand-primary text-white',
  secondary: 'bg-brand-muted text-brand-light',
  accent: 'bg-brand-accent/20 text-brand-secondary',
  success: 'bg-brand-success/15 text-brand-success',
  warning: 'bg-brand-warning/15 text-brand-warning',
  error: 'bg-brand-error/15 text-brand-error'
};

export function Badge({children, variant = 'primary', className}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1 py-0.5 text-xs leading-none font-medium rounded',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
