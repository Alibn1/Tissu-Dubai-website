'use client';

import Image from 'next/image';
import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {clearRecentlyViewed, useRecentlyViewed} from '@/lib/recentlyViewed';
import {type Locale} from '@/types';

/**
 * Client-only row of the last viewed fabrics. It renders nothing on the server
 * and nothing when the visitor has not opened a product yet.
 */
export function RecentlyViewedSection({excludeId}: {excludeId?: string}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const stored = useRecentlyViewed();
  const items = stored.filter((item) => item.id !== excludeId);

  if (items.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-heading text-xl font-bold text-brand-secondary sm:text-2xl">
            {t('common.recentlyViewed')}
          </h2>
          <button
            type="button"
            onClick={() => clearRecentlyViewed()}
            className="shrink-0 text-xs font-medium text-brand-muted transition-colors hover:text-brand-secondary"
          >
            {t('common.clear')}
          </button>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {items.map((item) => {
            const name = item.name[locale] || item.name.fr;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group w-[46vw] shrink-0 snap-start sm:w-[30vw] lg:w-[18vw]"
              >
                <article className="overflow-hidden rounded-md border border-brand-border bg-brand-surface">
                  <div className="relative aspect-[3/4] overflow-hidden bg-brand-light">
                    <Image
                      src={item.image}
                      alt={name}
                      fill
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 18vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-heading text-sm font-semibold text-brand-secondary line-clamp-1 transition-colors group-hover:text-brand-primary">
                      {name}
                    </h3>
                    <p className="mt-1 text-xs text-brand-muted line-clamp-1">
                      {item.material[locale] || item.material.fr}
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
