import {setRequestLocale, getTranslations, getLocale} from 'next-intl/server';
import {Metadata} from 'next';
import {Link} from '@/i18n/navigation';
import {getCategories} from '@/lib/api';
import {cn} from '@/lib/utils';
import {type Locale} from '@/types';
import Image from 'next/image';

type Props = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'common'});
  return {
    title: t('collections'),
    description: t('collections')
  };
}

export default async function CollectionsPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const categories = await getCategories();
  const loc = locale as Locale;
  const t = await getTranslations('collections');
  const tCat = await getTranslations('home.categories');

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="font-heading text-3xl font-bold text-brand-secondary sm:text-4xl md:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-lg text-brand-muted">{t('subtitle')}</p>
          <div className="mt-4 h-0.5 w-16 bg-brand-primary mx-auto" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const name = category.name[loc] || category.name.fr;
            return (
              <Link
                key={category.id}
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
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 start-0 end-0 p-5 sm:p-6">
                    <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">
                      {tCat(`${category.slug}.name`)}
                    </h2>
                    <p className="mt-2 text-sm text-white/80 line-clamp-2">
                      {tCat(`${category.slug}.description`)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
