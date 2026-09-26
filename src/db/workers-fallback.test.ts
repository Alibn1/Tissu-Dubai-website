import {describe, expect, it} from 'vitest';
import {createWorkersDatabase} from '@/db/workers';
import {products as mockProducts} from '@/mock/products';

/**
 * Cloudflare Workers has no filesystem and no node:sqlite, so getDb() catches
 * the failure and falls back to the in-memory WorkersDatabase (src/db/index.ts).
 *
 * This documents what that fallback is, because it decides what a Cloudflare
 * deployment actually serves. It is a test double: data lives in JS arrays and
 * only a fixed set of query shapes is understood. It is not a database.
 */
describe('Workers (Cloudflare) database fallback', () => {
  it('is backed by plain in-memory tables, not a real database', () => {
    const db = createWorkersDatabase();
    // No schema is needed: the tables already exist.
    expect(() =>
      db.prepare(
        `SELECT *, (SELECT COUNT(*) FROM product_collections pc WHERE pc.collection_slug = collections.slug) AS product_count FROM collections ORDER BY sort_order`
      ).all()
    ).not.toThrow();
  });

  it('starts with no products, so it cannot serve the real catalogue', () => {
    const db = createWorkersDatabase();
    // The 21 real products live in data/tissu.db, unreachable on Workers.
    const rows = db.prepare('select p.* from products p order by p.created_at desc, p.slug').all() as unknown[];
    expect(rows).toHaveLength(0);
  });

  it('rejects arbitrary SQL, which a real database would accept', () => {
    const db = createWorkersDatabase();
    expect(() => db.prepare('SELECT slug FROM products').all()).toThrow(/unsupported query/);
  });

  it('loses every write when the instance is recreated', () => {
    const first = createWorkersDatabase();
    first
      .prepare('insert into products (id, slug, name_fr, reference, price) values (?, ?, ?, ?, ?)')
      .run('p1', 'saved-by-admin', 'X', 'REF', 10);
    expect((first.prepare('select p.* from products p where p.id = ?').get('p1') as {slug: string}).slug).toBe(
      'saved-by-admin'
    );

    const second = createWorkersDatabase();
    expect(second.prepare('select p.* from products p where p.id = ?').get('p1')).toBeUndefined();
  });

  it('would seed from the mock catalogue rather than real data', () => {
    // getDb() seeds the fallback from src/mock/*, so a deployed site shows
    // placeholder products, not the ones added through the admin.
    expect(mockProducts.length).toBeGreaterThan(0);
    expect(mockProducts.some((p) => p.slug === 'jellaba-mouzouna')).toBe(false);
  });
});
