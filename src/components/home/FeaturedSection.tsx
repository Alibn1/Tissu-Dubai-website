import {getTranslations, getLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {getFeaturedProducts} from '@/lib/api';
import {ProductCard} from '@/components/product/ProductCard';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {ArrowRight} from 'lucide-react';
import {cn} from '@/lib/utils';

export async function FeaturedSection() {
  const t = await getTranslations('home.featured');
  const products = await getFeaturedProducts(4);

  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('title')} subtitle={t('subtitle')} />

        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 xl:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center md:mt-12">
          <Link
            href="/collections"
            className={cn(
              'inline-flex items-center gap-2',
              'text-sm font-semibold text-brand-primary hover:text-brand-secondary',
              'transition-colors duration-200'
            )}
          >
            {(await getTranslations('common'))('viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
