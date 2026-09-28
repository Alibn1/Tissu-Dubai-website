import {getTranslations, getLocale} from 'next-intl/server';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {CollectionCarousel} from '@/components/collection/CollectionCarousel';
import {getCollections} from '@/lib/api';
import {type Locale} from '@/types';

export async function CollectionsSection() {
  const t = await getTranslations('home.collections');
  const locale = (await getLocale()) as Locale;
  const collections = await getCollections();

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      </div>

      <CollectionCarousel collections={collections} locale={locale} />
    </section>
  );
}
