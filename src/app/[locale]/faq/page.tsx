import {setRequestLocale} from 'next-intl/server';
import {getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import {FaqAccordion} from '@/components/FaqAccordion';

type Props = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'seo.faq'});
  return {title: t('title'), description: t('description')};
}

export default async function FaqPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('faq');
  const tHero = await getTranslations('faq.hero');

  const questionKeys = [0, 1, 2, 3, 4, 5, 6];

  const questions = questionKeys.map((i) => ({
    question: t(`questions.${i}.question`),
    answer: t(`questions.${i}.answer`)
  }));

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="font-heading text-3xl font-bold text-brand-secondary sm:text-4xl md:text-5xl">
            {tHero('title')}
          </h1>
          <p className="mt-3 text-lg text-brand-muted">{tHero('subtitle')}</p>
          <div className="mt-4 h-0.5 w-16 bg-brand-primary mx-auto" />
        </div>

        <div className="mx-auto max-w-3xl">
          <FaqAccordion questions={questions} />
        </div>
      </div>
    </section>
  );
}
