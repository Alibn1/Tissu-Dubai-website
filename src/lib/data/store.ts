import {dbAll, dbFirst, dbRun} from '@/db';
import type {
  Collection,
  Locale,
  Model,
  Product,
  ProductSeoByLanguage,
  ProductVariant,
} from '@/types';
import {normalizeSeo, parseSeoFields} from '@/lib/productSeo';
import {getDefaultSiteSettings, migrateSiteSettings, type SiteSettings} from '@/lib/siteSettings';

type Row = Record<string, unknown>;

// ── Small helpers ──

function parseJSON<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value === '') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function nowId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Row mappers ──

function mapCollectionRow(row: Row): Collection {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: {fr: String(row.name_fr ?? ''), ar: String(row.name_ar ?? ''), en: String(row.name_en ?? '')},
    description: {
      fr: String(row.description_fr ?? ''),
      ar: String(row.description_ar ?? ''),
      en: String(row.description_en ?? ''),
    },
    image: String(row.image ?? ''),
    productCount: Number(row.product_count ?? 0),
  };
}

function mapModelRow(row: Row, collectionSlugs: string[]): Model {
  return {
    id: String(row.id),
    slug: String(row.slug),
    collectionSlugs,
    name: {fr: String(row.name_fr ?? ''), ar: String(row.name_ar ?? ''), en: String(row.name_en ?? '')},
  };
}

function mapVariantRow(row: Row): ProductVariant {
  return {
    id: String(row.id),
    color: {fr: String(row.color_fr ?? ''), ar: String(row.color_ar ?? ''), en: String(row.color_en ?? '')},
    colorHex: String(row.color_hex ?? ''),
    sku: String(row.sku ?? ''),
    price: row.price == null ? null : Number(row.price),
    inStock: Boolean(row.in_stock),
    images: parseJSON<string[]>(row.images, []),
  };
}

function mapProductRow(
  row: Row,
  variants: ProductVariant[],
  collectionSlugs: string[],
  collectionCounts: Map<string, number>,
  collectionsBySlug: Map<string, Collection>
): Product {
  const collections: Collection[] = collectionSlugs.map((slug) => {
    const collection = collectionsBySlug.get(slug);
    return collection
      ? {...collection, productCount: collectionCounts.get(slug) ?? collection.productCount}
      : {
          id: '',
          slug,
          name: {fr: '', ar: '', en: ''},
          description: {fr: '', ar: '', en: ''},
          image: '',
          productCount: collectionCounts.get(slug) ?? 0,
        };
  });

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: {fr: String(row.name_fr ?? ''), ar: String(row.name_ar ?? ''), en: String(row.name_en ?? '')},
    reference: String(row.reference),
    description: {
      fr: String(row.description_fr ?? ''),
      ar: String(row.description_ar ?? ''),
      en: String(row.description_en ?? ''),
    },
    material: {fr: String(row.material_fr ?? ''), ar: String(row.material_ar ?? ''), en: String(row.material_en ?? '')},
    materialSlug: String(row.material_slug ?? ''),
    width: String(row.width ?? ''),
    price: row.price == null ? null : Number(row.price),
    inStock: Boolean(row.in_stock),
    collections,
    variants,
    featured: Boolean(row.featured),
    isNew: Boolean(row.is_new),
    images: parseJSON<string[]>(row.images, []),
    characteristics: {
      fr: parseJSON<string[]>(row.characteristics_fr, []),
      ar: parseJSON<string[]>(row.characteristics_ar, []),
      en: parseJSON<string[]>(row.characteristics_en, []),
    },
    seo: {
      fr: parseSeoFields(parseJSON<unknown>(row.seo_fr, {})),
      ar: parseSeoFields(parseJSON<unknown>(row.seo_ar, {})),
      en: parseSeoFields(parseJSON<unknown>(row.seo_en, {})),
    },
  };
}

const PRODUCT_SELECT = `
SELECT p.*
FROM products p
`;

/** Everything needed to turn product rows into `Product` objects, fetched in one go. */
type ProductContext = {
  variants: Map<string, ProductVariant[]>;
  links: Map<string, string[]>;
  counts: Map<string, number>;
  collectionsBySlug: Map<string, Collection>;
};

