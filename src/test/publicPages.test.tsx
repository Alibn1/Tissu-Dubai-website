import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {createElement, type ReactElement, type ReactNode} from 'react';
import {prerender} from 'react-dom/static';

/**
 * Renders the public pages and checks that what is stored in D1 is what a
 * visitor actually sees.
 *
 * The store tests only proved getSiteSettings() returned the right object. That
 * was not enough to catch the settings split going out while production was
 * still serving a placeholder address: the object was right and the page was
 * wrong. These tests read through the page, which is the path that failed.
 *
 * next-intl is stubbed because its request context only exists inside a Next
 * request. The assertions are all about stored catalogue and settings data, so
 * translated labels are not what is being checked here.
 */

vi.mock('next-intl/server', () => ({
  setRequestLocale: () => {},
  getTranslations: async (...args: unknown[]) => {
    const namespace =
      typeof args[0] === 'string' ? args[0] : String((args[0] as {namespace?: string})?.namespace ?? '');
    return (key: string) => (namespace ? `${namespace}.${key}` : key);
  },
  getLocale: async () => 'fr'
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
  NextIntlClientProvider: ({children}: {children: ReactElement}) => children
}));

/**
 * The locale-aware Link wraps next-intl's router, which needs the intl provider
 * to be mounted. What matters here is the data reaching the markup, not how a
 * link is built, so it becomes a plain anchor.
 */
vi.mock('@/i18n/navigation', () => ({
  Link: ({href, children, ...rest}: {href: unknown; children?: ReactNode}) =>
    createElement('a', {href: typeof href === 'string' ? href : String(href), ...rest}, children),
  usePathname: () => '/fr',
  useRouter: () => ({push: () => {}, replace: () => {}, back: () => {}, prefetch: () => {}}),
  redirect: (href: string) => {
    throw new Error(`redirect: ${href}`);
  },
  getPathname: (options?: {href?: unknown}) =>
    typeof options?.href === 'string' ? options.href : '/fr'
}));

let dir: string;

/** Distinctive values, so an assertion can only pass if the stored row was read. */
const ADDRESS = 'ADRESSE-UNIQUE-125 Casablanca 20600 Maroc';
const FAQ_QUESTION = 'QUESTION-FAQ-UNIQUE sur les tissus';
const HERO_TITLE = 'TITRE-HERO-UNIQUE elegance';
const PRODUCT_NAME = 'PRODUIT-UNIQUE-Caftan-Mouzouna';
const PRODUCT_SLUG = 'produit-unique-caftan-mouzouna';

/** The built-in fallback, from DEFAULT_SETTINGS in src/lib/siteSettings.ts. */
const DEFAULT_ADDRESS = '12 Rue des';

async function renderToHtml(element: ReactElement): Promise<string> {
  const {prelude} = await prerender(element);
  return new Response(prelude).text();
}

const params = (values: Record<string, string>) => Promise.resolve(values);

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tissu-pages-'));
  process.env.TISSU_DB_PATH = join(dir, 'pages.db');

  const store = await import('@/lib/data/store');

  // Written through the real store, so the rows are laid out exactly as they
  // are in production. This is the step that was never covered before.
  const settings = await store.getSiteSettings();
  await store.saveSiteSettings({
    ...settings,
    contact: {
      ...settings.contact,
      address: ADDRESS,
      phones: ['+212600000000'],
      whatsappNumber: '+212600000000'
    },
    faq: [
      {
        id: 'faq-test-1',
        question: {fr: FAQ_QUESTION, ar: FAQ_QUESTION, en: FAQ_QUESTION},
        answer: {fr: 'REPONSE-UNIQUE', ar: 'REPONSE-UNIQUE', en: 'REPONSE-UNIQUE'}
      }
    ],
    homepage: {
      ...settings.homepage,
      hero: {
        ...settings.homepage?.hero,
        title: {fr: HERO_TITLE, ar: HERO_TITLE, en: HERO_TITLE}
      }
    }
  });

  await store.createProduct({
    name: {fr: PRODUCT_NAME, ar: PRODUCT_NAME, en: PRODUCT_NAME},
    reference: 'TD-PAGE-TEST-1',
    collectionSlugs: ['caftan'],
    description: {
      fr: 'DESCRIPTION-UNIQUE du produit',
      ar: 'DESCRIPTION-UNIQUE du produit',
      en: 'DESCRIPTION-UNIQUE du produit'
    },
    price: 890,
    images: ['/images/products/product-1.svg'],
    variants: [
      {
        color: {fr: 'Rouge', ar: 'أحمر', en: 'Red'},
        colorHex: '#ff0000',
        images: ['/images/products/product-1.svg'],
        inStock: true
      }
    ]
  });
});

