'use client';

import {useState} from 'react';
import {ProductGallery} from '@/components/product/ProductGallery';
import {ProductInfo} from '@/components/product/ProductInfo';
import {type Product, type Locale} from '@/types';

type ProductViewProps = {
  product: Product;
  locale: Locale;
};

export function ProductView({product, locale}: ProductViewProps) {
  const [selectedVariant, setSelectedVariant] = useState(0);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
      <ProductGallery
        product={product}
        locale={locale}
        selectedVariant={selectedVariant}
        onVariantChange={setSelectedVariant}
      />
      <ProductInfo
        product={product}
        locale={locale}
        selectedVariant={selectedVariant}
      />
    </div>
  );
}
