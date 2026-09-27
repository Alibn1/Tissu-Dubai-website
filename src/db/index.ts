import {DatabaseSync} from 'node:sqlite';
import {dirname} from 'node:path';
import {existsSync, mkdirSync, unlinkSync} from 'node:fs';
import {SCHEMA_SQL} from '@/db/schema';
import {collections as mockCollections} from '@/mock/collections';
import {products as mockProducts} from '@/mock/products';
import {mockModels} from '@/mock/models';
import {getDefaultSiteSettings} from '@/lib/siteSettings';

// The data layer exposes one async interface with two backends:
//
//   D1  - the Workers runtime, and production
//   node:sqlite - local development, the build step and the test suite
//
// node:sqlite is preferred when it works because it is a local file with no
// network involved, so development and tests stay fast and keep working on a
// database that can be inspected. On Workers neither `fs` nor `node:sqlite`
// exist, so opening the file throws and every call goes to the D1 binding
// instead. That is the whole selection mechanism: there is no mock database and
// no silent fallback, so a write can no longer disappear into throwaway memory.
//
// Set TISSU_FORCE_D1=1 to exercise the D1 path locally.

type D1Statement = {
  bind(...params: unknown[]): {
    all<T = Record<string, unknown>>(): Promise<{results?: T[]}>;
    first<T = Record<string, unknown>>(): Promise<T | null>;
    run(): Promise<{meta?: {changes?: number}}>;
  };
};

type D1BatchStatement = {
  run(): Promise<{meta?: {changes?: number}}>;
};

type D1Like = {
  prepare(sql: string): D1Statement;
  batch(statements: D1BatchStatement[]): Promise<unknown>;
};

let sqlite: DatabaseSync | null = null;
let sqliteUnavailable = false;
let warnedAboutSqlite = false;

function shouldForceD1(): boolean {
  return process.env.TISSU_FORCE_D1 === '1';
}

/**
 * Opens the local SQLite file, migrating and seeding it on first use. Returns
 * null when the runtime has no filesystem or no node:sqlite, which is the
 * signal to use D1 instead.
 */
function getSqlite(): DatabaseSync | null {
  if (sqlite) return sqlite;
  if (sqliteUnavailable || shouldForceD1()) return null;

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
      ensureDefaultCollections(database);
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

    sqlite = database;
    return sqlite;
  } catch (error) {
    sqliteUnavailable = true;
    if (!warnedAboutSqlite) {
      warnedAboutSqlite = true;
      const message = error instanceof Error ? error.message : String(error);
      // The Workers runtime reports these as unsupported modules; anything else
      // is worth seeing while developing.
      if (!message.includes('not implemented') && !message.includes('no such module')) {
        console.error('[db] local sqlite unavailable, using D1:', message);
      }
    }
    return null;
  }
}

async function getD1(): Promise<D1Like> {
  const {getCloudflareContext} = await import('@opennextjs/cloudflare');
  const {env} = await getCloudflareContext({async: true});
  const binding = (env as {DB?: D1Like}).DB;
  if (!binding) {
    throw new Error('[db] the D1 binding "DB" is not available. Check d1_databases in wrangler.jsonc.');
  }
  return binding;
}

/**
 * Neither backend can bind a boolean or an undefined: D1 rejects them and
 * node:sqlite throws "Provided value cannot be bound". Converting to the
 * smallest common representation here means callers can pass ordinary
 * JavaScript values and both backends stay interchangeable.
 */
function normalizeParams(params: unknown[]): unknown[] {
  return params.map((value) => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  });
}

async function backend(): Promise<DatabaseSync | 'd1'> {
  return getSqlite() ?? 'd1';
}

/** Runs a SELECT and returns every row. */
export async function dbAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const bound = normalizeParams(params);
  const local = getSqlite();
  if (local) return local.prepare(sql).all(...bound) as T[];

  const d1 = await getD1();
  const {results} = await d1.prepare(sql).bind(...bound).all<T>();
  return results ?? [];
}

/** Runs a SELECT and returns the first row, or null when there is none. */
export async function dbFirst<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  const bound = normalizeParams(params);
  const local = getSqlite();
  if (local) return (local.prepare(sql).get(...bound) as T | undefined) ?? null;

  const d1 = await getD1();
  return await d1.prepare(sql).bind(...bound).first<T>();
}

/** Runs an INSERT/UPDATE/DELETE and returns the number of affected rows. */
export async function dbRun(sql: string, params: unknown[] = []): Promise<number> {
  const bound = normalizeParams(params);
  const local = getSqlite();
  if (local) return Number(local.prepare(sql).run(...bound).changes);

  const d1 = await getD1();
  const result = await d1.prepare(sql).bind(...bound).run();
  return Number(result?.meta?.changes ?? 0);
}

/** One statement in a dbBatch() call. */
export type BatchStatement = {sql: string; params?: unknown[]};

/**
 * Runs several statements as one unit of work.
 *
 * Saving the site settings writes a dozen or so rows, and on D1 every statement
 * is a separate round trip to the edge, which is slow enough to matter. D1's
 * batch() sends them in a single request inside a transaction; local node:sqlite
 * gets an explicit transaction for the same all-or-nothing behaviour.
 */
