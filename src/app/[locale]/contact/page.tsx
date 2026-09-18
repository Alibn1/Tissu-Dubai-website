import {setRequestLocale} from 'next-intl/server';
import {getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import {ContactForm} from '@/components/forms/ContactForm';
import {MapPin, Phone, MessageCircle} from 'lucide-react';
import {getSiteSettings} from '@/lib/data/store';
import {resolveContact} from '@/lib/siteSettings';

type Props = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'seo.contact'});
  return {title: t('title'), description: t('description')};
}

export default async function ContactPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const tHero = await getTranslations('contact.hero');
  const tInfo = await getTranslations('contact.info');

  const {address, phones, whatsappNumber} = resolveContact(getSiteSettings());
  const phone = phones[0] || '';

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

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <ContactForm locale={locale as 'fr' | 'ar' | 'en'} />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <h2 className="font-heading text-lg font-semibold text-brand-secondary">
              {tInfo('title')}
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
                <div>
                  <p className="text-sm font-medium text-brand-secondary">{tInfo('address')}</p>
                  <p className="text-sm text-brand-muted">
                    {address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
                <div>
                  <p className="text-sm font-medium text-brand-secondary">{tInfo('phone')}</p>
                  {phones.length > 0 ? (
                    phones.map((number) => (
                      <a
                        key={number}
                        href={`tel:${number}`}
                        className="block text-sm text-brand-muted hover:text-brand-primary transition-colors"
                      >
                        {number}
                      </a>
                    ))
                  ) : (
                    <span className="text-sm text-brand-muted">{phone}</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
                <div>
                  <p className="text-sm font-medium text-brand-secondary">{tInfo('whatsapp')}</p>
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-muted hover:text-brand-primary transition-colors"
                  >
                    {whatsappNumber}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
