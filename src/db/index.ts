import {DatabaseSync} from 'node:sqlite';
import {dirname} from 'node:path';
import {existsSync, mkdirSync, unlinkSync} from 'node:fs';
import {SCHEMA_SQL} from '@/db/schema';
import {createWorkersDatabase, WorkersDatabase} from '@/db/workers';
import {collections as mockCollections} from '@/mock/collections';
import {products as mockProducts} from '@/mock/products';
import {mockModels} from '@/mock/models';
import {getDefaultSiteSettings} from '@/lib/siteSettings';

let db: DatabaseSync | WorkersDatabase | null = null;

type DbHandle = DatabaseSync | WorkersDatabase;

export function getDb(): DbHandle {
  if (db) return db;

  try {
    const dbPath = process.env.TISSU_DB_PATH || `${process.cwd()}/data/tissu.db`;
    mkdirSync(dirname(dbPath), {recursive: true});

    const database = new DatabaseSync(dbPath);
    // Wait (instead of failing) when several processes open the same file at
    // once, e.g. Turbopack build workers collecting page data in parallel.
    database.exec('PRAGMA busy_timeout = 15000;');
    database.exec('PRAGMA foreign_keys = ON;');
    database.exec('PRAGMA journal_mode = WAL;');

    database.exec('BEGIN IMMEDIATE;');
    try {
      migrateSchema(database);
      database.exec(SCHEMA_SQL);
      seedIfEmpty(database);
      backfillInquiryCounts(database);
      database.exec('COMMIT;');
    } catch (error) {
      try {
        database.exec('ROLLBACK;');
      } catch {
        // ignore rollback failures (e.g. no active transaction)
      }
      database.close();
      throw error;
    }

    db = database;
    return db;
  } catch (error) {
    // Workers runtime: neither `fs` nor `node:sqlite` are real. Fall back to
    // the in-memory database seeded from mock data so every request no longer
    // 500s. Keep the error visible for local debugging but do not rethrow.
    if (!(error instanceof Error && (error.message.includes('not implemented') || error.message.includes('no such module')))) {
      console.error('[db] file-based sqlite unavailable, using in-memory fallback:', error instanceof Error ? error.message : error);
    }
    const database = createWorkersDatabase();
    try {
      migrateSchema(database);
      database.exec(SCHEMA_SQL);
      seedIfEmpty(database);
      backfillInquiryCounts(database);
    } catch (seedError) {
      console.error('[db] failed to initialise in-memory database:', seedError instanceof Error ? seedError.message : seedError);
    }
    db = database;
    return db;
  }
}

/** Closes the singleton connection (used by tests during teardown). */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/** Recreates the local database from scratch and re-seeds it from mock data. */
export function resetDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
  try {
    const dbPath = process.env.TISSU_DB_PATH || `${process.cwd()}/data/tissu.db`;
    if (existsSync(/* turbopackIgnore: true */ dbPath)) {
      unlinkSync(/* turbopackIgnore: true */ dbPath);
    }
  } catch {
    // filesystem unavailable (Workers runtime)
  }
  getDb();
}

/**
 * Brings databases created before the `category` -> `collection` rename up to
 * date. Must run before SCHEMA_SQL, because the schema's index on
 * `collection_slug` would otherwise reference a column that does not exist yet.
 */
function migrateSchema(database: DbHandle) {
  const columns = database.prepare('PRAGMA table_info(products)').all() as {name: string}[];
  const names = new Set(columns.map((column) => column.name));

  if (names.has('category_slug') && !names.has('collection_slug')) {
    database.exec('ALTER TABLE products RENAME COLUMN category_slug TO collection_slug;');
  }

  database.exec('DROP INDEX IF EXISTS idx_products_category;');

  // The in-memory Workers fallback starts fresh from mock data every boot and
  // only mirrors the closed set of statements issued by the store, so schema
  // reshaping is a no-op there.
  if (database instanceof WorkersDatabase) return;

  migrateModelsToJunction(database);
  migrateProductsToJunction(database);
}

