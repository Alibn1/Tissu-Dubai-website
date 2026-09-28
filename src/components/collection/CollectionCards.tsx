import {getCollections} from '@/lib/api';
import {cn} from '@/lib/utils';
import {CollectionCardLink} from '@/components/collection/CollectionCard';
import {type Locale} from '@/types';

export async function CollectionCards({
  gridClassName,
  slugs
}: {
  gridClassName?: string;
  slugs?: string[];
}) {
  const collections = await getCollections();
  const locale = (await (await import('next-intl/server')).getLocale()) as Locale;
  const visible = slugs ? collections.filter((collection) => slugs.includes(collection.slug)) : collections;

  return (
    <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3', gridClassName)}>
      {visible.map((collection) => (
        <CollectionCardLink key={collection.id} collection={collection} locale={locale} />
      ))}
    </div>
  );
}