async function loadProductContext(): Promise<ProductContext> {
  const [variantRows, linkRows, countRows, collections] = await Promise.all([
    dbAll<Row>('SELECT * FROM product_variants ORDER BY sort_order'),
    dbAll<Row>('SELECT * FROM product_collections'),
    dbAll<Row>('SELECT collection_slug, COUNT(*) AS n FROM product_collections GROUP BY collection_slug'),
    getCollections(),
  ]);

  const variants = new Map<string, ProductVariant[]>();
  for (const row of variantRows) {
    const key = String(row.product_id);
    const list = variants.get(key) ?? [];
    list.push(mapVariantRow(row));
    variants.set(key, list);
  }

  const links = new Map<string, string[]>();
  for (const row of linkRows) {
    const key = String(row.product_id);
    const list = links.get(key) ?? [];
    list.push(String(row.collection_slug));
    links.set(key, list);
  }

  const counts = new Map<string, number>();
  for (const row of countRows) counts.set(String(row.collection_slug), Number(row.n));

  return {variants, links, counts, collectionsBySlug: new Map(collections.map((c) => [c.slug, c]))};
}

// ── Collections (the public "collections"/garment types) ──

export async function getCollections(): Promise<Collection[]> {
  const rows = await dbAll<Row>(
    'SELECT *, (SELECT COUNT(*) FROM product_collections pc WHERE pc.collection_slug = collections.slug) AS product_count FROM collections ORDER BY sort_order'
  );
  return rows.map((r) => ({...mapCollectionRow(r), productCount: Number(r.product_count ?? 0)}));
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const row = await dbFirst<Row>(
    'SELECT *, (SELECT COUNT(*) FROM product_collections pc WHERE pc.collection_slug = collections.slug) AS product_count FROM collections WHERE slug = ?',
    [slug]
  );
  return row ? mapCollectionRow(row) : null;
}

// ── Models ──

export async function getModels(): Promise<Model[]> {
  const [rows, linkRows] = await Promise.all([
    dbAll<Row>('SELECT * FROM models ORDER BY name_fr'),
    dbAll<Row>('SELECT * FROM model_collections'),
  ]);

  const links = new Map<string, string[]>();
  for (const row of linkRows) {
    const key = String(row.model_id);
    const list = links.get(key) ?? [];
    list.push(String(row.collection_slug));
    links.set(key, list);
  }

  return rows.map((row) => mapModelRow(row, links.get(String(row.id)) ?? []));
}

export async function getModelsByCollection(collectionSlug: string): Promise<Model[]> {
  const models = await getModels();
  return models.filter((m) => m.collectionSlugs.includes(collectionSlug));
}

export async function upsertModel(model: Model): Promise<Model> {
  await dbRun(
    `INSERT INTO models (id, slug, name_fr, name_ar, name_en)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug,
       name_fr = excluded.name_fr,
       name_ar = excluded.name_ar,
       name_en = excluded.name_en`,
    [model.id, model.slug, model.name.fr, model.name.ar, model.name.en]
  );

  await dbRun('DELETE FROM model_collections WHERE model_id = ?', [model.id]);
  for (const collectionSlug of model.collectionSlugs) {
    await dbRun('INSERT INTO model_collections (model_id, collection_slug) VALUES (?, ?)', [
      model.id,
      collectionSlug,
    ]);
  }
  return model;
}

export async function removeModel(id: string): Promise<boolean> {
  const changes = await dbRun('DELETE FROM models WHERE id = ?', [id]);
  return changes > 0;
}

// ── Products ──

export async function getAllProducts(): Promise<Product[]> {
  const context = await loadProductContext();
  const rows = await dbAll<Row>(`${PRODUCT_SELECT} ORDER BY p.created_at DESC, p.slug`);
  return rows.map((row) =>
    mapProductRow(
      row,
      context.variants.get(String(row.id)) ?? [],
      context.links.get(String(row.id)) ?? [],
      context.counts,
      context.collectionsBySlug
    )
  );
}

