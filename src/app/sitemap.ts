import {MetadataRoute} from 'next';
import {getAllProducts} from '@/lib/data/store';
import {collectionAlternates, productAlternates, siteBaseUrl} from '@/lib/seo/productUrls';
import type {Locale} from '@/types';

const LOCALES: Locale[] = ['fr', 'en', 'ar'];

/**
 * Built from the database rather than a hardcoded list, so a product or
 * collection can never go missing from the sitemap, and a deleted route can
 * never be advertised to Google as a 404.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteBaseUrl();
  const products = getAllProducts();

  // Only collections that really exist, so we never emit a dead URL.
  const collectionSlugs = [...new Set(products.flatMap((p) => p.collections.map((c) => c.slug)))];

  const entries: MetadataRoute.Sitemap = [];

  const staticRoutes = ['', '/collections', '/a-propos', '/contact', '/localisation', '/faq'];
  for (const route of staticRoutes) {
    const languages: Record<string, string> = {};
    for (const locale of LOCALES) languages[locale] = `${baseUrl}/${locale}${route}`;
    entries.push({
      url: `${baseUrl}/fr${route}`,
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : 0.6,
      alternates: {languages},
    });
  }

  for (const slug of collectionSlugs) {
    entries.push({
      url: `${baseUrl}/fr/collections/${slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {languages: collectionAlternates(slug, 'fr').languages},
    });
  }

  for (const product of products) {
    const alternates = productAlternates(
      product.collections.map((c) => c.slug),
      product.slug,
      'fr'
    );
    if (!alternates) continue;
    entries.push({
      url: alternates.canonical,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {languages: alternates.languages},
    });
  }

  return entries;
}
