-- Tissu Dubai initial schema for Cloudflare D1.
--
-- Mirrors src/db/schema.ts, which is the node:sqlite schema used for local
-- development. Same SQLite dialect, so the column names and defaults are kept
-- identical and store.ts can be pointed at either backend.
--
-- The indexes below are not in the local schema: they match the query shapes in
-- src/lib/data/store.ts, which is more valuable on D1 where every read is a
-- network round trip.

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
  characteristics_fr TEXT NOT NULL DEFAULT '[]',
  characteristics_ar TEXT NOT NULL DEFAULT '[]',
  characteristics_en TEXT NOT NULL DEFAULT '[]',
  seo_fr TEXT NOT NULL DEFAULT '{}',
  seo_ar TEXT NOT NULL DEFAULT '{}',
  seo_en TEXT NOT NULL DEFAULT '{}',
  images TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Many-to-many between products and collections: one product can belong to
-- several collections without duplicating the product row.
CREATE TABLE IF NOT EXISTS product_collections (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_slug TEXT NOT NULL REFERENCES collections(slug) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_slug)
);

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
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL DEFAULT '',
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT ''
);

-- Many-to-many between models and collections: one model can belong to
-- several collections without duplicating the model row.
CREATE TABLE IF NOT EXISTS model_collections (
  model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  collection_slug TEXT NOT NULL REFERENCES collections(slug) ON DELETE CASCADE,
  PRIMARY KEY (model_id, collection_slug)
);

CREATE INDEX IF NOT EXISTS idx_model_collections_collection ON model_collections(collection_slug);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- collection product_count subquery in getAllCollections()
CREATE INDEX IF NOT EXISTS idx_product_collections_collection
  ON product_collections(collection_slug);
-- product list ordering: ORDER BY p.created_at DESC, p.slug
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC, slug);
-- collection membership lookups when filtering a product list by slug
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON collections(sort_order);
