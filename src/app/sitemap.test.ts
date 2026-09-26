import {describe, expect, it} from 'vitest';
import sitemap from '@/app/sitemap';

/**
 * The sitemap used to be a hardcoded list, which had drifted from the app: it
 * advertised /tissus (no such route) and listed no products at all.
 */
describe('sitemap', () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url.replace(/^https?:\/\/[^/]+/, ''));

  it('is not empty', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('lists the homepage exactly once, as /fr', () => {
    // /fr is the homepage and belongs in the sitemap. What must not happen is a
    // *second* entry that is only a locale root.
    expect(urls).toContain('/fr');
    const bare = urls.filter((u) => /^\/(fr|en|ar)$/.test(u));
    expect(bare).toEqual(['/fr']);
  });

  it('lists the homepage and the main static routes', () => {
    expect(urls).toContain('/fr');
    expect(urls).toContain('/fr/collections');
    expect(urls).toContain('/fr/contact');
  });

  it('does not advertise routes that do not exist', () => {
    // /tissus was listed but no such page is routed.
    expect(urls).not.toContain('/fr/tissus');
  });

  it('gives every entry the three language alternates', () => {
    for (const e of entries) {
      const langs = e.alternates?.languages;
      expect(langs, `missing alternates for ${e.url}`).toBeDefined();
      expect(Object.keys(langs!).sort()).toEqual(['ar', 'en', 'fr']);
    }
  });

  it('keeps alternates on the same path as the entry', () => {
    for (const e of entries) {
      const path = e.url.replace(/^https?:\/\/[^/]+/, '');
      for (const [locale, href] of Object.entries(e.alternates?.languages ?? {})) {
        const altPath = String(href).replace(/^https?:\/\/[^/]+/, '');
        expect(altPath, `${e.url} -> ${locale}`).toBe(path.replace(/^\/(fr|en|ar)/, `/${locale}`));
      }
    }
  });

  it('lists no duplicate URLs', () => {
    expect(new Set(urls).size).toBe(urls.length);
  });
});
