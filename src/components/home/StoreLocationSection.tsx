import {getTranslations, getLocale} from 'next-intl/server';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {cn} from '@/lib/utils';
import {MapPin, Phone, Clock, ExternalLink} from 'lucide-react';
import {GOOGLE_MAPS_EMBED_URL, GOOGLE_MAPS_LINK} from '@/lib/site';
import {getSiteSettings} from '@/lib/data/store';
import {formatBusinessHours, resolveContact} from '@/lib/siteSettings';
import type {Locale} from '@/types';

export async function StoreLocationSection() {
  const t = await getTranslations('home.storeLocation');
  const tLocation = await getTranslations('location');
  const tHours = await getTranslations('location.hours');

  const settings = getSiteSettings();
  const {address, phones} = resolveContact(settings);
  const hours = formatBusinessHours(settings.businessHours, (await getLocale()) as Locale);
  const phone = phones[0] || '';

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('title')} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Map */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-brand-border bg-brand-light lg:aspect-auto lg:min-h-[400px] transition-all duration-300 hover:shadow-lg hover:border-brand-primary/30">
            <iframe
              src={GOOGLE_MAPS_EMBED_URL}
              title={tLocation('address.title')}
              className="absolute inset-0 h-full w-full"
              style={{border: 0}}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            {/* Address */}
            <div className="rounded-md border border-brand-border bg-brand-surface p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold text-brand-secondary">
                  {tLocation('address.title')}
                </h3>
              </div>
              <p className="text-sm text-brand-muted">
                {address}
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
                {hours.map((entry) => (
                  <div key={entry.day} className="flex justify-between gap-4">
                    <span className="capitalize">{entry.label}</span>
                    <span className="font-medium text-brand-secondary">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-md border border-brand-border bg-brand-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                  <Phone className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold text-brand-secondary">
                  {t('title')}
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href={`tel:${phone}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md border border-brand-border px-4 py-3',
                    'text-sm font-medium text-brand-secondary hover:bg-brand-light transition-colors'
                  )}
                >
                  <Phone className="h-4 w-4 text-brand-primary" />
                  {phone}
                </a>
                <a
                  href={GOOGLE_MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-2 rounded-md border border-brand-border px-4 py-3',
                    'text-sm font-medium text-brand-secondary hover:bg-brand-light transition-colors'
                  )}
                >
                  <ExternalLink className="h-4 w-4 text-brand-primary" />
                  {tLocation('contact.directions')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
