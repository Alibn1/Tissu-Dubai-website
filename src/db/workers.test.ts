import {describe, expect, it} from 'vitest';
import {SCHEMA_SQL} from '@/db/schema';
import {createWorkersDatabase, type WorkersDatabase} from '@/db/workers';

// The in-memory database mirrors the set of statements issued by
// src/db/index.ts and src/lib/data/store.ts on the Workers runtime.
function seededDb(): WorkersDatabase {
  const db = createWorkersDatabase();
  db.exec(SCHEMA_SQL);

  db.prepare(
    `INSERT INTO collections (id, slug, name_fr, name_ar, name_en, description_fr, description_ar, description_en, image, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run('c1', 'caftan', 'Caftan', 'قفطان', 'Caftan', 'd', 'd', 'd', '/img.png', 0, '2026-01-01T00:00:00.000Z');

  db.prepare(
    `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, description_fr, description_ar, description_en, material_fr, material_ar, material_en, material_slug, width, price, in_stock, featured, is_new, characteristics_fr, characteristics_ar, characteristics_en, images, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    'p1', 'soie-royale', 'TD-CAF-0001', 'Soie', 'حرير', 'Silk', '', '', '', 'Soie', 'حرير', 'Silk', 'soie', '150cm', 1000, 1, 1, 0, '[]', '[]', '[]', '["/img.png"]', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
  );
  db.prepare(`INSERT INTO product_collections (product_id, collection_slug) VALUES (?, ?)`).run('p1', 'caftan');

  db.prepare(
    `INSERT INTO product_variants (id, product_id, color_fr, color_ar, color_en, color_hex, sku, price, in_stock, sort_order, images)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run('v1', 'p1', 'Rouge', 'أحمر', 'Red', '#ff0000', 'TD-CAF-0001-1', 1000, 1, 0, '["/img.png"]');

  db.prepare(`INSERT INTO models (id, slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?)`).run('m1', 'soie', 'Soie', 'حرير', 'Silk');
  db.prepare(`INSERT INTO model_collections (model_id, collection_slug) VALUES (?, ?)`).run('m1', 'caftan');

  db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run('site', JSON.stringify({whatsapp: '+212 6 00 00 00 00'}));

  return db;
}

describe('WorkersDatabase (in-memory fallback)', () => {
  it('ignores DDL, PRAGMA and transaction statements', () => {
    const db = seededDb();
    db.exec('PRAGMA busy_timeout = 15000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    db.exec('BEGIN IMMEDIATE; COMMIT; ROLLBACK;');
    db.exec('DROP INDEX IF EXISTS idx_products_category;');
    expect(() => db.exec('SELECT 1')).toThrow(/unsupported exec/);
  });

  it('serves the collection list with product counts', () => {
    const db = seededDb();
    const rows = db.prepare(`SELECT *, (SELECT COUNT(*) FROM product_collections pc WHERE pc.collection_slug = collections.slug) AS product_count FROM collections ORDER BY sort_order`).all() as Array<{slug: string; product_count: number}>;
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('caftan');
    expect(rows[0].product_count).toBe(1);
  });

  it('serves the product list ordered like getAllProducts', () => {
    const db = seededDb();
    const sql = `SELECT p.* FROM products p ORDER BY p.created_at DESC, p.slug`;
    const rows = db.prepare(sql).all() as Array<{slug: string}>;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({slug: 'soie-royale'});
  });

  it('finds a product by slug like getProductBySlug', () => {
    const db = seededDb();
    const sql = `SELECT p.* FROM products p WHERE p.slug = ?`;
    const row = db.prepare(sql).get('soie-royale') as {slug: string} | undefined;
    expect(row?.slug).toBe('soie-royale');
    expect(db.prepare(sql).get('nope')).toBeUndefined();
  });

  it('dispatches variants, links and aggregated counts like the store queries', () => {
    const db = seededDb();
    const variants = db.prepare('SELECT * FROM product_variants ORDER BY sort_order').all();
    expect(variants).toHaveLength(1);
    const links = db.prepare('SELECT * FROM product_collections').all();
    expect(links).toEqual([{product_id: 'p1', collection_slug: 'caftan'}]);
    const counts = db.prepare('SELECT collection_slug, COUNT(*) AS n FROM product_collections GROUP BY collection_slug').all();
    expect(counts).toEqual([{collection_slug: 'caftan', n: 1}]);
  });

  it('reads, upserts and deletes rows like the write paths', () => {
    const db = seededDb();

    const settings = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('site');
    expect(settings).toEqual({value: JSON.stringify({whatsapp: '+212 6 00 00 00 00'})});
    db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('site', JSON.stringify({whatsapp: '+212 9 99 99 99 99'}));
    expect(db.prepare('SELECT value FROM site_settings WHERE key = ?').get('site')).toEqual({value: JSON.stringify({whatsapp: '+212 9 99 99 99 99'})});

    db.prepare('INSERT INTO models (id, slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, name_fr = excluded.name_fr, name_ar = excluded.name_ar, name_en = excluded.name_en').run('m1', 'soie-2', 'Soie 2', 'حرير', 'Silk 2');
    expect(db.prepare('SELECT * FROM models ORDER BY name_fr').all().find((m) => m.id === 'm1')).toMatchObject({slug: 'soie-2'});

    expect(db.prepare('DELETE FROM products WHERE id = ?').run('p1').changes).toBe(1);
    expect(db.prepare('SELECT * FROM product_variants ORDER BY sort_order').all()).toHaveLength(0);
    expect(db.prepare('SELECT * FROM product_collections').all()).toHaveLength(0);
    expect(db.prepare('SELECT * FROM model_collections').all()).toHaveLength(1);
    expect(db.prepare('DELETE FROM models WHERE id = ?').run('m1').changes).toBe(1);
    expect(db.prepare('SELECT * FROM model_collections').all()).toHaveLength(0);
  });
});