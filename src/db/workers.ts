/**
 * In-memory fallback database for the Workers runtime.
 *
 * Cloudflare Workers has no real `node:sqlite` nor a filesystem: unenv stubs
 * both, so `new DatabaseSync(path)` / `fs.mkdirSync` throw. This module
 * provides a DatabaseSync-compatible surface (the subset used by
 * src/db/index.ts and src/lib/data/store.ts) backed by in-memory tables, so
 * `getDb()` can fall back gracefully and the site still serves the seeded
 * mock catalog instead of 500ing on every request.
 *
 * It intentionally implements only the (closed) set of statements the code
 * base issues. If a new query shows up on Workers, getDb() throws a clear
 * "unsupported query" error naming the SQL so it can be added here.
 */

export type WorkersRow = Record<string, unknown>;

type CollectionsRow = {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  description_fr: string;
  description_ar: string;
  description_en: string;
  image: string;
  sort_order: number;
  created_at: string;
};

type ProductsRow = {
  id: string;
  slug: string;
  reference: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  description_fr: string;
  description_ar: string;
  description_en: string;
  material_fr: string;
  material_ar: string;
  material_en: string;
  material_slug: string;
  width: string;
  price: number | null;
  in_stock: number;
  featured: number;
  is_new: number;
  collection_slug: string;
  characteristics_fr: string;
  characteristics_ar: string;
  characteristics_en: string;
  images: string;
  created_at: string;
  updated_at: string;
};

type VariantsRow = {
  id: string;
  product_id: string;
  color_fr: string;
  color_ar: string;
  color_en: string;
  color_hex: string;
  sku: string;
  price: number | null;
  in_stock: number;
  sort_order: number;
  images: string;
};

type ModelsRow = {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
};

type ModelCollectionsRow = {
  model_id: string;
  collection_slug: string;
};

type SiteSettingsRow = {key: string; value: string};

type InquiriesRow = {
  id: string;
  product_name: string;
  reference: string;
  color: string;
  quantity: number;
  locale: string;
  read: number;
  created_at: string;
};

type InquiryCountsRow = {
  reference: string;
  n: number;
  updated_at: string | null;
};

interface Tables {
  collections: CollectionsRow[];
  products: ProductsRow[];
  product_variants: VariantsRow[];
  models: ModelsRow[];
  model_collections: ModelCollectionsRow[];
  site_settings: SiteSettingsRow[];
  inquiries: InquiriesRow[];
  inquiry_counts: InquiryCountsRow[];
}

const PRODUCT_COLUMNS = [
  'id',
  'slug',
  'reference',
  'name_fr',
  'name_ar',
  'name_en',
  'description_fr',
  'description_ar',
  'description_en',
  'material_fr',
  'material_ar',
  'material_en',
  'material_slug',
  'width',
  'price',
  'in_stock',
  'featured',
  'is_new',
  'collection_slug',
  'characteristics_fr',
  'characteristics_ar',
  'characteristics_en',
  'images',
  'created_at',
  'updated_at',
] as const;

// Base of the PRODUCT_SELECT query in src/lib/data/store.ts.
const PRODUCT_SELECT_BASE =
  'select p.*, c.id as col_id, c.slug as col_slug, c.name_fr as col_name_fr, c.name_ar as col_name_ar, c.name_en as col_name_en, c.description_fr as col_desc_fr, c.description_ar as col_desc_ar, c.description_en as col_desc_en, c.image as col_image from products p join collections c on c.slug = p.collection_slug';

// Base of the collections query in src/lib/data/store.ts.
const COLLECTIONS_BASE =
  'select *, (select count(*) from products p where p.collection_slug = collections.slug) as product_count from collections';

