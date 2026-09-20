import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {beforeAll, afterAll, describe, expect, it} from 'vitest';

let dir: string;

beforeAll(() => {
  // Point the DB at a throwaway file so tests never touch the dev database.
  dir = mkdtempSync(join(tmpdir(), 'tissu-db-'));
  process.env.TISSU_DB_PATH = join(dir, 'test.db');
});

afterAll(async () => {
  const {closeDb} = await import('@/db');
  closeDb();
  rmSync(dir, {recursive: true, force: true});
});

describe('DB-backed store', () => {
  it('seeds the catalog from mock data', async () => {
    const {getAllProducts, getCollections, getModels, getSiteSettings, getInquiries} =
      await import('@/lib/data/store');

    const products = getAllProducts();
    expect(products.length).toBe(16);
    expect(getCollections().length).toBe(3);
    expect(getModels().length).toBeGreaterThan(0);
    expect(getInquiries()).toEqual([]);

    const settings = getSiteSettings();
    expect(settings.contact.whatsappNumber).toBeTruthy();

    const first = products[0];
    expect(first.collection.slug.length).toBeGreaterThan(0);
    expect(first.name.en).toBeTruthy();
    expect(first.variants.length).toBeGreaterThan(0);
    expect(first.images.length).toBeGreaterThan(0);
  });

  it('creates, updates and deletes a product', async () => {
    const store = await import('@/lib/data/store');

    const created = store.createProduct({
      name: {fr: 'Test', ar: 'تجربة', en: 'Test'},
      reference: 'TD-TEST-001',
      collectionSlug: 'caftan',
      price: 100,
      variants: [{color: {fr: 'Rouge', ar: 'أحمر', en: 'Red'}, price: 100, inStock: true}],
    });
    expect(created.id).toBeTruthy();
    expect(created.slug).toBe('test');

    const updated = store.updateProduct(created.id, {price: 120, inStock: false, featured: true});
    expect(updated?.price).toBe(120);
    expect(updated?.inStock).toBe(false);
    expect(updated?.featured).toBe(true);

    expect(store.deleteProduct(created.id)).toBe(true);
    expect(store.getProductById(created.id)).toBeNull();
  });

  it('persists product and variant images through create and update', async () => {
    const store = await import('@/lib/data/store');

    const created = store.createProduct({
      name: {fr: 'Images', ar: 'صور', en: 'Images'},
      reference: 'TD-IMG-001',
      collectionSlug: 'caftan',
      images: ['/images/products/product-1.svg'],
      variants: [
        {
          color: {fr: 'Rouge', ar: 'أحمر', en: 'Red'},
          inStock: true,
          images: ['/images/products/product-2.svg'],
        },
      ],
    });

    expect(created.variants[0].images).toEqual(['/images/products/product-2.svg']);

    const updated = store.updateProduct(created.id, {
      variants: [
        {
          id: created.variants[0].id,
          color: {fr: 'Rouge', ar: 'أحمر', en: 'Red'},
          inStock: true,
          images: ['data:image/png;base64,AAA'],
        },
      ],
    });

    expect(updated?.variants[0].images).toEqual(['data:image/png;base64,AAA']);

    store.deleteProduct(created.id);
  });

  it('upserts and removes models', async () => {
    const store = await import('@/lib/data/store');
    store.upsertModel({id: 'new-model', slug: 'new-model', collectionSlugs: ['caftan', 'tekchita'], name: {fr: 'Nouveau', ar: 'جديد', en: 'New'}});
    const upserted = store.getModelsByCollection('caftan').find((m) => m.id === 'new-model');
    expect(upserted).toBeTruthy();
    expect(upserted?.collectionSlugs).toEqual(['caftan', 'tekchita']);
    expect(store.getModelsByCollection('tekchita').some((m) => m.id === 'new-model')).toBe(true);
    expect(store.removeModel('new-model')).toBe(true);
    expect(store.getModels().find((m) => m.id === 'new-model')).toBeUndefined();
    expect(store.getModelsByCollection('tekchita').some((m) => m.id === 'new-model')).toBe(false);
  });

  it('tracks inquiries and reports real dashboard stats', async () => {
    const store = await import('@/lib/data/store');

    store.addInquiry({productName: 'Soie Royale Dubai', reference: 'TD-CAF-0001', color: 'Doré', quantity: 2, locale: 'fr'});

    const inquiries = store.getInquiries();
    expect(inquiries).toHaveLength(1);
    expect(inquiries[0].reference).toBe('TD-CAF-0001');

    const data = store.getDashboardData();
    expect(data.totalProducts).toBe(16);
    const top = data.topRequested.find((p) => p.reference === 'TD-CAF-0001');
    expect(top?.whatsappClicks).toBe(1);
  });

  it('prunes raw inquiries but keeps the all-time "most requested" counter', async () => {
    const store = await import('@/lib/data/store');

    // Backfill simulates history that predates the counter table.
    store.addInquiry({productName: 'Soie Royale Dubai', reference: 'TD-CAF-0001', color: 'Doré', quantity: 1, locale: 'fr'});

    // Override retention for this test only: keep at most 3 raw rows.
    const previousRows = process.env.INQUIRY_MAX_ROWS;
    process.env.INQUIRY_MAX_ROWS = '3';

    try {
      for (let i = 0; i < 5; i += 1) {
        store.addInquiry({productName: 'Soie Royale Dubai', reference: 'TD-CAF-0001', color: `C${i}`, quantity: 1, locale: 'fr'});
      }

      // The raw log stays bounded…
      expect(store.getInquiries().length).toBeLessThanOrEqual(3);

      // …but the "Produits les plus demandés" count reflects ALL inquiries (2 + 5).
      const data = store.getDashboardData();
      const top = data.topRequested.find((p) => p.reference === 'TD-CAF-0001');
      expect(top?.whatsappClicks).toBe(7);
    } finally {
      if (previousRows === undefined) delete process.env.INQUIRY_MAX_ROWS;
      else process.env.INQUIRY_MAX_ROWS = previousRows;
    }
  });

  it('persists site settings', async () => {
    const store = await import('@/lib/data/store');
    const before = store.getSiteSettings();
    store.saveSiteSettings({...before, contact: {...before.contact, address: 'Test Address'}});
    expect(store.getSiteSettings().contact.address).toBe('Test Address');
  });
});