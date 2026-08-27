import {Link} from '@/i18n/navigation';
import {getCategories} from '@/lib/api';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {cn} from '@/lib/utils';
import {type Locale} from '@/types';
import Image from 'next/image';

export async function CategoriesSection() {
  const t = await (await import('next-intl/server')).getTranslations('home.categories');
  const categories = await getCategories();

  return (
    <section className="py-16 sm:py-20 bg-brand-light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('title')} subtitle={t('subtitle')} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function CategoryCard({category}: {category: {id: string; slug: string; name: Record<string, string>; description: Record<string, string>; image: string}}) {
  const t = await (await import('next-intl/server')).getTranslations('home.categories');
  const locale = (await (await import('next-intl/server')).getLocale()) as Locale;

  return (
    <Link
      href={`/collections/${category.slug}`}
      className={cn(
        'group block overflow-hidden rounded-md',
        'border border-brand-border bg-brand-surface',
        'transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1'
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={category.image}
          alt={category.name[locale] || category.name.fr}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-brand-dark/20 to-transparent" />
        <div className="absolute bottom-0 start-0 end-0 p-5 sm:p-6 lg:p-8">
          <h3 className="font-heading text-xl font-bold text-white sm:text-2xl lg:text-3xl">
            {t(`${category.slug}.name`)}
          </h3>
          <p className="mt-1.5 text-xs text-white/80 line-clamp-2 sm:text-sm lg:text-base">
            {t(`${category.slug}.description`)}
          </p>
        </div>
      </div>
    </Link>
  );
}