const SELECT_PRODUCT_STATEMENTS: Array<{suffix: string; run: (db: WorkersDatabase, params: unknown[]) => unknown}> = [
  {suffix: ' order by p.created_at desc, p.slug', run: (db) => db.selectAllProducts()},
  {suffix: ' where p.id = ?', run: (db, params) => db.selectProductWhere({id: String(params[0])})},
  {suffix: ' where p.slug = ? and p.collection_slug = ?', run: (db, params) => db.selectProductWhere({slug: String(params[0]), collectionSlug: String(params[1])})},
  {suffix: ' where p.slug = ?', run: (db, params) => db.selectProductWhere({slug: String(params[0])})},
];

const SELECT_COLLECTIONS_STATEMENTS: Array<{suffix: string; run: (db: WorkersDatabase, params: unknown[]) => unknown}> = [
  {suffix: ' order by sort_order', run: (db) => db.selectAllCollections()},
  {suffix: ' order by sort_order where slug = ?', run: (db, params) => db.selectCollectionBySlug(String(params[0]))},
];

function normalize(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

export class WorkersDatabase {
  private tables: Tables = {
    collections: [],
    products: [],
    product_variants: [],
    models: [],
    model_collections: [],
    site_settings: [],
    inquiries: [],
    inquiry_counts: [],
  };

  exec(sql: string): void {
    const statements = sql
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    for (const statement of statements) {
      const cleaned = statement
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
      const lower = cleaned.toLowerCase();
      if (
        lower.startsWith('pragma ') ||
        lower.startsWith('begin') ||
        lower.startsWith('commit') ||
        lower.startsWith('rollback') ||
        lower.startsWith('create ') ||
        lower.startsWith('alter ') ||
        lower.startsWith('drop ')
      ) {
        continue;
      }
      throw new Error(`[workers-db] unsupported exec statement: ${cleaned}`);
    }
  }

  close(): void {
    // no-op
  }

  prepare = (sql: string): {all: (...params: unknown[]) => WorkersRow[]; get: (...params: unknown[]) => WorkersRow | undefined; run: (...params: unknown[]) => {changes: number}} => {
    const normalized = normalize(sql);

    if (normalized === 'pragma table_info(products)') {
      return {
        all: () => PRODUCT_COLUMNS.map((name) => ({name})),
        get: () => undefined,
        run: () => ({changes: 0}),
      };
    }

    if (normalized === 'select count(*) as count from collections') {
      return {
        all: () => [],
        get: () => ({count: this.tables.collections.length}),
        run: () => ({changes: 0}),
      };
    }

    if (normalized === 'select count(*) as count from inquiry_counts') {
      return {
        all: () => [],
        get: () => ({count: this.tables.inquiry_counts.length}),
        run: () => ({changes: 0}),
      };
    }

    if (normalized === 'select * from product_variants order by sort_order') {
      return {
        all: () => [...this.tables.product_variants] as WorkersRow[],
        get: () => undefined,
        run: () => ({changes: 0}),
      };
    }

    if (normalized === 'select collection_slug, count(*) as n from products group by collection_slug') {
      const counts = new Map<string, number>();
      for (const product of this.tables.products) counts.set(product.collection_slug, (counts.get(product.collection_slug) ?? 0) + 1);
      const rows = Array.from(counts, ([collection_slug, n]) => ({collection_slug, n}));
      return {all: () => rows, get: () => undefined, run: () => ({changes: 0})};
    }

    if (normalized === 'select reference, count(*) as n from inquiries group by reference') {
      const counts = new Map<string, number>();
      for (const inquiry of this.tables.inquiries) counts.set(inquiry.reference, (counts.get(inquiry.reference) ?? 0) + 1);
      const rows = Array.from(counts, ([reference, n]) => ({reference, n}));
      return {all: () => rows, get: () => undefined, run: () => ({changes: 0})};
    }

    if (normalized === 'select * from models order by name_fr') {
      const rows = [...this.tables.models].sort((a, b) => a.name_fr.localeCompare(b.name_fr));
      return {all: () => rows as WorkersRow[], get: () => undefined, run: () => ({changes: 0})};
    }

    if (normalized === 'select * from model_collections') {
      return {all: () => [...this.tables.model_collections] as WorkersRow[], get: () => undefined, run: () => ({changes: 0})};
    }

    if (normalized === 'insert into inquiry_counts (reference, n, updated_at) select reference, count(*) as n, max(created_at) from inquiries group by reference') {
      return {
        all: () => [],
        get: () => undefined,
        run: () => {
          const counts = new Map<string, {n: number; updatedAt: string | null}>();
          for (const inquiry of this.tables.inquiries) {
            const current = counts.get(inquiry.reference) ?? {n: 0, updatedAt: null};
            current.n += 1;
            if (!current.updatedAt || inquiry.created_at > current.updatedAt) current.updatedAt = inquiry.created_at;
            counts.set(inquiry.reference, current);
          }
          for (const [reference, {n, updatedAt}] of counts) {
            const existing = this.tables.inquiry_counts.find((entry) => entry.reference === reference);
            if (existing) existing.n = n;
            else this.tables.inquiry_counts.push({reference, n, updated_at: updatedAt});
          }
          return {changes: counts.size};
        },
      };
    }

    if (normalized === 'select * from inquiries order by created_at desc') {
      const rows = [...this.tables.inquiries].sort((a, b) => b.created_at.localeCompare(a.created_at));
      return {all: () => rows as WorkersRow[], get: () => undefined, run: () => ({changes: 0})};
    }

    if (normalized === 'select reference, n from inquiry_counts') {
      const rows = [...this.tables.inquiry_counts];
      return {all: () => rows as WorkersRow[], get: () => undefined, run: () => ({changes: 0})};
    }

    if (normalized === 'select value from site_settings where key = ?') {
      return {
        all: () => [],
        get: (...params) => {
          const row = this.tables.site_settings.find((entry) => entry.key === String(params[0]));
          return row ? {value: row.value} : undefined;
        },
        run: () => ({changes: 0}),
      };
    }

    if (normalized === PRODUCT_SELECT_BASE) {
      return {all: () => this.selectAllProducts() as WorkersRow[], get: () => undefined, run: () => ({changes: 0})};
    }
    for (const candidate of SELECT_PRODUCT_STATEMENTS) {
      if (normalized === PRODUCT_SELECT_BASE + candidate.suffix) {
        return {
          all: () => (candidate.run(this, []) ?? []) as WorkersRow[],
          get: (...params) => (candidate.run(this, params) ?? undefined) as WorkersRow | undefined,
          run: () => ({changes: 0}),
        };
      }
    }

    for (const candidate of SELECT_COLLECTIONS_STATEMENTS) {
      if (normalized === COLLECTIONS_BASE + candidate.suffix) {
        return {
          all: () => (candidate.run(this, []) ?? []) as WorkersRow[],
          get: (...params) => (candidate.run(this, params) ?? undefined) as WorkersRow | undefined,
          run: () => ({changes: 0}),
        };
      }
    }

    if (normalized === 'delete from product_variants where product_id = ?') {
      return {
        all: () => [],
        get: () => undefined,
        run: (...params) => {
          const before = this.tables.product_variants.length;
          const target = String(params[0]);
          this.tables.product_variants = this.tables.product_variants.filter((variant) => variant.product_id !== target);
          return {changes: before - this.tables.product_variants.length};
        },
      };
    }

    if (normalized === 'delete from models where id = ?') {
      return {
        all: () => [],
        get: () => undefined,
        run: (...params) => {
          const target = String(params[0]);
          const before = this.tables.models.length;
          this.tables.models = this.tables.models.filter((model) => model.id !== target);
          this.tables.model_collections = this.tables.model_collections.filter((link) => link.model_id !== target);
          return {changes: before - this.tables.models.length};
        },
      };
    }

    if (normalized === 'delete from model_collections where model_id = ?') {
      return {
        all: () => [],
        get: () => undefined,
        run: (...params) => {
          const target = String(params[0]);
          const before = this.tables.model_collections.length;
          this.tables.model_collections = this.tables.model_collections.filter((link) => link.model_id !== target);
          return {changes: before - this.tables.model_collections.length};
        },
      };
    }

    if (normalized === 'delete from products where id = ?') {
      return {
        all: () => [],
        get: () => undefined,
        run: (...params) => {
          const target = String(params[0]);
          const before = this.tables.products.length;
          this.tables.products = this.tables.products.filter((product) => product.id !== target);
          this.tables.product_variants = this.tables.product_variants.filter((variant) => variant.product_id !== target);
          return {changes: before - this.tables.products.length};
        },
      };
    }

    if (normalized === 'update inquiries set read = 1 where id = ?') {
      return {
        all: () => [],
        get: () => undefined,
        run: (...params) => {
          const target = String(params[0]);
          const row = this.tables.inquiries.find((inquiry) => inquiry.id === target);
          if (row) row.read = 1;
          return {changes: row ? 1 : 0};
        },
      };
    }

    if (normalized === 'insert into inquiry_counts (reference, n, updated_at) values (?, 1, ?) on conflict(reference) do update set n = n + 1, updated_at = excluded.updated_at') {
      return {
        all: () => [],
        get: () => undefined,
        run: (...params) => {
          const reference = String(params[0]);
          const updatedAt = String(params[1] ?? null);
          const row = this.tables.inquiry_counts.find((entry) => entry.reference === reference);
          if (row) {
            row.n += 1;
            row.updated_at = updatedAt;
          } else {
            this.tables.inquiry_counts.push({reference, n: 1, updated_at: updatedAt});
          }
          return {changes: 1};
        },
      };
    }

    if (normalized === 'delete from inquiries where julianday(created_at) < julianday(\'now\', ?)') {
      return {
        all: () => [],
        get: () => undefined,
        run: (...params) => {
          const modifier = String(params[0] ?? '');
          const match = /-(\d+)\s*days?/.exec(modifier);
          const days = match ? Number(match[1]) : 0;
          const cutoff = days > 0 ? Date.now() - days * 86_400_000 : 0;
          const before = this.tables.inquiries.length;
          this.tables.inquiries = this.tables.inquiries.filter((inquiry) => new Date(inquiry.created_at).getTime() >= cutoff);
          return {changes: before - this.tables.inquiries.length};
        },
      };
    }

    if (normalized === 'delete from inquiries where id not in (select id from inquiries order by created_at desc limit ?)') {
      return {
        all: () => [],
        get: () => undefined,
        run: (...params) => {
          const maxRows = Math.max(0, Number(params[0] ?? 0));
          const sorted = [...this.tables.inquiries].sort((a, b) => b.created_at.localeCompare(a.created_at));
          const keep = new Set(sorted.slice(0, maxRows).map((inquiry) => inquiry.id));
          const before = this.tables.inquiries.length;
          this.tables.inquiries = this.tables.inquiries.filter((inquiry) => keep.has(inquiry.id));
          return {changes: before - this.tables.inquiries.length};
        },
      };
    }

    const insert = /^insert into ([a-z_]+) \(([^)]+)\) values \((.+)\)/.exec(normalized);
    if (insert) {
      const [, table, columnsSql] = insert;
      const columns = columnsSql.split(',').map((column) => column.trim()).filter((column) => column.length > 0);
      return {
        all: () => [],
        get: () => undefined,
        run: (...params) => {
          if (params.length !== columns.length) {
            throw new Error(`[workers-db] insert into ${table}: expected ${columns.length} params, got ${params.length}`);
          }
          const row = Object.fromEntries(columns.map((column, index) => [column, params[index]])) as Record<string, unknown> & {id?: string};
          switch (table) {
            case 'collections':
              this.upsertRow('collections', row as CollectionsRow);
              break;
            case 'products':
              this.upsertRow('products', row as ProductsRow);
              break;
            case 'product_variants':
              this.upsertRow('product_variants', row as VariantsRow);
              break;
            case 'models':
              this.upsertRow('models', row as ModelsRow);
              break;
            case 'model_collections':
              this.upsertLink(row as ModelCollectionsRow);
              break;
            case 'site_settings':
              this.upsertRow('site_settings', row as SiteSettingsRow);
              break;
            case 'inquiries':
              this.upsertRow('inquiries', row as InquiriesRow);
              break;
            default:
              throw new Error(`[workers-db] unsupported insert table: ${table}`);
          }
          return {changes: 1};
        },
      };
    }

    throw new Error(`[workers-db] unsupported query: ${sql}`);
  };

  upsertRow<K extends keyof Tables>(table: K, row: Tables[K][number]): void {
    const rows = this.tables[table] as Array<Tables[K][number] & {id?: string}>;
    if (table === 'site_settings') {
      const entries = rows as unknown as SiteSettingsRow[];
      const key = (row as unknown as SiteSettingsRow).key;
      const existing = entries.find((entry) => entry.key === key);
      if (existing) existing.value = (row as unknown as SiteSettingsRow).value;
      else entries.push(row as unknown as SiteSettingsRow);
      return;
    }
    if (table === 'models') {
      const entries = rows as ModelsRow[];
      const target = (row as ModelsRow).id;
      const index = entries.findIndex((entry) => entry.id === target);
      if (index >= 0) entries[index] = row as ModelsRow;
      else entries.push(row as ModelsRow);
      return;
    }
    const entries = rows;
    const index = entries.findIndex((entry) => entry.id === ((row as {id?: string}).id ?? ''));
    if (index >= 0) entries[index] = row;
    else entries.push(row);
  }

  upsertLink(link: ModelCollectionsRow): void {
    const existing = this.tables.model_collections.find(
      (entry) => entry.model_id === link.model_id && entry.collection_slug === link.collection_slug
    );
    if (!existing) this.tables.model_collections.push(link);
  }

  selectAllCollections(): WorkersRow[] {
    return [...this.tables.collections]
      .map((collection) => ({
        ...collection,
        product_count: this.tables.products.filter((product) => product.collection_slug === collection.slug).length,
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  selectCollectionBySlug(slug: string): WorkersRow | undefined {
    const collection = this.tables.collections.find((entry) => entry.slug === slug);
    if (!collection) return undefined;
    return {
      ...collection,
      product_count: this.tables.products.filter((product) => product.collection_slug === collection.slug).length,
    };
  }

  selectAllProducts(): WorkersRow[] {
    return this.tables.products
      .map((product) => this.joinCollection(product))
      .sort((a, b) => (String(b.created_at).localeCompare(String(a.created_at))) || String(a.slug).localeCompare(String(b.slug)));
  }

  selectProductWhere(where: {id?: string; slug?: string; collectionSlug?: string}): WorkersRow | undefined {
    const product = this.tables.products.find((entry) => {
      if (where.id !== undefined && entry.id !== where.id) return false;
      if (where.slug !== undefined && entry.slug !== where.slug) return false;
      if (where.collectionSlug !== undefined && entry.collection_slug !== where.collectionSlug) return false;
      return true;
    });
    return product ? this.joinCollection(product) : undefined;
  }

  private joinCollection(product: ProductsRow): WorkersRow {
    const collection = this.tables.collections.find((entry) => entry.slug === product.collection_slug);
    return {
      ...product,
      col_id: collection?.id ?? '',
      col_slug: collection?.slug ?? product.collection_slug,
      col_name_fr: collection?.name_fr ?? '',
      col_name_ar: collection?.name_ar ?? '',
      col_name_en: collection?.name_en ?? '',
      col_desc_fr: collection?.description_fr ?? '',
      col_desc_ar: collection?.description_ar ?? '',
      col_desc_en: collection?.description_en ?? '',
      col_image: collection?.image ?? '',
    };
  }
}

export function createWorkersDatabase(): WorkersDatabase {
  return new WorkersDatabase();
}