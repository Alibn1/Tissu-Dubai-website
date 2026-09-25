import {describe, expect, it} from 'vitest';
import {
  canonicalCollectionSlug,
  collectionAlternates,
  productAlternates,
  productPath,
  siteBaseUrl,
} from '@/lib/seo/productUrls';

describe('canonicalCollectionSlug', () => {
  it('picks the same collection no matter what order the rows arrive in', () => {
    // product_collections has no ORDER BY, so SQLite may return either order.
    // The canonical must not depend on it.
    const a = canonicalCollectionSlug(['jellaba', 'tekchita']);
    const b = canonicalCollectionSlug(['tekchita', 'jellaba']);
    expect(a).toBe(b);
    expect(a).toBe('jellaba');
  });

  it('ignores blank and non-string entries', () => {
    expect(canonicalCollectionSlug(['', '  ', 'caftan'])).toBe('caftan');
    expect(canonicalCollectionSlug([])).toBeNull();
    expect(canonicalCollectionSlug(['', '  '])).toBeNull();
  });
});

describe('productPath', () => {
  it('builds a locale-prefixed path', () => {
    expect(productPath('caftan', 'caftan-soie', 'fr')).toBe('/fr/collections/caftan/caftan-soie');
    expect(productPath('caftan', 'caftan-soie', 'ar')).toBe('/ar/collections/caftan/caftan-soie');
  });
});

describe('productAlternates', () => {
  it('gives every language the same collection and one canonical', () => {
    const alt = productAlternates(['jellaba', 'tekchita'], 'kilowat');
    expect(alt).not.toBeNull();
    const base = siteBaseUrl();
    // Canonical collection is the sorted-first one, in every language.
    expect(alt!.canonical).toBe(`${base}/fr/collections/jellaba/kilowat`);
    expect(alt!.languages).toEqual({
      fr: `${base}/fr/collections/jellaba/kilowat`,
      en: `${base}/en/collections/jellaba/kilowat`,
      ar: `${base}/ar/collections/jellaba/kilowat`,
    });
  });

  it('is stable regardless of collection order', () => {
    expect(productAlternates(['jellaba', 'tekchita'], 'kilowat')).toEqual(
      productAlternates(['tekchita', 'jellaba'], 'kilowat')
    );
  });

  it('returns null when the product has no usable collection', () => {
    expect(productAlternates([], 'orphaned')).toBeNull();
    expect(productAlternates(['', '  '], 'orphaned')).toBeNull();
  });
});

describe('collectionAlternates', () => {
  it('points each language at the same collection', () => {
    const alt = collectionAlternates('caftan');
    const base = siteBaseUrl();
    expect(alt.canonical).toBe(`${base}/fr/collections/caftan`);
    expect(alt.languages).toEqual({
      fr: `${base}/fr/collections/caftan`,
      en: `${base}/en/collections/caftan`,
      ar: `${base}/ar/collections/caftan`,
    });
  });
});

describe('siteBaseUrl', () => {
  it('never ends with a slash, so joined URLs stay valid', () => {
    expect(siteBaseUrl().endsWith('/')).toBe(false);
  });
});
