import {setRequestLocale} from 'next-intl/server';
import {getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import {MapPin, Phone, Clock, ExternalLink, MessageCircle} from 'lucide-react';
import {cn} from '@/lib/utils';

type Props = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'seo.location'});
  return {title: t('title'), description: t('description')};
}

export default async function LocationPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('location');
  const tHero = await getTranslations('location.hero');
  const tAddress = await getTranslations('location.address');
  const tHours = await getTranslations('location.hours');
  const tContact = await getTranslations('location.contact');

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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Map */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-brand-border bg-brand-light lg:aspect-auto lg:min-h-[450px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-16 w-16 text-brand-muted/40" />
                <p className="mt-3 text-sm text-brand-muted">{tAddress('placeholder')}</p>
                <p className="mt-1 text-xs text-brand-muted/60">
                  Google Maps integration coming soon
                </p>
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="flex flex-col justify-center gap-6">
            {/* Address */}
            <div className="rounded-md border border-brand-border bg-brand-surface p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold text-brand-secondary">
                  {tAddress('title')}
                </h3>
              </div>
              <p className="text-sm text-brand-muted">
                {process.env.NEXT_PUBLIC_STORE_ADDRESS || 'PLACEHOLDER_ADDRESS'}
              </p>
            </div>

            {/* Hours */}
            <div className="rounded-md border border-brand-border bg-brand-surface p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                  <Clock className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold text-brand-secondary">
                  {tHours('title')}
                </h3>
              </div>
              <div className="space-y-2 text-sm text-brand-muted">
                <div className="flex justify-between">
                  <span>{tHours('weekdays')}</span>
                  <span className="font-medium text-brand-secondary">{tHours('weekdaysHours')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{tHours('sunday')}</span>
                  <span className="font-medium text-brand-secondary">{tHours('sundayHours')}</span>
                </div>
              </div>
            </div>

            {/* Contact buttons */}
            <div className="rounded-md border border-brand-border bg-brand-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                  <Phone className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold text-brand-secondary">
                  {tContact('title')}
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href={`tel:${process.env.NEXT_PUBLIC_STORE_PHONE}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md border border-brand-border px-4 py-3',
                    'text-sm font-medium text-brand-secondary hover:bg-brand-light transition-colors'
                  )}
                >
                  <Phone className="h-4 w-4 text-brand-primary" />
                  {tContact('phone')}
                </a>
                <a
                  href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-4 py-3',
                    'text-sm font-medium text-white bg-[#25D366] hover:bg-[#20BD5A] transition-colors'
                  )}
                >
                  <MessageCircle className="h-4 w-4" />
                  {tContact('whatsapp')}
                </a>
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL && (
                  <a
                    href={process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-2 rounded-md border border-brand-border px-4 py-3',
                      'text-sm font-medium text-brand-secondary hover:bg-brand-light transition-colors'
                    )}
                  >
                    <ExternalLink className="h-4 w-4 text-brand-primary" />
                    {tContact('directions')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