export async function getProductById(id: string): Promise<Product | null> {
  const context = await loadProductContext();
  const row = await dbFirst<Row>(`${PRODUCT_SELECT} WHERE p.id = ?`, [id]);
  return row
    ? mapProductRow(
        row,
        context.variants.get(String(row.id)) ?? [],
        context.links.get(String(row.id)) ?? [],
        context.counts,
        context.collectionsBySlug
      )
    : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const context = await loadProductContext();
  const row = await dbFirst<Row>(`${PRODUCT_SELECT} WHERE p.slug = ?`, [slug]);
  return row
    ? mapProductRow(
        row,
        context.variants.get(String(row.id)) ?? [],
        context.links.get(String(row.id)) ?? [],
        context.counts,
        context.collectionsBySlug
      )
    : null;
}

export type ProductVariantInput = {
  id?: string;
  color: Record<Locale, string>;
  colorHex?: string;
  sku?: string;
  price?: number | null;
  inStock?: boolean;
  images?: string[];
  sortOrder?: number;
};

export type ProductInput = {
  name: Record<Locale, string>;
  slug?: string;
  reference: string;
  collectionSlugs: string[];
  description?: Record<Locale, string>;
  material?: Record<Locale, string>;
  materialSlug?: string;
  width?: string;
  price?: number | null;
  inStock?: boolean;
  featured?: boolean;
  isNew?: boolean;
  characteristics?: Record<Locale, string[]>;
  images?: string[];
  variants?: ProductVariantInput[];
  seo?: ProductSeoByLanguage;
};

type ProductRow = {
  id: string;
  slug: string;
  reference: string;
  name: Record<Locale, string>;
  collectionSlugs: string[];
  description?: Record<Locale, string>;
  material?: Record<Locale, string>;
  materialSlug?: string;
  width?: string;
  price?: number | null;
  inStock?: boolean;
  featured?: boolean;
  isNew?: boolean;
  characteristics?: Record<Locale, string[]>;
  images?: string[];
  seo?: ProductSeoByLanguage;
};

async function insertProductRow(product: ProductRow) {
  const seo = normalizeSeo(product.seo);
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, description_fr, description_ar, description_en, material_fr, material_ar, material_en, material_slug, width, price, in_stock, featured, is_new, characteristics_fr, characteristics_ar, characteristics_en, seo_fr, seo_ar, seo_en, images, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug,
       reference = excluded.reference,
       name_fr = excluded.name_fr,
       name_ar = excluded.name_ar,
       name_en = excluded.name_en,
       description_fr = excluded.description_fr,
       description_ar = excluded.description_ar,
       description_en = excluded.description_en,
       material_fr = excluded.material_fr,
       material_ar = excluded.material_ar,
       material_en = excluded.material_en,
       material_slug = excluded.material_slug,
       width = excluded.width,
       price = excluded.price,
       in_stock = excluded.in_stock,
       featured = excluded.featured,
       is_new = excluded.is_new,
       characteristics_fr = excluded.characteristics_fr,
       characteristics_ar = excluded.characteristics_ar,
       characteristics_en = excluded.characteristics_en,
       seo_fr = excluded.seo_fr,
       seo_ar = excluded.seo_ar,
       seo_en = excluded.seo_en,
       images = excluded.images,
       updated_at = excluded.updated_at`,
    [
      product.id,
      product.slug,
      product.reference,
      product.name.fr,
      product.name.ar,
      product.name.en,
      product.description?.fr ?? '',
      product.description?.ar ?? '',
      product.description?.en ?? '',
      product.material?.fr ?? '',
      product.material?.ar ?? '',
      product.material?.en ?? '',
      product.materialSlug ?? '',
      product.width ?? '',
      product.price ?? null,
      product.inStock ? 1 : 0,
      product.featured ? 1 : 0,
      product.isNew ? 1 : 0,
      JSON.stringify(product.characteristics?.fr ?? []),
      JSON.stringify(product.characteristics?.ar ?? []),
      JSON.stringify(product.characteristics?.en ?? []),
      JSON.stringify(seo.fr),
      JSON.stringify(seo.ar),
      JSON.stringify(seo.en),
      JSON.stringify(product.images ?? []),
      now,
      now,
    ]
  );

  await dbRun('DELETE FROM product_collections WHERE product_id = ?', [product.id]);
  for (const collectionSlug of product.collectionSlugs) {
    await dbRun('INSERT INTO product_collections (product_id, collection_slug) VALUES (?, ?)', [
      product.id,
      collectionSlug,
    ]);
  }
}

async function replaceVariants(productId: string, variants: ProductVariantInput[], reference: string) {
  await dbRun('DELETE FROM product_variants WHERE product_id = ?', [productId]);
  for (const [index, variant] of variants.entries()) {
    await dbRun(
      `INSERT INTO product_variants (id, product_id, color_fr, color_ar, color_en, color_hex, sku, price, in_stock, sort_order, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        variant.id || nowId('v'),
        productId,
        variant.color?.fr ?? '',
        variant.color?.ar ?? '',
        variant.color?.en ?? '',
        variant.colorHex ?? '#000000',
        variant.sku || `${reference}-${index + 1}`,
        variant.price ?? null,
        variant.inStock === false ? 0 : 1,
        variant.sortOrder ?? index,
        JSON.stringify(variant.images ?? []),
      ]
    );
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const slug = input.slug?.trim() || slugify(input.name.fr || input.name.en || input.name.ar || input.reference);
  const id = nowId('p');
  await insertProductRow({
    id,
    slug,
    ...input,
    collectionSlugs: input.collectionSlugs,
    inStock: input.inStock ?? true,
    featured: input.featured ?? false,
    isNew: input.isNew ?? false,
  });
  if (input.variants) await replaceVariants(id, input.variants, input.reference);
  return (await getProductById(id))!;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  const merged: ProductInput = {
    name: input.name ?? existing.name,
    reference: input.reference ?? existing.reference,
    collectionSlugs: input.collectionSlugs ?? existing.collections.map((c) => c.slug),
    description: input.description ?? existing.description,
    material: input.material ?? existing.material,
    materialSlug: input.materialSlug ?? existing.materialSlug,
    width: input.width !== undefined ? input.width : existing.width,
    price: input.price !== undefined ? input.price : existing.price,
    inStock: input.inStock ?? existing.inStock,
    featured: input.featured ?? existing.featured,
    isNew: input.isNew ?? existing.isNew,
    characteristics: input.characteristics ?? existing.characteristics,
    images: input.images ?? existing.images,
    seo: input.seo ?? existing.seo,
  };

  await insertProductRow({...merged, id: existing.id, slug: existing.slug});

  if (input.variants) await replaceVariants(id, input.variants, merged.reference);

  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const changes = await dbRun('DELETE FROM products WHERE id = ?', [id]);
  return changes > 0;
}

