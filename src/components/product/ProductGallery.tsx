'use client';

import {useState} from 'react';
import Image from 'next/image';
import {cn} from '@/lib/utils';
import {type Product, type Locale} from '@/types';
import {Expand} from 'lucide-react';

type ProductGalleryProps = {
  product: Product;
  locale: Locale;
};

export function ProductGallery({product, locale}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);

  const variant = product.variants[selectedVariant];
  const images = variant?.images?.length ? variant.images : product.images;

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-brand-border bg-brand-light">
        <Image
          src={images[selectedImage] || '/images/products/product-1.svg'}
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

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all',
                selectedImage === idx
                  ? 'border-brand-primary'
                  : 'border-brand-border hover:border-brand-muted'
              )}
            >
              <Image
                src={img}
                alt={`${product.name[locale] || product.name.fr} - ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
