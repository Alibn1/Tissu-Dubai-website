import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {getNewArrivals} from '@/lib/api';
import {ProductCard} from '@/components/product/ProductCard';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {ArrowRight} from 'lucide-react';
import {cn} from '@/lib/utils';

export async function NewArrivalsSection() {
  const t = await getTranslations('home.newArrivals');
  const products = await getNewArrivals(4);

  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('title')} subtitle={t('subtitle')} />

                <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              className="w-[46vw] shrink-0 snap-start sm:w-auto sm:shrink"
            />
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
