// Local SQLite schema (node:sqlite). The repository layer in src/lib/data/store.ts
// reads/writes through these tables. This schema intentionally mirrors what a
// Cloudflare D1 database would need later (same SQLite dialect).

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS collections (
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

CREATE TABLE IF NOT EXISTS products (
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

CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_slug);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_fr TEXT NOT NULL DEFAULT '',
  color_ar TEXT NOT NULL DEFAULT '',
  color_en TEXT NOT NULL DEFAULT '',
  color_hex TEXT NOT NULL DEFAULT '',
  sku TEXT NOT NULL DEFAULT '',
  price REAL,
  in_stock INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  images TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  collection_slug TEXT NOT NULL REFERENCES collections(slug),
  name_fr TEXT NOT NULL DEFAULT '',
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  UNIQUE(slug, collection_slug)
);

CREATE INDEX IF NOT EXISTS idx_models_collection ON models(collection_slug);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  reference TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  locale TEXT NOT NULL DEFAULT 'fr',
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inquiries_reference ON inquiries(reference);
`;