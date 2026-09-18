import {setRequestLocale} from 'next-intl/server';
import {getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getProducts, getCollectionBySlug, getCollections} from '@/lib/api';
import {getModels} from '@/lib/data/store';
import {CatalogContent} from '@/components/catalog/CatalogContent';
import {Breadcrumbs} from '@/components/ui/Breadcrumbs';

type Props = {
  params: Promise<{locale: string; collection: string}>;
};

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({collection: c.slug}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, collection} = await params;
  const cat = await getCollectionBySlug(collection);
  if (!cat) return {};
  const name = cat.name[locale as keyof typeof cat.name] || cat.name.fr;
  return {
    title: `${name}`,
    description: cat.description[locale as keyof typeof cat.description] || cat.description.fr
  };
}

export default async function CollectionPage({params}: Props) {
  const {locale, collection} = await params;
  setRequestLocale(locale);

  const cat = await getCollectionBySlug(collection);
  if (!cat) notFound();

  const [products, collections] = await Promise.all([
    getProducts({collection}),
    getCollections()
  ]);
  const models = getModels();

  const t = await getTranslations('catalog');
  const tCat = await getTranslations('nav.fabrics');
  const tCommon = await getTranslations('common');

  const catName = cat.name[locale as keyof typeof cat.name] || cat.name.fr;

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            {label: tCommon('home'), href: '/'},
            {label: tCommon('collections'), href: '/collections'},
            {label: catName}
          ]}
        />

        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-brand-secondary sm:text-3xl md:text-4xl">
            {catName}
          </h1>
          <p className="mt-2 text-base text-brand-muted sm:text-lg">
            {cat.description[locale as keyof typeof cat.description] || cat.description.fr}
          </p>
        </div>

        <CatalogContent
          initialProducts={products}
          collections={collections}
          models={models}
          locale={locale}
          activeCollection={collection}
        />
      </div>
    </section>
  );
}
