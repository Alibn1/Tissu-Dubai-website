import {getTranslations} from 'next-intl/server';
import {ProductCard} from '@/components/product/ProductCard';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {type Product, type Locale} from '@/types';

type RelatedProductsProps = {
  products: Product[];
  locale: Locale;
};

export async function RelatedProducts({products, locale}: RelatedProductsProps) {
  const t = await getTranslations('product');

  return (
    <div className="mt-12 border-t border-brand-border pt-8">
      <SectionHeading title={t('relatedProducts')} align="left" />
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