type ProductRowForMigration = {
  id: string;
  collection_slug: string;
};

/**
 * One-time migration from the old (products.collection_slug, one collection
 * per product) design to the many-to-many junction-table design. Moves every
 * product's single collection link into product_collections, then drops the
 * now-unused column so new rows insert without it.
 */
function migrateProductsToJunction(database: Exclude<DbHandle, WorkersDatabase>) {
  const columns = database.prepare('PRAGMA table_info(products)').all() as {name: string}[];
  if (!columns.some((column) => column.name === 'collection_slug')) return;

  database.exec('DROP INDEX IF EXISTS idx_products_collection;');

  database.exec(`
    CREATE TABLE IF NOT EXISTS product_collections (
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      collection_slug TEXT NOT NULL REFERENCES collections(slug) ON DELETE CASCADE,
      PRIMARY KEY (product_id, collection_slug)
    );
  `);

  const leftovers = database
    .prepare('SELECT id, collection_slug FROM products')
    .all() as ProductRowForMigration[];
  for (const row of leftovers) {
    if (row.collection_slug && row.collection_slug !== '') {
      database
        .prepare('INSERT OR IGNORE INTO product_collections (product_id, collection_slug) VALUES (?, ?)')
        .run(row.id, row.collection_slug);
    }
  }

  database.exec('ALTER TABLE products DROP COLUMN collection_slug;');
}

type ModelRow = {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  collection_slug?: string;
};

/**
 * One-time migration from the old (models.collection_slug, UNIQUE(slug,
 * collection_slug)) design to the junction-table design. Old databases may
 * hold several rows for the same model (e.g. `soie-caftan` + `soie-tekchita`):
 * deduplicate by slug keeping the first row, then recreate the table and link
 * every (model, collection) pair through model_collections.
 */
function migrateModelsToJunction(database: Exclude<DbHandle, WorkersDatabase>) {
  const columns = database.prepare('PRAGMA table_info(models)').all() as {name: string}[];
  if (!columns.some((column) => column.name === 'collection_slug')) return;

  const oldRows = database.prepare('SELECT * FROM models').all() as ModelRow[];
  if (oldRows.length === 0) {
    // No rows to preserve: drop the old-shaped table and let SCHEMA_SQL
    // recreate both models and model_collections in the new shape.
    database.exec('DROP TABLE IF EXISTS models;');
    return;
  }

  const canonicalBySlug = new Map<string, ModelRow>();
  for (const row of oldRows) {
    if (!canonicalBySlug.has(row.slug)) canonicalBySlug.set(row.slug, row);
  }

  database.exec('ALTER TABLE models RENAME TO models_old_v2;');
  database.exec(`
    CREATE TABLE models (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name_fr TEXT NOT NULL DEFAULT '',
      name_ar TEXT NOT NULL DEFAULT '',
      name_en TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS model_collections (
      model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
      collection_slug TEXT NOT NULL REFERENCES collections(slug) ON DELETE CASCADE,
      PRIMARY KEY (model_id, collection_slug)
    );
    CREATE INDEX IF NOT EXISTS idx_model_collections_collection ON model_collections(collection_slug);
  `);

  const insertModel = database.prepare(
    'INSERT INTO models (id, slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?)'
  );
  const insertLink = database.prepare(
    'INSERT OR IGNORE INTO model_collections (model_id, collection_slug) VALUES (?, ?)'
  );
  for (const [slug, row] of canonicalBySlug) {
    insertModel.run(row.id, slug, row.name_fr, row.name_ar, row.name_en);
  }
  for (const row of oldRows) {
    const canonical = canonicalBySlug.get(row.slug)!;
    insertLink.run(canonical.id, row.collection_slug);
  }

  database.exec('DROP TABLE models_old_v2;');
}

function seedIfEmpty(database: DbHandle) {
  const {count} = database.prepare('SELECT COUNT(*) AS count FROM collections').get() as {count: number};
  if (count > 0) return;
  seedDatabase(database);
}

