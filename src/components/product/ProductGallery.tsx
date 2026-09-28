'use client';

import {useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {type Product, type Locale, type ProductVariant} from '@/types';
import {Expand, X, ZoomIn} from 'lucide-react';
import {resolveSeoValue} from '@/lib/productSeo';

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
  const [zoomOpen, setZoomOpen] = useState(false);
  const variants = product.variants;
  const selected = variants[selectedVariant];
  const mainImage = selected?.images?.[0] || product.images?.[0] || '/images/products/product-1.svg';

  // The admin can override the accessible description of the product photo;
  // without one we keep the localized product name.
  const productAlt = resolveSeoValue(
    product.seo,
    locale,
    'altImage',
    product.name[locale] || product.name.fr
  );

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-brand-border bg-brand-light">
        <Image
          src={mainImage}
          alt={productAlt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="absolute top-3 end-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-surface/80 text-brand-secondary hover:bg-brand-surface transition-colors"
          aria-label={t('common.zoomImage')}
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
            const colorName = v.color[locale] || v.color.fr;
            return (
              <button
                key={v.id}
                onClick={() => onVariantChange(idx)}
                title={colorName}
                className={cn(
                  'relative h-20 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all',
                  selectedVariant === idx
                    ? 'border-brand-primary'
                    : 'border-brand-border hover:border-brand-muted'
                )}
              >
                <Image
                  src={img}
                  alt={`${product.name[locale] || product.name.fr} - ${colorName}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                {img === selectedImg && (
                  <span className="sr-only">{colorName}</span>
                )}
              </button>
            );
          })}
          </div>
        </div>
      )}

      {/* Tap to zoom: full-bleed view of the fabric, pinch/scroll to inspect */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-[90] flex flex-col bg-[#120C07]/97 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t('common.zoomImage')}
          onClick={() => setZoomOpen(false)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-brand-secondary">
            <span className="flex items-center gap-2 text-sm font-medium">
              <ZoomIn className="h-4 w-4" />
              {productAlt}
            </span>
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              aria-label={t('common.close')}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-secondary transition-colors hover:bg-brand-light"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-auto p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative mx-auto aspect-[3/4] w-full max-w-2xl overflow-hidden rounded-md border border-brand-border">
              <Image
                src={mainImage}
                alt={productAlt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
