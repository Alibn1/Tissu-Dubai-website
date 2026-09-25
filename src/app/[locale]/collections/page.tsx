import {setRequestLocale, getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import {Link} from '@/i18n/navigation';
import Image from 'next/image';
import {getSiteSettings} from '@/lib/data/store';
import {GENDER_CARDS, type GenderCardId} from '@/lib/siteSettings';
import {type Locale} from '@/types';

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

type CategoryCard = {
  slug: string;
  href: string;
  image: string;
  title: string;
  subtitle: string;
};

export default async function CollectionsPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('collections');
  const genderCards = getSiteSettings().homepage.genderCards;

  const cardFor = (id: GenderCardId): CategoryCard => {
    const card = genderCards.find((c) => c.id === id);
    const fallback = GENDER_CARDS.find((c) => c.id === id)?.fallbackImage ?? '';
    return {
      slug: id,
      href: `/collections/${id}`,
      image: card?.image || fallback,
      title: card?.title[locale as Locale] || t(id),
      subtitle: card?.description[locale as Locale] || t(`${id}Subtitle`),
    };
  };

  const cards: CategoryCard[] = [cardFor('homme'), cardFor('femme')];

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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
          {cards.map((card) => (
            <Link
              key={card.slug}
              href={card.href}
              className="group block overflow-hidden rounded-md border border-brand-border bg-brand-surface transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 start-0 end-0 p-5 sm:p-6 lg:p-8">
                  <h2 className="font-heading text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                    {card.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-xs text-white/80 sm:text-sm lg:text-base">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}