/**
 * One-time migration: materialise `inquiry_counts` from the raw rows that
 * existed before the counter table was introduced. Idempotent — after the
 * first successful run, `inquiry_counts` is non-empty and the `WHERE`
 * guard skips it entirely (new rows keep the counter authoritative).
 */
function backfillInquiryCounts(database: DbHandle) {
  const {count} = database.prepare('SELECT COUNT(*) AS count FROM inquiry_counts').get() as {count: number};
  if (count > 0) return;
  database
    .prepare(
      `INSERT INTO inquiry_counts (reference, n, updated_at)
       SELECT reference, COUNT(*) AS n, MAX(created_at) FROM inquiries GROUP BY reference`
    )
    .run();
}

function seedDatabase(database: DbHandle) {
  const now = Date.now();

  const insertCollection = database.prepare(
    `INSERT INTO collections (id, slug, name_fr, name_ar, name_en, description_fr, description_ar, description_en, image, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  mockCollections.forEach((cat, index) => {
    insertCollection.run(
      cat.id,
      cat.slug,
      cat.name.fr,
      cat.name.ar,
      cat.name.en,
      cat.description.fr,
      cat.description.ar,
      cat.description.en,
      cat.image,
      index,
      new Date(now - (mockCollections.length - index) * 1000).toISOString()
    );
  });

  const insertProduct = database.prepare(
    `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, description_fr, description_ar, description_en, material_fr, material_ar, material_en, material_slug, width, price, in_stock, featured, is_new, characteristics_fr, characteristics_ar, characteristics_en, images, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertProductCollection = database.prepare(
    `INSERT INTO product_collections (product_id, collection_slug) VALUES (?, ?)`
  );
  const insertVariant = database.prepare(
    `INSERT INTO product_variants (id, product_id, color_fr, color_ar, color_en, color_hex, sku, price, in_stock, sort_order, images)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  mockProducts.forEach((product, index) => {
    const created = new Date(now - (mockProducts.length - index) * 60000).toISOString();
    insertProduct.run(
      product.id,
      product.slug,
      product.reference,
      product.name.fr,
      product.name.ar,
      product.name.en,
      product.description.fr,
      product.description.ar,
      product.description.en,
      product.material.fr,
      product.material.ar,
      product.material.en,
      product.materialSlug,
      product.width ?? '',
      product.price,
      product.inStock ? 1 : 0,
      product.featured ? 1 : 0,
      product.isNew ? 1 : 0,
      JSON.stringify(product.characteristics?.fr ?? []),
      JSON.stringify(product.characteristics?.ar ?? []),
      JSON.stringify(product.characteristics?.en ?? []),
      JSON.stringify(product.images ?? []),
      created,
      created
    );
    (product.collections ?? []).forEach((collection) => {
      insertProductCollection.run(product.id, collection.slug);
    });
    product.variants.forEach((variant, vIndex) => {
      insertVariant.run(
        variant.id,
        product.id,
        variant.color.fr,
        variant.color.ar,
        variant.color.en,
        variant.colorHex ?? '',
        variant.sku ?? '',
        variant.price,
        variant.inStock ? 1 : 0,
        vIndex,
        JSON.stringify(variant.images ?? [])
      );
    });
  });

  const insertModel = database.prepare(
    `INSERT INTO models (id, slug, name_fr, name_ar, name_en)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertModelCollection = database.prepare(
    `INSERT INTO model_collections (model_id, collection_slug) VALUES (?, ?)`
  );
  mockModels.forEach((model) => {
    insertModel.run(
      model.id,
      model.slug,
      model.name.fr,
      model.name.ar,
      model.name.en
    );
    model.collectionSlugs.forEach((collectionSlug) => {
      insertModelCollection.run(model.id, collectionSlug);
    });
  });

  database
    .prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)')
    .run('site', JSON.stringify(getDefaultSiteSettings()));
}