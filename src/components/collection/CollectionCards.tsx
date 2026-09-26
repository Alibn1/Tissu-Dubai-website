import {Link} from '@/i18n/navigation';
import {getCollections} from '@/lib/api';
import {cn} from '@/lib/utils';
import {type Collection, type Locale} from '@/types';
import Image from 'next/image';

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

async function CollectionCardLink({collection, locale}: {collection: Collection; locale: Locale}) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className={cn(
        'group block overflow-hidden rounded-md',
        'border border-brand-border bg-brand-surface',
        'transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1'
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={collection.image}
          alt={collection.name[locale] || collection.name.fr}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 start-0 end-0 p-5 sm:p-6 lg:p-8">
          <h3 className="font-heading text-xl font-bold text-white sm:text-2xl lg:text-3xl">
            {collection.name[locale] || collection.name.fr}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs text-white/80 sm:text-sm lg:text-base">
            {collection.description[locale] || collection.description.fr}
          </p>
        </div>
      </div>
    </Link>
  );
}