import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {NextIntlClientProvider} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {SiteChrome} from '@/components/layout/SiteChrome';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: 'Tissu Dubai',
      template: '%s | Tissu Dubai'
    },
    description: 'Premium fabrics in Casablanca, Morocco',
    openGraph: {
      type: 'website',
      locale: locale === 'ar' ? 'ar_MA' : locale === 'fr' ? 'fr_FR' : 'en_US',
      siteName: 'Tissu Dubai'
    },
    alternates: {
      languages: {
        fr: '/fr',
        ar: '/ar',
        en: '/en'
      }
    },
    icons: {
      icon: [
        {url: '/Logo tissudubai.png', type: 'image/png'}
      ],
      apple: [
        {url: '/Logo tissudubai.png', type: 'image/png'}
      ]
    }
  };
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const lang = locale;

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <html lang={lang} dir={dir} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteChrome>{children}</SiteChrome>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
