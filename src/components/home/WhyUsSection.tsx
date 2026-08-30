import {getTranslations} from 'next-intl/server';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {cn} from '@/lib/utils';
import {Check, Truck, Tag, Users, Zap, MapPin} from 'lucide-react';

const icons = [Check, Tag, Users, Truck, Zap, MapPin];

export async function WhyUsSection() {
  const t = await getTranslations('home.whyUs');

  const reasons = [0, 1, 2, 3, 4, 5].map((i) => ({
    titleKey: `reasons.${i}.title`,
    descKey: `reasons.${i}.description`,
    Icon: icons[i]
  }));

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            {t('title')}
          </h2>
          <div className="mt-4 h-0.5 w-16 bg-brand-primary mx-auto" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className={cn(
                'rounded-md border border-white/10 p-6',
                'bg-white/5 backdrop-blur-sm',
                'transition-all duration-300',
                'hover:bg-white/10 hover:shadow-lg hover:-translate-y-1 hover:border-white/20'
              )}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/20">
                <reason.Icon className="h-5 w-5 text-brand-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-white">
                {t(reason.titleKey)}
              </h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                {t(reason.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