export async function dbBatch(statements: BatchStatement[]): Promise<number> {
  if (statements.length === 0) return 0;

  const prepared = statements.map((statement) => ({
    sql: statement.sql,
    params: normalizeParams(statement.params ?? [])
  }));

  const local = getSqlite();
  if (local) {
    let changes = 0;
    local.exec('BEGIN IMMEDIATE;');
    try {
      for (const statement of prepared) {
        changes += Number(local.prepare(statement.sql).run(...statement.params).changes);
      }
      local.exec('COMMIT;');
      return changes;
    } catch (error) {
      local.exec('ROLLBACK;');
      throw error;
    }
  }

  const d1 = await getD1();
  const results = await d1.batch(
    prepared.map((statement) => d1.prepare(statement.sql).bind(...statement.params))
  );
  const list = (results ?? []) as Array<{meta?: {changes?: number}}>;
  return list.reduce((total, result) => total + Number(result?.meta?.changes ?? 0), 0);
}

/** True when reads and writes are going to the D1 binding. */
export async function isUsingD1(): Promise<boolean> {
  return (await backend()) === 'd1';
}

/**
 * Direct access to the local SQLite handle. Only valid on a runtime that has
 * one, so the migration tests can inspect PRAGMA output; the application code
 * goes through dbAll/dbFirst/dbRun instead.
 */
export function getDb(): DatabaseSync {
  const local = getSqlite();
  if (!local) {
    throw new Error('[db] no local sqlite handle on this runtime. Use dbAll/dbFirst/dbRun.');
  }
  return local;
}

/** Closes the local connection (used by tests during teardown). */
export function closeDb(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
}

/** Recreates the local database from scratch and re-seeds it from mock data. */
export function resetDatabase(): void {
  closeDb();
  try {
    const dbPath = process.env.TISSU_DB_PATH || `${process.cwd()}/data/tissu.db`;
    if (existsSync(/* turbopackIgnore: true */ dbPath)) {
      unlinkSync(/* turbopackIgnore: true */ dbPath);
    }
  } catch {
    // filesystem unavailable
  }
  getSqlite();
}

/**
 * Brings databases created before the `category` -> `collection` rename up to
 * date. Must run before SCHEMA_SQL, because the schema's index on
 * `collection_slug` would otherwise reference a column that does not exist yet.
 *
 * D1 does not need any of this: its schema is created by
 * migrations/0001_init.sql rather than at runtime.
 */
function migrateSchema(database: DatabaseSync) {
  const columns = database.prepare('PRAGMA table_info(products)').all() as {name: string}[];
  const names = new Set(columns.map((column) => column.name));

  if (names.has('category_slug') && !names.has('collection_slug')) {
    database.exec('ALTER TABLE products RENAME COLUMN category_slug TO collection_slug;');
  }

  database.exec('DROP INDEX IF EXISTS idx_products_category;');

  // A fresh database has no `products` table yet (SCHEMA_SQL creates it right
  // after this), so only widen tables that already exist.
  if (names.size > 0) addMissingProductColumns(database, names);

  migrateModelsToJunction(database);
  migrateProductsToJunction(database);
}

/** Columns added to `products` after the table was first shipped. */
const ADDED_PRODUCT_COLUMNS: Record<string, string> = {
  width: "ALTER TABLE products ADD COLUMN width TEXT NOT NULL DEFAULT ''",
  is_new: 'ALTER TABLE products ADD COLUMN is_new INTEGER NOT NULL DEFAULT 0',
  seo_fr: "ALTER TABLE products ADD COLUMN seo_fr TEXT NOT NULL DEFAULT '{}'",
  seo_ar: "ALTER TABLE products ADD COLUMN seo_ar TEXT NOT NULL DEFAULT '{}'",
  seo_en: "ALTER TABLE products ADD COLUMN seo_en TEXT NOT NULL DEFAULT '{}'",
};

function addMissingProductColumns(database: DatabaseSync, existing: Set<string>) {
  for (const [column, statement] of Object.entries(ADDED_PRODUCT_COLUMNS)) {
    if (existing.has(column)) continue;
    database.exec(statement);
  }
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
function migrateProductsToJunction(database: DatabaseSync) {
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
function migrateModelsToJunction(database: DatabaseSync) {
  const columns = database.prepare('PRAGMA table_info(models)').all() as {name: string}[];
  if (!columns.some((column) => column.name === 'collection_slug')) return;

  const oldRows = database.prepare('SELECT * FROM models').all() as ModelRow[];
  if (oldRows.length === 0) {
    // No rows to preserve: drop the old-shaped table and let SCHEMA_SQL
    // recreate both models and model_collections in the new shape.
    database.exec('DROP TABLE models;');
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

function seedIfEmpty(database: DatabaseSync) {
  const {count} = database.prepare('SELECT COUNT(*) AS count FROM collections').get() as {count: number};
  if (count > 0) return;
  seedDatabase(database);
}

type CollectionSeedRow = {
  slug: string;
};

/**
 * Idempotently adds any default collection missing from an existing database
 * (e.g. `homme` created after the initial seed).
 */
function ensureDefaultCollections(database: DatabaseSync) {
  const rows = database.prepare('SELECT slug FROM collections').all() as CollectionSeedRow[];
  const existing = new Set(rows.map((row) => row.slug));

  const insertCollection = database.prepare(
    `INSERT INTO collections (id, slug, name_fr, name_ar, name_en, description_fr, description_ar, description_en, image, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       name_fr = excluded.name_fr,
       name_ar = excluded.name_ar,
       name_en = excluded.name_en,
       description_fr = excluded.description_fr,
       description_ar = excluded.description_ar,
       description_en = excluded.description_en,
       image = excluded.image`
  );

  mockCollections.forEach((cat, index) => {
    if (existing.has(cat.slug)) return;
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
      new Date().toISOString()
    );
  });
}

function seedDatabase(database: DatabaseSync) {
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
    `INSERT INTO model_collections (model_id, collection_slug)
     VALUES (?, ?)`
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
