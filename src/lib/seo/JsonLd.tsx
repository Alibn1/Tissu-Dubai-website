import {type Locale} from '@/types';
import {STORE_LOCATION} from '@/lib/site';
import {getSiteSettings} from '@/lib/data/store';
import {resolveContact, WEEKDAY_SCHEMA_NAME} from '@/lib/siteSettings';

type JsonLdProps = {
  locale: Locale;
  type: 'LocalBusiness' | 'Product' | 'BreadcrumbList' | 'WebSite';
  data?: Record<string, unknown>;
};

export function JsonLd({locale, type, data = {}}: JsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const settings = getSiteSettings();
  const contact = resolveContact(settings);

  const openingHours = settings.businessHours
    .filter((hour) => !hour.isClosed && hour.openTime && hour.closeTime)
    .map((hour) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: WEEKDAY_SCHEMA_NAME[hour.day],
      opens: hour.openTime,
      closes: hour.closeTime
    }));

  const schemas: Record<string, unknown> = {
    LocalBusiness: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Tissu Dubai',
      description: {
        fr: 'Spécialiste en tissus premium à Casablanca, Maroc',
        ar: 'متخصص في الأقمشة الفاخرة بالدار البيضاء، المغرب',
        en: 'Premium fabric specialist in Casablanca, Morocco'
      }[locale],
      url: baseUrl,
      telephone: contact.primaryPhone || null,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Casablanca',
        addressCountry: 'MA',
        streetAddress: contact.address
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: STORE_LOCATION.latitude,
        longitude: STORE_LOCATION.longitude
      },
      openingHoursSpecification: openingHours,
      priceRange: '$$',
      ...data
    },

    Product: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      ...data
    },

    BreadcrumbList: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      ...data
    },

    WebSite: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Tissu Dubai',
      url: baseUrl,
      inLanguage: locale,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/${locale}/collections?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      },
      ...data
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: JSON.stringify(schemas[type])}}
    />
  );
}
