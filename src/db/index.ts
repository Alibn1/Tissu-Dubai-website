import {DatabaseSync} from 'node:sqlite';
import {dirname} from 'node:path';
import {existsSync, mkdirSync, unlinkSync} from 'node:fs';
import {SCHEMA_SQL} from '@/db/schema';
import {createWorkersDatabase, type WorkersDatabase} from '@/db/workers';
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
}

function seedIfEmpty(database: DbHandle) {
  const {count} = database.prepare('SELECT COUNT(*) AS count FROM collections').get() as {count: number};
  if (count > 0) return;
  seedDatabase(database);
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
    `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, description_fr, description_ar, description_en, material_fr, material_ar, material_en, material_slug, width, price, in_stock, featured, is_new, collection_slug, characteristics_fr, characteristics_ar, characteristics_en, images, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      product.collection.slug,
      JSON.stringify(product.characteristics?.fr ?? []),
      JSON.stringify(product.characteristics?.ar ?? []),
      JSON.stringify(product.characteristics?.en ?? []),
      JSON.stringify(product.images ?? []),
      created,
      created
    );
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
    `INSERT INTO models (id, slug, collection_slug, name_fr, name_ar, name_en)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  mockModels.forEach((model) => {
    insertModel.run(
      model.id,
      model.slug,
      model.collectionSlug,
      model.name.fr,
      model.name.ar,
      model.name.en
    );
  });

  database
    .prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)')
    .run('site', JSON.stringify(getDefaultSiteSettings()));
}