import {getTranslations} from 'next-intl/server';
import {ProductCard} from '@/components/product/ProductCard';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {type Product} from '@/types';

type RelatedProductsProps = {
  products: Product[];
};

export async function RelatedProducts({products}: RelatedProductsProps) {
  const t = await getTranslations('product');

  return (
    <div className="mt-12 border-t border-brand-border pt-8">
      <SectionHeading title={t('relatedProducts')} align="left" />
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            className="w-[46vw] shrink-0 snap-start sm:w-auto sm:shrink"
          />
        ))}
      </div>
    </div>
  );
}
