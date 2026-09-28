'use client';

import Image from 'next/image';
import {Link} from '@/i18n/navigation';
import {useTranslations, useLocale} from 'next-intl';
import {Badge} from '@/components/ui/Badge';
import {CompareToggle} from '@/components/product/CompareToggle';
import {cn} from '@/lib/utils';
import {type CompareItem} from '@/lib/compareContext';
import {type Product, type Locale} from '@/types';

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({product, className}: ProductCardProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const name = product.name[locale] || product.name.fr;
  const material = product.material[locale] || product.material.fr;
  const primaryCollection = product.collections[0]?.slug ?? 'all';
  const href = `/collections/${primaryCollection}/${product.slug}`;

  const compareItem: CompareItem = {
    id: product.id,
    slug: product.slug,
    href,
    image: product.images[0] || '/images/products/product-1.svg',
    price: product.price,
    inStock: product.inStock,
    width: product.width,
    name: product.name,
    material: product.material,
    collections: product.collections.map((collection) => collection.name)
  };

  return (
    <div className={cn('group relative', className)}>
      <Link href={href} className="block">
        <article className="relative overflow-hidden rounded-md border border-brand-border bg-brand-surface">
          {/* Image */}
          <div className="relative aspect-[3/4] overflow-hidden bg-brand-light">
            <Image
              src={product.images[0] || '/images/products/product-1.svg'}
              alt={name}
              fill
              sizes="(max-width: 640px) 72vw, (max-width: 1024px) 45vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badges */}
            <div className="absolute top-2.5 start-2.5 flex flex-col items-start gap-1.5">
              {product.isNew && (
                <Badge variant="primary">{t('product.new')}</Badge>
              )}
              {product.featured && (
                <Badge variant="accent">{t('product.featured')}</Badge>
              )}
            </div>

            {/* Availability */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-[#1A110A]/50 flex items-center justify-center">
                <Badge variant="error">{t('product.outOfStock')}</Badge>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3.5 sm:p-4">
            <h3 className="font-heading text-base font-semibold text-brand-secondary line-clamp-1 group-hover:text-brand-primary transition-colors sm:text-lg">
              {name}
            </h3>
            <p className="mt-1 text-xs text-brand-muted line-clamp-1 sm:text-sm">
              {material}
            </p>

            {/* Price */}
            <div className="mt-2">
              {product.price !== null ? (
                <span className="text-base font-semibold text-brand-primary sm:text-lg">
                  {product.price} {t('common.currency')}
                </span>
              ) : (
                <span className="text-sm font-medium text-brand-muted italic">
                  {t('common.surDevis')}
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>

      <CompareToggle item={compareItem} />
    </div>
  );
}