// ── Site settings ──

const SITE_SETTINGS_KEY = 'site';

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await dbFirst<Row>('SELECT value FROM site_settings WHERE key = ?', [SITE_SETTINGS_KEY]);
  if (!row) return getDefaultSiteSettings();
  const parsed = parseJSON<unknown>(row.value, null);
  return migrateSiteSettings(parsed);
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  await dbRun(
    `INSERT INTO site_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [SITE_SETTINGS_KEY, JSON.stringify(settings)]
  );
}

// ── Dashboard stats ──

export type CollectionBreakdown = {
  slug: string;
  name: string;
  count: number;
  percentage: number;
};

export type DashboardData = {
  totalProducts: number;
  totalColorVariants: number;
  collectionBreakdown: CollectionBreakdown[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const [products, collections] = await Promise.all([getAllProducts(), getCollections()]);

  const totalColorVariants = products.reduce((sum, p) => sum + Math.max(p.variants?.length ?? 0, 1), 0);

  // Seeded from the full collection list so a collection with no linked
  // products still shows up with a count of 0.
  const byCollection = new Map<string, {slug: string; name: string; count: number}>(
    collections.map((collection) => [collection.slug, {slug: collection.slug, name: collection.name.fr, count: 0}])
  );

  for (const product of products) {
    for (const collection of product.collections) {
      const current = byCollection.get(collection.slug) ?? {
        slug: collection.slug,
        name: collection.name.fr,
        count: 0,
      };
      current.count += 1;
      byCollection.set(collection.slug, current);
    }
  }

  const collectionBreakdown: CollectionBreakdown[] = Array.from(byCollection.values()).map(
    ({slug, name, count}) => ({
      slug,
      name,
      count,
      percentage: products.length > 0 ? Math.round((count / products.length) * 100) : 0,
    })
  );

  return {totalProducts: products.length, totalColorVariants, collectionBreakdown};
}
