import {DatabaseSync} from 'node:sqlite';
import {dirname} from 'node:path';
import {existsSync, mkdirSync, unlinkSync} from 'node:fs';
import {SCHEMA_SQL} from '@/db/schema';
import {categories as mockCategories} from '@/mock/categories';
import {products as mockProducts} from '@/mock/products';
import {mockModels} from '@/mock/models';
import {getDefaultSiteSettings} from '@/lib/siteSettings';

const DEFAULT_DB_PATH = `${process.cwd()}/data/tissu.db`;

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  const dbPath = process.env.TISSU_DB_PATH || DEFAULT_DB_PATH;
  mkdirSync(dirname(dbPath), {recursive: true});

  const database = new DatabaseSync(dbPath);
  // Wait (instead of failing) when several processes open the same file at
  // once, e.g. Turbopack build workers collecting page data in parallel.
  database.exec('PRAGMA busy_timeout = 15000;');
  database.exec('PRAGMA foreign_keys = ON;');
  database.exec('PRAGMA journal_mode = WAL;');

  database.exec('BEGIN IMMEDIATE;');
  try {
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
  const dbPath = process.env.TISSU_DB_PATH || DEFAULT_DB_PATH;
  if (db) {
    db.close();
    db = null;
  }
  if (existsSync(/* turbopackIgnore: true */ dbPath)) {
    unlinkSync(/* turbopackIgnore: true */ dbPath);
  }
  getDb();
}

function seedIfEmpty(database: DatabaseSync) {
  const {count} = database.prepare('SELECT COUNT(*) AS count FROM collections').get() as {count: number};
  if (count > 0) return;
  seedDatabase(database);
}

function seedDatabase(database: DatabaseSync) {
  const now = Date.now();

  const insertCollection = database.prepare(
    `INSERT INTO collections (id, slug, name_fr, name_ar, name_en, description_fr, description_ar, description_en, image, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  mockCategories.forEach((cat, index) => {
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
      new Date(now - (mockCategories.length - index) * 1000).toISOString()
    );
  });

  const insertProduct = database.prepare(
    `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, description_fr, description_ar, description_en, material_fr, material_ar, material_en, material_slug, width, price, in_stock, featured, is_new, category_slug, characteristics_fr, characteristics_ar, characteristics_en, images, created_at, updated_at)
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
      product.category.slug,
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