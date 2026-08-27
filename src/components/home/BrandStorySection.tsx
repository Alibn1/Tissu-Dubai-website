import {getTranslations} from 'next-intl/server';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {cn} from '@/lib/utils';

export async function BrandStorySection() {
  const t = await getTranslations('home.brandStory');

  const values = [
    {titleKey: 'values.0.title', descKey: 'values.0.description'},
    {titleKey: 'values.1.title', descKey: 'values.1.description'},
    {titleKey: 'values.2.title', descKey: 'values.2.description'}
  ];

  return (
    <section className="py-16 sm:py-20 bg-brand-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('title')} />

        <div className="mx-auto max-w-3xl">
          <p className="text-center text-base leading-relaxed text-brand-muted sm:text-lg">
            {t('description')}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {values.map((value, index) => (
            <div
              key={index}
              className={cn(
                'rounded-md border border-brand-border p-6',
                'bg-brand-light/50 text-center',
                'transition-all duration-300',
                'hover:shadow-lg hover:-translate-y-1 hover:border-brand-primary/30'
              )}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
                <span className="text-lg font-bold text-brand-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="font-heading text-base font-semibold text-brand-secondary">
                {t(value.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                {t(value.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
