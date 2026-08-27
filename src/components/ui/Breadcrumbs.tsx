import {Link} from '@/i18n/navigation';
import {ChevronRight} from 'lucide-react';
import {cn} from '@/lib/utils';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({items, className}: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('py-3', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-brand-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 flex-shrink-0 text-brand-border" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-brand-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast ? 'text-brand-secondary font-medium' : 'text-brand-muted'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
