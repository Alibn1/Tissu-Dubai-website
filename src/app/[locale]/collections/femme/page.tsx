import {setRequestLocale, getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import {CollectionCards} from '@/components/collection/CollectionCards';
import {WOMEN_COLLECTION_SLUGS} from '@/lib/siteSettings';
import {staticAlternates} from '@/lib/seo/productUrls';
import type {Locale} from '@/types';

type Props = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'collections'});
  return {
    title: t('femme'),
    description: t('subtitle'),
    alternates: staticAlternates('/collections/femme', locale as Locale)
  };
}

export default async function FemmeCollectionPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('collections');

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="font-heading text-3xl font-bold text-brand-secondary sm:text-4xl md:text-5xl">
            {t('femme')}
          </h1>
          <p className="mt-3 text-lg text-brand-muted">{t('subtitle')}</p>
          <div className="mt-4 h-0.5 w-16 bg-brand-primary mx-auto" />
        </div>

        <CollectionCards gridClassName="gap-6" slugs={[...WOMEN_COLLECTION_SLUGS]} />
      </div>
    </section>
  );
}