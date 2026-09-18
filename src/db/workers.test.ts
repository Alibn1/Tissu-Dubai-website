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
    `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, description_fr, description_ar, description_en, material_fr, material_ar, material_en, material_slug, width, price, in_stock, featured, is_new, collection_slug, characteristics_fr, characteristics_ar, characteristics_en, images, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    'p1', 'soie-royale', 'TD-CAF-0001', 'Soie', 'حرير', 'Silk', '', '', '', 'Soie', 'حرير', 'Silk', 'soie', '150cm', 1000, 1, 1, 0, 'caftan', '[]', '[]', '[]', '["/img.png"]', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
  );

  db.prepare(
    `INSERT INTO product_variants (id, product_id, color_fr, color_ar, color_en, color_hex, sku, price, in_stock, sort_order, images)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run('v1', 'p1', 'Rouge', 'أحمر', 'Red', '#ff0000', 'TD-CAF-0001-1', 1000, 1, 0, '["/img.png"]');

  db.prepare(`INSERT INTO models (id, slug, collection_slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?, ?)`).run('m1', 'soie', 'caftan', 'Soie', 'حرير', 'Silk');

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
    const rows = db.prepare(`SELECT *, (SELECT COUNT(*) FROM products p WHERE p.collection_slug = collections.slug) AS product_count FROM collections ORDER BY sort_order`).all() as Array<{slug: string; product_count: number}>;
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('caftan');
    expect(rows[0].product_count).toBe(1);
  });

  it('serves the joined product list ordered like getAllProducts', () => {
    const db = seededDb();
    const sql = `SELECT p.*, c.id AS col_id, c.slug AS col_slug, c.name_fr AS col_name_fr, c.name_ar AS col_name_ar, c.name_en AS col_name_en, c.description_fr AS col_desc_fr, c.description_ar AS col_desc_ar, c.description_en AS col_desc_en, c.image AS col_image FROM products p JOIN collections c ON c.slug = p.collection_slug ORDER BY p.created_at DESC, p.slug`;
    const rows = db.prepare(sql).all() as Array<{slug: string; col_name_fr: string}>;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({slug: 'soie-royale', col_name_fr: 'Caftan'});
  });

  it('finds a product by slug + collection like getProductBySlug', () => {
    const db = seededDb();
    const sql = `SELECT p.*, c.id AS col_id, c.slug AS col_slug, c.name_fr AS col_name_fr, c.name_ar AS col_name_ar, c.name_en AS col_name_en, c.description_fr AS col_desc_fr, c.description_ar AS col_desc_ar, c.description_en AS col_desc_en, c.image AS col_image FROM products p JOIN collections c ON c.slug = p.collection_slug WHERE p.slug = ? AND p.collection_slug = ?`;
    const row = db.prepare(sql).get('soie-royale', 'caftan') as {slug: string} | undefined;
    expect(row?.slug).toBe('soie-royale');
    expect(db.prepare(sql).get('nope', 'caftan')).toBeUndefined();
  });

  it('dispatches variants and aggregated counts like the store queries', () => {
    const db = seededDb();
    const variants = db.prepare('SELECT * FROM product_variants ORDER BY sort_order').all();
    expect(variants).toHaveLength(1);
    const counts = db.prepare('SELECT collection_slug, COUNT(*) AS n FROM products GROUP BY collection_slug').all();
    expect(counts).toEqual([{collection_slug: 'caftan', n: 1}]);
    const inquiryCounts = db.prepare('SELECT reference, COUNT(*) AS n FROM inquiries GROUP BY reference').all();
    expect(inquiryCounts).toEqual([]);
  });

  it('reads, upserts and deletes rows like the write paths', () => {
    const db = seededDb();

    const settings = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('site');
    expect(settings).toEqual({value: JSON.stringify({whatsapp: '+212 6 00 00 00 00'})});
    db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('site', JSON.stringify({whatsapp: '+212 9 99 99 99 99'}));
    expect(db.prepare('SELECT value FROM site_settings WHERE key = ?').get('site')).toEqual({value: JSON.stringify({whatsapp: '+212 9 99 99 99 99'})});

    db.prepare(`INSERT INTO inquiries (id, product_name, reference, color, quantity, locale, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('i1', 'Soie', 'TD-CAF-0001', 'Rouge', 2, 'fr', 0, '2026-01-01T00:00:00.000Z');
    expect(db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all()).toHaveLength(1);
    expect(db.prepare('UPDATE inquiries SET read = 1 WHERE id = ?').run('i1').changes).toBe(1);
    expect(db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all()[0].read).toBe(1);

    db.prepare('INSERT INTO models (id, slug, collection_slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, collection_slug = excluded.collection_slug, name_fr = excluded.name_fr, name_ar = excluded.name_ar, name_en = excluded.name_en').run('m1', 'soie-2', 'caftan', 'Soie 2', 'حرير', 'Silk 2');
    expect(db.prepare('SELECT * FROM models ORDER BY collection_slug, name_fr').all().find((m) => m.id === 'm1')).toMatchObject({slug: 'soie-2'});

    expect(db.prepare('DELETE FROM products WHERE id = ?').run('p1').changes).toBe(1);
    expect(db.prepare('SELECT * FROM product_variants ORDER BY sort_order').all()).toHaveLength(0);
    expect(db.prepare('DELETE FROM models WHERE id = ?').run('m1').changes).toBe(1);
  });
});