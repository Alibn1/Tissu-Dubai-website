import {setRequestLocale} from 'next-intl/server';
import {getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {staticAlternates} from '@/lib/seo/productUrls';
import type {Locale} from '@/types';

type Props = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'seo.about'});
  return {
    title: t('title'),
    description: t('description'),
    alternates: staticAlternates('/a-propos', locale as Locale)
  };
}

export default async function AboutPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('about');
  const tStory = await getTranslations('about.story');
  const tPhilosophy = await getTranslations('about.philosophy');
  const tQuality = await getTranslations('about.quality');
  const tCraftsmanship = await getTranslations('about.craftsmanship');

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="font-heading text-3xl font-bold text-brand-secondary sm:text-4xl md:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mt-3 text-lg text-brand-muted">{t('hero.subtitle')}</p>
          <div className="mt-4 h-0.5 w-16 bg-brand-primary mx-auto" />
        </div>

        <div className="mx-auto max-w-3xl space-y-16">
          {/* Story */}
          <div>
            <SectionHeading title={tStory('title')} align="left" />
            <p className="text-base leading-relaxed text-brand-muted">
              {tStory('content')}
            </p>
          </div>

          {/* Philosophy */}
          <div>
            <SectionHeading title={tPhilosophy('title')} align="left" />
            <p className="text-base leading-relaxed text-brand-muted">
              {tPhilosophy('content')}
            </p>
          </div>

          {/* Quality */}
          <div>
            <SectionHeading title={tQuality('title')} align="left" />
            <p className="text-base leading-relaxed text-brand-muted">
              {tQuality('content')}
            </p>
          </div>

          {/* Craftsmanship */}
          <div>
            <SectionHeading title={tCraftsmanship('title')} align="left" />
            <p className="text-base leading-relaxed text-brand-muted">
              {tCraftsmanship('content')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
