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
    const {getAllProducts, getCollections, getModels, getSiteSettings} =
      await import('@/lib/data/store');

    const products = await getAllProducts();
    expect(products.length).toBe(16);
    expect((await getCollections()).length).toBe(4);
    expect((await getModels()).length).toBeGreaterThan(0);

    const settings = await getSiteSettings();
    expect(settings.contact.whatsappNumber).toBeTruthy();

    const first = products[0];
    expect(first.collections[0].slug.length).toBeGreaterThan(0);
    expect(first.name.en).toBeTruthy();
    expect(first.variants.length).toBeGreaterThan(0);
    expect(first.images.length).toBeGreaterThan(0);
  });

  it('creates, updates and deletes a product', async () => {
    const store = await import('@/lib/data/store');

    const created = await store.createProduct({
      name: {fr: 'Test', ar: 'تجربة', en: 'Test'},
      reference: 'TD-TEST-001',
      collectionSlugs: ['caftan'],
      price: 100,
      variants: [{color: {fr: 'Rouge', ar: 'أحمر', en: 'Red'}, price: 100, inStock: true}],
    });
    expect(created.id).toBeTruthy();
    expect(created.slug).toBe('test');

    const updated = await store.updateProduct(created.id, {price: 120, inStock: false, featured: true});
    expect(updated?.price).toBe(120);
    expect(updated?.inStock).toBe(false);
    expect(updated?.featured).toBe(true);

    expect(await store.deleteProduct(created.id)).toBe(true);
    expect(await store.getProductById(created.id)).toBeNull();
  });

  it('persists product and variant images through create and update', async () => {
    const store = await import('@/lib/data/store');

    const created = await store.createProduct({
      name: {fr: 'Images', ar: 'صور', en: 'Images'},
      reference: 'TD-IMG-001',
      collectionSlugs: ['caftan'],
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

    const updated = await store.updateProduct(created.id, {
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

    await store.deleteProduct(created.id);
  });

  it('upserts and removes models', async () => {
    const store = await import('@/lib/data/store');
    await store.upsertModel({id: 'new-model', slug: 'new-model', collectionSlugs: ['caftan', 'tekchita'], name: {fr: 'Nouveau', ar: 'جديد', en: 'New'}});
    const upserted = (await store.getModelsByCollection('caftan')).find((m) => m.id === 'new-model');
    expect(upserted).toBeTruthy();
    expect(upserted?.collectionSlugs).toEqual(['caftan', 'tekchita']);
    expect((await store.getModelsByCollection('tekchita')).some((m) => m.id === 'new-model')).toBe(true);
    expect(await store.removeModel('new-model')).toBe(true);
    expect((await store.getModels()).find((m) => m.id === 'new-model')).toBeUndefined();
    expect((await store.getModelsByCollection('tekchita')).some((m) => m.id === 'new-model')).toBe(false);
  });

  it('persists site settings', async () => {
    const store = await import('@/lib/data/store');
    const before = await store.getSiteSettings();
    await store.saveSiteSettings({...before, contact: {...before.contact, address: 'Test Address'}});
    expect((await store.getSiteSettings()).contact.address).toBe('Test Address');
  });

  it('round-trips per-language SEO overrides', async () => {
    const store = await import('@/lib/data/store');

    const created = await store.createProduct({
      name: {fr: 'SEO', ar: 'SEO', en: 'SEO'},
      reference: 'TD-SEO-001',
      collectionSlugs: ['caftan'],
      seo: {
        fr: {title: 'Titre FR', metaDescription: 'Desc FR', altImage: 'Alt FR', enabled: true},
        en: {title: '', metaDescription: '', altImage: '', enabled: false},
        ar: {title: 'عنوان', metaDescription: 'وصف', altImage: 'نص', enabled: true},
      },
    });

    expect(created.seo?.fr).toEqual({
      title: 'Titre FR',
      metaDescription: 'Desc FR',
      altImage: 'Alt FR',
      enabled: true,
    });
    expect(created.seo?.en).toEqual({title: '', metaDescription: '', altImage: '', enabled: false});
    expect(created.seo?.ar.enabled).toBe(true);

    // Reading back from the database must return the same values.
    const reloaded = await store.getProductById(created.id);
    expect(reloaded?.seo?.fr.title).toBe('Titre FR');
    expect(reloaded?.seo?.ar.title).toBe('عنوان');

    const updated = await store.updateProduct(created.id, {
      seo: {
        fr: {title: 'Titre FR 2', metaDescription: '', altImage: '', enabled: true},
        en: {title: 'English title', metaDescription: '', altImage: '', enabled: true},
        ar: {title: '', metaDescription: '', altImage: '', enabled: false},
      },
    });
    expect(updated?.seo?.fr.title).toBe('Titre FR 2');
    expect(updated?.seo?.en.title).toBe('English title');
    expect(updated?.seo?.ar.enabled).toBe(false);

    await store.deleteProduct(created.id);
  });

  it('drops stored overrides for a language switched back to auto', async () => {
    const store = await import('@/lib/data/store');

    const created = await store.createProduct({
      name: {fr: 'SEO auto', ar: 'SEO auto', en: 'SEO auto'},
      reference: 'TD-SEO-002',
      collectionSlugs: ['caftan'],
      seo: {
        fr: {title: 'Titre', metaDescription: 'Desc', altImage: 'Alt', enabled: true},
        en: {title: '', metaDescription: '', altImage: '', enabled: false},
        ar: {title: '', metaDescription: '', altImage: '', enabled: false},
      },
    });

    // Disabling the language keeps the text in the form state but must not
    // reach the database, so a later auto-generated value can never be shadowed.
    const updated = await store.updateProduct(created.id, {
      seo: {
        fr: {title: '', metaDescription: '', altImage: '', enabled: false},
        en: {title: '', metaDescription: '', altImage: '', enabled: false},
        ar: {title: '', metaDescription: '', altImage: '', enabled: false},
      },
    });

    expect(updated?.seo?.fr).toEqual({title: '', metaDescription: '', altImage: '', enabled: false});

    await store.deleteProduct(created.id);
  });

  it('defaults missing SEO columns to auto for every language', async () => {
    const store = await import('@/lib/data/store');

    const created = await store.createProduct({
      name: {fr: 'No SEO', ar: 'No SEO', en: 'No SEO'},
      reference: 'TD-SEO-003',
      collectionSlugs: ['caftan'],
    });

    expect(created.seo).toEqual({
      fr: {title: '', metaDescription: '', altImage: '', enabled: false},
      en: {title: '', metaDescription: '', altImage: '', enabled: false},
      ar: {title: '', metaDescription: '', altImage: '', enabled: false},
    });

    await store.deleteProduct(created.id);
  });
});

describe('FAQ storage', () => {
  it('stores questions in their own table and leaves them out of the blob', async () => {
    const store = await import('@/lib/data/store');
    const {getFaqs} = store;
    const {getDb, dbFirst} = await import('@/db');

    const settings = await store.getSiteSettings();
    const faq = [
      {
        id: 'faq-test-1',
        question: {fr: 'Question un', ar: 'سؤال', en: 'Question one'},
        answer: {fr: 'Réponse un', ar: 'جواب', en: 'Answer one'},
      },
      {
        id: 'faq-test-2',
        question: {fr: 'Question deux', ar: 'سؤال٢', en: 'Question two'},
        answer: {fr: 'Réponse deux', ar: 'جواب٢', en: 'Answer two'},
      },
    ];

    await store.saveSiteSettings({...settings, faq});

    // Read back through the table, in list order.
    const fromTable = await getFaqs();
    expect(fromTable.map((entry) => entry.id)).toEqual(['faq-test-1', 'faq-test-2']);
    expect(fromTable[0].question.fr).toBe('Question un');
    expect(fromTable[1].answer.en).toBe('Answer two');

    // The blob must not keep a second copy that could drift from the table.
    const row = await dbFirst<{value: string}>(
      "SELECT value FROM site_settings WHERE key = 'site'"
    );
    expect(JSON.parse(row!.value)).not.toHaveProperty('faq');

    // ...and getSiteSettings still exposes faq, unchanged for every consumer.
    expect((await store.getSiteSettings()).faq.map((entry) => entry.id)).toEqual([
      'faq-test-1',
      'faq-test-2',
    ]);

    // The table is the source of truth: a row can be edited without touching the blob.
    getDb().prepare('UPDATE faqs SET question_fr = ? WHERE id = ?').run('Modifié', 'faq-test-1');
    expect((await getFaqs())[0].question.fr).toBe('Modifié');

    // Reordering follows the submitted list, not the previous sort_order.
    await store.saveSiteSettings({...(await store.getSiteSettings()), faq: [faq[1], faq[0]]});
    expect((await getFaqs()).map((entry) => entry.id)).toEqual(['faq-test-2', 'faq-test-1']);

    // Removing an entry from the list deletes its row.
    await store.saveSiteSettings({...(await store.getSiteSettings()), faq: [faq[0]]});
    expect((await getFaqs()).map((entry) => entry.id)).toEqual(['faq-test-1']);
  });
});