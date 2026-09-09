'use client';

import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {type Product, type Locale, type ProductVariant} from '@/types';
import {Expand} from 'lucide-react';

type ProductGalleryProps = {
  product: Product;
  locale: Locale;
  selectedVariant: number;
  onVariantChange: (index: number) => void;
};

export function ProductGallery({
  product,
  locale,
  selectedVariant,
  onVariantChange
}: ProductGalleryProps) {
  const t = useTranslations();
  const variants = product.variants;
  const selected = variants[selectedVariant];
  const mainImage = selected?.images?.[0] || product.images?.[0] || '/images/products/product-1.svg';

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-brand-border bg-brand-light">
        <Image
          src={mainImage}
          alt={product.name[locale] || product.name.fr}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <button
          className="absolute top-3 end-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-surface/80 text-brand-secondary hover:bg-brand-surface transition-colors"
          aria-label="Expand image"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>

      {/* Color picture menu */}
      {variants.length > 1 && (
        <div>
          <p className="text-base font-bold text-brand-secondary">
            {t('product.availableColors')} :
          </p>
          <div
            id="product-color-gallery"
            className="mt-4 flex gap-2 overflow-x-auto pb-1 scroll-mt-[120px]"
          >
          {variants.map((v: ProductVariant, idx: number) => {
            const img = v.images?.[0] || mainImage;
            const selectedImg = selected?.images?.[0];
            return (
              <button
                key={v.id}
                onClick={() => onVariantChange(idx)}
                title={v.color}
                className={cn(
                  'relative h-20 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all',
                  selectedVariant === idx
                    ? 'border-brand-primary'
                    : 'border-brand-border hover:border-brand-muted'
                )}
              >
                <Image
                  src={img}
                  alt={`${product.name[locale] || product.name.fr} - ${v.color}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                {img === selectedImg && (
                  <span className="sr-only">{v.color}</span>
                )}
              </button>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
