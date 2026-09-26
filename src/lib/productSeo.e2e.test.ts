import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {NextRequest} from 'next/server';

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'tissu-seo-e2e-'));
  process.env.TISSU_DB_PATH = join(dir, 'e2e.db');
});

afterAll(async () => {
  const {closeDb} = await import('@/db');
  closeDb();
  delete process.env.TISSU_DB_PATH;
  rmSync(dir, {recursive: true, force: true});
});

/** A real NextRequest carrying the admin session cookie the routes check for. */
function adminRequest(url: string, body?: unknown, method = 'POST'): NextRequest {
  return new NextRequest(new Request(`http://localhost${url}`, {
    method,
    headers: {'content-type': 'application/json', cookie: 'admin-session=authenticated'},
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
}

const SEO_PAYLOAD = {
  fr: {title: 'Caftan en soie double', metaDescription: 'Caftan en soie double fait main.', altImage: 'Caftan en soie double, vue de face', enabled: true},
  en: {title: 'Double silk caftan', metaDescription: '', altImage: '', enabled: true},
  ar: {title: 'قفطان حرير مزدوج', metaDescription: 'وصف', altImage: '', enabled: true},
};

describe('product SEO end to end (HTTP route -> database -> public page)', () => {
  it('saves SEO entered on the create form and serves it on the public page', async () => {
    const {POST} = await import('@/app/api/products/route');

    const res = await POST(
      adminRequest('/api/products', {
        name: {fr: 'Caftan Test', ar: 'قفطان', en: 'Caftan Test'},
        reference: 'TD-E2E-001',
        collectionSlugs: ['caftan'],
        baseImages: ['/images/products/product-1.svg'],
        seo: SEO_PAYLOAD,
      })
    );

    expect(res.status).toBe(201);
    const created = (await res.json()).product;
    expect(created.seo.fr.title).toBe('Caftan en soie double');
    expect(created.seo.ar.enabled).toBe(true);

    // Re-read through the same path the public page uses.
    const {getProductBySlug} = await import('@/lib/api');
    const product = await getProductBySlug(created.slug);
    expect(product?.seo?.fr.metaDescription).toBe('Caftan en soie double fait main.');

    const {seoOverride} = await import('@/lib/productSeo');
    const pageTitle = seoOverride(product?.seo, 'fr', 'title');
    const pageDesc = seoOverride(product?.seo, 'fr', 'metaDescription');
    const pageAlt = seoOverride(product?.seo, 'fr', 'altImage');

    expect(pageTitle).toBe('Caftan en soie double');
    expect(pageDesc).toBe('Caftan en soie double fait main.');
    expect(pageAlt).toBe('Caftan en soie double, vue de face');

    // Fields the admin left empty must fall back rather than render blank.
    expect(seoOverride(product?.seo, 'en', 'metaDescription')).toBe('');
    expect(seoOverride(product?.seo, 'en', 'altImage')).toBe('');

    const store = await import('@/lib/data/store');
    store.deleteProduct(created.id);
  });

  it('keeps SEO on update and lets the admin turn a language back to auto', async () => {
    const {POST} = await import('@/app/api/products/route');
    const {PUT} = await import('@/app/api/products/[id]/route');

    const res = await POST(
      adminRequest('/api/products', {
        name: {fr: 'Caftan Edit', ar: 'قفطان', en: 'Caftan Edit'},
        reference: 'TD-E2E-002',
        collectionSlugs: ['caftan'],
        baseImages: ['/images/products/product-1.svg'],
        seo: SEO_PAYLOAD,
      })
    );
    const created = (await res.json()).product;

    // An edit that does not mention SEO must not wipe it.
    const untouched = await PUT(
      adminRequest(`/api/products/${created.id}`, {price: 250}, 'PUT'),
      {params: Promise.resolve({id: created.id})}
    );
    expect(untouched.status).toBe(200);
    const afterUnrelatedEdit = (await untouched.json()).product;
    expect(afterUnrelatedEdit.seo.fr.title).toBe('Caftan en soie double');

    // Turning Arabic back to auto clears its stored override.
    const updated = await PUT(
      adminRequest(
        `/api/products/${created.id}`,
        {
          seo: {
            fr: SEO_PAYLOAD.fr,
            en: SEO_PAYLOAD.en,
            ar: {title: 'نص قديم', metaDescription: '', altImage: '', enabled: false},
          },
        },
        'PUT'
      ),
      {params: Promise.resolve({id: created.id})}
    );
    const afterDisable = (await updated.json()).product;
    expect(afterDisable.seo.ar).toEqual({title: '', metaDescription: '', altImage: '', enabled: false});

    // And the stale Arabic text must not resurface after a reload.
    const {getProductById} = await import('@/lib/data/store');
    expect(getProductById(created.id)?.seo?.ar.title).toBe('');

    const store = await import('@/lib/data/store');
    store.deleteProduct(created.id);
  });

  it('falls back to the product name when no SEO is set', async () => {
    const {POST} = await import('@/app/api/products/route');
    const {getProductBySlug} = await import('@/lib/api');
    const {seoOverride} = await import('@/lib/productSeo');

    const res = await POST(
      adminRequest('/api/products', {
        name: {fr: 'Djellaba Simple', ar: 'جلابة', en: 'Simple Djellaba'},
        reference: 'TD-E2E-003',
        collectionSlugs: ['jellaba'],
        baseImages: ['/images/products/product-1.svg'],
      })
    );
    const created = (await res.json()).product;

    const product = await getProductBySlug(created.slug);
    expect(seoOverride(product?.seo, 'fr', 'title')).toBe('');

    // The page then renders the product name, exactly as before this change.
    const name = product?.name.fr ?? '';
    expect(seoOverride(product?.seo, 'fr', 'title') || name).toBe(name);
    expect(seoOverride(product?.seo, 'ar', 'title') || (product?.name.ar ?? '')).toBe('جلابة');

    const store = await import('@/lib/data/store');
    store.deleteProduct(created.id);
  });

  it('rejects an unauthenticated SEO write', async () => {
    const {POST} = await import('@/app/api/products/route');

    const res = await POST(
      new NextRequest(
        new Request('http://localhost/api/products', {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({
            name: {fr: 'Hack', ar: 'Hack', en: 'Hack'},
            reference: 'TD-E2E-404',
            collectionSlugs: ['caftan'],
            baseImages: ['/images/products/product-1.svg'],
            seo: SEO_PAYLOAD,
          }),
        })
      )
    );

    expect(res.status).toBe(401);
  });
});
