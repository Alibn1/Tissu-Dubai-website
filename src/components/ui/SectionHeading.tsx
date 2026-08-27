import {cn} from '@/lib/utils';

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
};

export function SectionHeading({title, subtitle, align = 'center', className}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-8 md:mb-12',
        align === 'center' && 'text-center',
        className
      )}
    >
      <h2 className="font-heading text-2xl font-bold text-brand-secondary sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base text-brand-muted sm:text-lg">
          {subtitle}
        </p>
      )}
      <div
        className={cn(
          'mt-4 h-0.5 w-16 bg-brand-primary',
          align === 'center' && 'mx-auto'
        )}
      />
    </div>
  );
}
