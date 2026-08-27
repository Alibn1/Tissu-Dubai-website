import {MetadataRoute} from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const locales = ['fr', 'ar', 'en'];

  const routes = [
    '',
    '/tissus',
    '/collections/caftan',
    '/collections/jellaba',
    '/collections/tekchita',
    '/collections',
    '/a-propos',
    '/contact',
    '/localisation',
    '/faq'
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    const alternates: Record<string, string> = {};
    for (const locale of locales) {
      alternates[locale] = `${baseUrl}/${locale}${route}`;
    }

    entries.push({
      url: `${baseUrl}/fr${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : route.split('/').length === 2 ? 0.8 : 0.6,
      alternates: {
        languages: alternates
      }
    });
  }

  return entries;
}
