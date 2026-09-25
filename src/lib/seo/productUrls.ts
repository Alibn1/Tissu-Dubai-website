import type {Locale} from '@/types';

export const LOCALES: Locale[] = ['fr', 'ar', 'en'];

/** The site's origin, without a trailing slash. */
export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

/**
 * The one collection slug a product should be indexed under.
 *
 * A product can belong to several collections (`product_collections`), so the
 * same item is reachable at more than one URL. Collection rows come back from
 * SQLite in an arbitrary order, so the choice has to be made by sorting:
 * otherwise the canonical link would point at a different collection on each
 * request and Google would see the page as constantly moving.
 */
export function canonicalCollectionSlug(collectionSlugs: string[]): string | null {
  const usable = collectionSlugs.filter((slug) => typeof slug === 'string' && slug.trim() !== '');
  if (usable.length === 0) return null;
  return [...usable].sort()[0];
}

/** The path of a product page in one language, e.g. /fr/collections/caftan/caftan-soie. */
export function productPath(collectionSlug: string, productSlug: string, locale: Locale): string {
  return `/${locale}/collections/${collectionSlug}/${productSlug}`;
}

/** Absolute URL of a product page in one language. */
export function productUrl(collectionSlug: string, productSlug: string, locale: Locale): string {
  return `${siteBaseUrl()}${productPath(collectionSlug, productSlug, locale)}`;
}

/**
 * Canonical URL plus one alternate per language, for a product reachable at
 * several collection URLs. Every language points at the same canonical
 * collection so the alternates agree with the canonical.
 */
export function productAlternates(
  collectionSlugs: string[],
  productSlug: string
): {canonical: string; languages: Record<string, string>} | null {
  const canonicalSlug = canonicalCollectionSlug(collectionSlugs);
  if (!canonicalSlug) return null;

  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = productUrl(canonicalSlug, productSlug, locale);
  }
  return {canonical: languages.fr, languages};
}

/** Canonical URL plus one alternate per language for a collection page. */
export function collectionAlternates(collectionSlug: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = `${siteBaseUrl()}/${locale}/collections/${collectionSlug}`;
  }
  return {canonical: languages.fr, languages};
}
