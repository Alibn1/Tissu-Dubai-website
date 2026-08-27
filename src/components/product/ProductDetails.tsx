'use client';

import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {type Product, type Locale} from '@/types';

type ProductDetailsProps = {
  product: Product;
  locale: Locale;
};

export function ProductDetails({product, locale}: ProductDetailsProps) {
  const t = useTranslations();

  const description = product.description[locale] || product.description.fr;
  const characteristics = product.characteristics[locale] || product.characteristics.fr;

  return (
    <div className="mt-12 space-y-8 border-t border-brand-border pt-8">
      {/* Description */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-3">
          {t('product.description')}
        </h2>
        <p className="text-sm leading-relaxed text-brand-muted max-w-3xl">
          {description}
        </p>
      </div>

      {/* Characteristics */}
      {characteristics.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-3">
            {t('product.characteristics')}
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-3xl">
            {characteristics.map((char, idx) => (
              <li
                key={idx}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  'py-2 border-b border-brand-border/50'
                )}
              >
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                <span className="text-brand-muted">{char}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
