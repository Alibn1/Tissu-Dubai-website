import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

let dir: string;
let dbPath: string;

const OLD_SCHEMA = `
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL DEFAULT '',
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  description_fr TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  reference TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL DEFAULT '',
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  description_fr TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  material_fr TEXT NOT NULL DEFAULT '',
  material_ar TEXT NOT NULL DEFAULT '',
  material_en TEXT NOT NULL DEFAULT '',
  material_slug TEXT NOT NULL DEFAULT '',
  width TEXT NOT NULL DEFAULT '',
  price REAL,
  in_stock INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  is_new INTEGER NOT NULL DEFAULT 0,
  collection_slug TEXT NOT NULL REFERENCES collections(slug),
  characteristics_fr TEXT NOT NULL DEFAULT '[]',
  characteristics_ar TEXT NOT NULL DEFAULT '[]',
  characteristics_en TEXT NOT NULL DEFAULT '[]',
  images TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_products_collection ON products(collection_slug);
`;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'tissu-migrate-products-'));
  dbPath = join(dir, 'old-products.db');
  const db = new DatabaseSync(dbPath);
  db.exec(OLD_SCHEMA);
  db.prepare(`INSERT INTO collections (id, slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?)`)
    .run('c1', 'caftan', 'Caftan', 'قفطان', 'Caftan');
  db.prepare(`INSERT INTO collections (id, slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?)`)
    .run('c2', 'tekchita', 'Takchita', 'تكشيطة', 'Takchita');
  db.prepare(
    `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, material_slug, collection_slug, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run('p1', 'soie-double', 'TD-DOUBLE-0001', 'Soie Double', 'حرير', 'Silk', 'soie', 'caftan', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
  db.prepare(
    `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, material_slug, collection_slug, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run('p2', 'laine-mixte', 'TD-MIXTE-0001', 'Laine Mixte', 'صوف', 'Wool', 'laine', 'tekchita', '2026-01-02T00:00:00.000Z', '2026-01-02T00:00:00.000Z');
  db.close();
  process.env.TISSU_DB_PATH = dbPath;
});

afterAll(async () => {
  const {closeDb} = await import('@/db');
  closeDb();
  delete process.env.TISSU_DB_PATH;
  rmSync(dir, {recursive: true, force: true});
});

describe('products-to-collections junction migration', () => {
  it('moves collection_slug links into product_collections and keeps data intact', async () => {
    const {getAllProducts} = await import('@/lib/data/store');
    const products = getAllProducts();
    expect(products).toHaveLength(2);

    const soie = products.find((p) => p.id === 'p1');
    expect(soie?.collections.map((c) => c.slug)).toEqual(['caftan']);

    const laine = products.find((p) => p.id === 'p2');
    expect(laine?.collections.map((c) => c.slug)).toEqual(['tekchita']);
  });

  it('drops the legacy collection_slug column so new inserts work', async () => {
    const {getDb} = await import('@/db');
    const db = getDb();
    const columns = db.prepare('PRAGMA table_info(products)').all() as {name: string}[];
    expect(columns.some((column) => column.name === 'collection_slug')).toBe(false);
    expect(columns.map((column) => column.name)).toContain('id');
  });

  it('keeps collection counts driven by the junction table', async () => {
    const {getCollections} = await import('@/lib/data/store');
    const collections = getCollections();
    expect(collections.find((c) => c.slug === 'caftan')?.productCount).toBe(1);
    expect(collections.find((c) => c.slug === 'tekchita')?.productCount).toBe(1);
  });

  it('adds the SEO columns to a pre-SEO products table', async () => {
    const {getDb} = await import('@/db');
    const columns = (getDb().prepare('PRAGMA table_info(products)').all() as {name: string}[]).map(
      (column) => column.name
    );
    expect(columns).toEqual(expect.arrayContaining(['seo_fr', 'seo_ar', 'seo_en']));
  });

  it('defaults pre-existing rows to auto SEO without data loss', async () => {
    const {getProductById} = await import('@/lib/data/store');
    const soie = getProductById('p1');
    expect(soie?.name.fr).toBe('Soie Double');
    expect(soie?.seo).toEqual({
      fr: {title: '', metaDescription: '', altImage: '', enabled: false},
      en: {title: '', metaDescription: '', altImage: '', enabled: false},
      ar: {title: '', metaDescription: '', altImage: '', enabled: false},
    });
  });
});