afterAll(async () => {
  const {closeDb} = await import('@/db');
  closeDb();
  rmSync(dir, {recursive: true, force: true});
});

describe('contact page', () => {
  it('shows the address that is stored in the settings row', async () => {
    const {default: ContactPage} = await import('@/app/[locale]/contact/page');
    const html = await renderToHtml(
      await ContactPage({params: params({locale: 'fr'})} as never)
    );

    // The exact row-splitting regression: settings present but not rendered.
    expect(html).toContain(ADDRESS);
    expect(html).toContain('+212600000000');

    // If the page ever falls back to the built-in default again, the stored
    // value goes missing quietly. This is what catches it.
    expect(html).not.toContain(DEFAULT_ADDRESS);
  });

  it('does not fall back to the default contact details', async () => {
    const store = await import('@/lib/data/store');
    const {resolveContact} = await import('@/lib/siteSettings');
    const contact = resolveContact(await store.getSiteSettings());

    expect(contact.address).toBe(ADDRESS);
  });
});

describe('faq page', () => {
  it('shows questions read from the faqs table', async () => {
    const {default: FaqPage} = await import('@/app/[locale]/faq/page');
    const html = await renderToHtml(await FaqPage({params: params({locale: 'fr'})} as never));

    expect(html).toContain(FAQ_QUESTION);
    expect(html).toContain('REPONSE-UNIQUE');
  });
});

describe('home page', () => {
  it('shows the hero title read from its own settings row', async () => {
    // The hero reads settings through a context that the app layout provides,
    // so it is supplied here the same way. Without it the section quietly falls
    // back to the translation defaults, which is the bug this guards against.
    const store = await import('@/lib/data/store');
    const {SiteSettingsProvider: provider} = await import('@/lib/siteSettingsContext');
    const {default: HomePage} = await import('@/app/[locale]/page');

    const page = await HomePage({params: params({locale: 'fr'})} as never);
    const SiteSettingsProvider = provider;
    const html = await renderToHtml(
      <SiteSettingsProvider settings={await store.getSiteSettings()}>{page}</SiteSettingsProvider>
    );

    expect(html).toContain(HERO_TITLE);
  });
});

describe('product page', () => {
  it('shows the product stored in D1', async () => {
    const {default: ProductPage} = await import(
      '@/app/[locale]/collections/[collection]/[slug]/page'
    );
    const html = await renderToHtml(
      await ProductPage({
        params: params({locale: 'fr', collection: 'caftan', slug: PRODUCT_SLUG})
      } as never)
    );

    expect(html).toContain(PRODUCT_NAME);
    expect(html).toContain('DESCRIPTION-UNIQUE');
  });

  it('asks Next to render a 404 for a product that is not there', async () => {
    const {default: ProductPage} = await import(
      '@/app/[locale]/collections/[collection]/[slug]/page'
    );

    await expect(
      ProductPage({
        params: params({locale: 'fr', collection: 'caftan', slug: 'does-not-exist-at-all'})
      } as never)
    ).rejects.toThrow();
  });
});

describe('generated metadata', () => {
  it('builds contact and faq metadata from translations', async () => {
    const contact = await import('@/app/[locale]/contact/page');
    const faq = await import('@/app/[locale]/faq/page');

    const contactMeta = await contact.generateMetadata({
      params: params({locale: 'fr'})
    } as never);
    const faqMeta = await faq.generateMetadata({params: params({locale: 'fr'})} as never);

    expect(contactMeta.title).toBeTruthy();
    expect(faqMeta.title).toBeTruthy();
    expect((contactMeta.alternates as {canonical?: string})?.canonical).toContain('/fr/contact');
  });
});
