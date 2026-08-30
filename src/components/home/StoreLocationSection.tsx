import {getTranslations} from 'next-intl/server';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {cn} from '@/lib/utils';
import {MapPin, Phone, Clock, ExternalLink} from 'lucide-react';

export async function StoreLocationSection() {
  const t = await getTranslations('home.storeLocation');
  const tLocation = await getTranslations('location');
  const tHours = await getTranslations('location.hours');

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('title')} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Map placeholder */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-brand-border bg-brand-light lg:aspect-auto lg:min-h-[400px] transition-all duration-300 hover:shadow-lg hover:border-brand-primary/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-brand-muted/50" />
                <p className="mt-2 text-sm text-brand-muted">
                  {tLocation('address.title')}
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
              <div>
                <h3 className="font-heading text-base font-semibold text-brand-secondary">
                  {tLocation('address.title')}
                </h3>
                <p className="mt-1 text-sm text-brand-muted">
                  {process.env.NEXT_PUBLIC_STORE_ADDRESS || 'PLACEHOLDER_ADDRESS'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
              <div>
                <h3 className="font-heading text-base font-semibold text-brand-secondary">
                  {tHours('title')}
                </h3>
                <div className="mt-1 space-y-1 text-sm text-brand-muted">
                  <p>
                    <span className="font-medium">{tHours('weekdays')}</span>
                    {' — '}
                    {tHours('weekdaysHours')}
                  </p>
                  <p>
                    <span className="font-medium">{tHours('sunday')}</span>
                    {' — '}
                    {tHours('sundayHours')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
              <div>
                <h3 className="font-heading text-base font-semibold text-brand-secondary">
                  {t('title')}
                </h3>
                <a
                  href={`tel:${process.env.NEXT_PUBLIC_STORE_PHONE}`}
                  className="mt-1 inline-flex items-center gap-1 text-sm text-brand-primary hover:text-brand-secondary transition-colors"
                >
                  {process.env.NEXT_PUBLIC_STORE_PHONE || 'PLACEHOLDER_PHONE'}
                </a>
              </div>
            </div>

            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL && (
              <a
                href={process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2',
                  'text-sm font-semibold text-brand-primary hover:text-brand-secondary',
                  'transition-colors duration-200'
                )}
              >
                <ExternalLink className="h-4 w-4" />
                {tLocation('contact.directions')}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
