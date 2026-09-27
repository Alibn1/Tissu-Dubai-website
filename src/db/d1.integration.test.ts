import {describe, expect, it, beforeAll} from 'vitest';

/**
 * End-to-end check of the production data path.
 *
 * The rest of the suite runs against node:sqlite, which is fast and local, but
 * it cannot catch a D1-only mistake: a binding that is never read, a statement
 * D1 rejects, a write that lands somewhere other than D1. This suite runs the
 * same store functions through `getCloudflareContext` against a real D1
 * database, which is what the deployed Worker does.
 *
 * It is skipped unless TISSU_FORCE_D1=1, because it needs a seeded database.
 * Every migration must be applied in order; a missing one shows up as
 * "no such table" rather than an obvious setup error.
 *
 *   npx wrangler d1 execute tissu-dubai --local --file=migrations/0001_init.sql
 *   npx wrangler d1 execute tissu-dubai --local --file=migrations/0002_faqs.sql
 *   npx wrangler d1 execute tissu-dubai --local --file=import.sql
 *   TISSU_FORCE_D1=1 npx vitest run src/db/d1.integration.test.ts
 */
const enabled = process.env.TISSU_FORCE_D1 === '1';
const describeD1 = enabled ? describe : describe.skip;

/**
 * This suite talks to a real D1 database over the network, so a round trip can
 * outlast the default 5s timeout and read as a failure when nothing is wrong.
 */
const D1_TIMEOUT = 30_000;

// Set before the store is imported so the adapter picks D1 over the local file.
if (enabled) {
  process.env.NEXT_RUNTIME = 'nodejs';
}

describeD1('D1 integration (production data path)', () => {
  beforeAll(async () => {
    if (enabled) {
      const {isUsingD1} = await import('@/db');
      expect(await isUsingD1(), 'TISSU_FORCE_D1=1 did not select the D1 backend').toBe(true);
    }
  });

  it('reads the imported catalogue from D1', async () => {
    const store = await import('@/lib/data/store');

    const collections = await store.getCollections();
    expect(collections).toHaveLength(4);
    expect(collections.map((c) => c.slug).sort()).toEqual(['caftan', 'homme', 'jellaba', 'tekchita']);
    // Counts come from the junction table, so they prove the links were loaded.
    expect(collections.find((c) => c.slug === 'caftan')?.productCount).toBe(9);

    const products = await store.getAllProducts();
    expect(products).toHaveLength(21);
    expect(products.reduce((n, p) => n + p.variants.length, 0)).toBe(54);
    expect(products.some((p) => p.collections.length > 1)).toBe(true);
  }, D1_TIMEOUT);

  it('looks products up by id and by slug', async () => {
    const store = await import('@/lib/data/store');
    const first = (await store.getAllProducts())[0];

    expect((await store.getProductBySlug(first.slug))?.id).toBe(first.id);
    expect((await store.getProductById(first.id))?.slug).toBe(first.slug);
    expect(await store.getProductBySlug('does-not-exist')).toBeNull();
  }, D1_TIMEOUT);

  it('reads models with their junction-table collection links', async () => {
    const store = await import('@/lib/data/store');
    const models = await store.getModels();
    expect(models).toHaveLength(9);
    expect(models.some((m) => m.collectionSlugs.length > 1)).toBe(true);
  }, D1_TIMEOUT);

  it('reads site settings from D1', async () => {
    const store = await import('@/lib/data/store');
    const settings = await store.getSiteSettings();
    expect(settings.contact.phones[0]?.length).toBeGreaterThan(0);
    expect(settings.homepage.collectionCards.length).toBeGreaterThan(0);
  }, D1_TIMEOUT);

  it('lists every collection in the dashboard, including ones with few products', async () => {
    const store = await import('@/lib/data/store');
    const dashboard = await store.getDashboardData();
    expect(dashboard.totalProducts).toBe(21);
    // A collection derived only from products would drop any empty collection.
    expect(dashboard.collectionBreakdown.map((c) => c.slug).sort()).toEqual([
      'caftan',
      'homme',
      'jellaba',
      'tekchita',
    ]);
    expect(dashboard.collectionBreakdown.find((c) => c.slug === 'homme')?.count).toBe(1);
  }, D1_TIMEOUT);

  it('persists a product write in D1 and reads it back', async () => {
    const store = await import('@/lib/data/store');

    const created = await store.createProduct({
      name: {fr: 'D1 Ecriture', ar: 'D1 كتابة', en: 'D1 write'},
      reference: 'TD-D1-VERIFY',
      collectionSlugs: ['caftan', 'homme'],
      price: 777,
      images: ['/images/products/product-1.svg'],
      variants: [
        {color: {fr: 'Rouge', ar: 'أحمر', en: 'Red'}, price: 777, inStock: true, images: ['/img.svg']},
        {color: {fr: 'Bleu', ar: 'أزرق', en: 'Blue'}, price: 888, inStock: false, images: []},
      ],
    });

    expect(created.slug).toBe('d1-ecriture');
    expect(created.collections.map((c) => c.slug).sort()).toEqual(['caftan', 'homme']);
    expect(created.variants).toHaveLength(2);
    expect(created.variants[0].images).toEqual(['/img.svg']);

    // Re-read rather than trusting the returned value: a write that only landed
    // in process memory would not survive this.
    const reread = await store.getProductById(created.id);
    expect(reread?.reference).toBe('TD-D1-VERIFY');
    expect(reread?.price).toBe(777);

    const updated = await store.updateProduct(created.id, {price: 999, featured: true});
    expect(updated?.price).toBe(999);
    expect((await store.getProductById(created.id))?.price).toBe(999);

    const before = (await store.getCollections()).find((c) => c.slug === 'caftan')?.productCount;
    expect(await store.deleteProduct(created.id)).toBe(true);
    expect(await store.getProductById(created.id)).toBeNull();
    // ON DELETE CASCADE must clear the junction rows too.
    expect((await store.getCollections()).find((c) => c.slug === 'caftan')?.productCount).toBe(before! - 1);
  });

  it('persists site settings and model writes in D1', async () => {
    const store = await import('@/lib/data/store');

    const settings = await store.getSiteSettings();
    const address = `D1 verify street ${Date.now()}`;

    // Restored in a finally: an assertion that fails between the write and the
    // restore would otherwise leave the live contact page showing this string,
    // which is exactly the kind of damage this suite is meant to catch.
    try {
      await store.saveSiteSettings({...settings, contact: {...settings.contact, address}});
      expect((await store.getSiteSettings()).contact.address).toBe(address);
    } finally {
      await store.saveSiteSettings(settings);
      expect((await store.getSiteSettings()).contact.address).toBe(settings.contact.address);
    }

    await store.upsertModel({
      id: 'm-verify',
      slug: 'model-verify',
      collectionSlugs: ['caftan', 'tekchita'],
      name: {fr: 'Verif', ar: 'تحقق', en: 'Verify'},
    });
    const upserted = (await store.getModels()).find((m) => m.id === 'm-verify');
    expect(upserted?.slug).toBe('model-verify');
    expect([...(upserted?.collectionSlugs ?? [])].sort()).toEqual(['caftan', 'tekchita']);

    expect(await store.removeModel('m-verify')).toBe(true);
    expect((await store.getModels()).find((m) => m.id === 'm-verify')).toBeUndefined();
  }, D1_TIMEOUT);
});
