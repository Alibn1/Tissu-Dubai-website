import Image from 'next/image';
import {Link} from '@/i18n/navigation';
import {useTranslations, useLocale} from 'next-intl';
import {Badge} from '@/components/ui/Badge';
import {cn} from '@/lib/utils';
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

  return (
    <Link
      href={`/collections/${primaryCollection}/${product.slug}`}
      className={cn(
        'group block',
        className
      )}
    >
      <article className="relative overflow-hidden rounded-md border border-brand-border bg-brand-surface">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-brand-light">
          <Image
            src={product.images[0] || '/images/products/product-1.svg'}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
  );
}
