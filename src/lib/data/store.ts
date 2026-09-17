import {getDb} from '@/db';
import type {Category, Locale, Model, Product, ProductVariant} from '@/types';
import {getDefaultSiteSettings, type SiteSettings} from '@/lib/siteSettings';

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

function mapCategoryRow(row: Row): Category {
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

function mapModelRow(row: Row): Model {
  return {
    id: String(row.id),
    slug: String(row.slug),
    collectionSlug: String(row.collection_slug),
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

function mapProductRow(row: Row, variants: ProductVariant[], categoryCounts: Map<string, number>): Product {
  const category = {
    id: String(row.cat_id),
    slug: String(row.cat_slug),
    name: {fr: String(row.cat_name_fr ?? ''), ar: String(row.cat_name_ar ?? ''), en: String(row.cat_name_en ?? '')},
    description: {
      fr: String(row.cat_desc_fr ?? ''),
      ar: String(row.cat_desc_ar ?? ''),
      en: String(row.cat_desc_en ?? ''),
    },
    image: String(row.cat_image ?? ''),
    productCount: categoryCounts.get(String(row.cat_slug)) ?? 0,
  };

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
    category,
    variants,
    featured: Boolean(row.featured),
    isNew: Boolean(row.is_new),
    images: parseJSON<string[]>(row.images, []),
    characteristics: {
      fr: parseJSON<string[]>(row.characteristics_fr, []),
      ar: parseJSON<string[]>(row.characteristics_ar, []),
      en: parseJSON<string[]>(row.characteristics_en, []),
    },
  };
}

const PRODUCT_SELECT = `
SELECT
  p.*,
  c.id AS cat_id,
  c.slug AS cat_slug,
  c.name_fr AS cat_name_fr,
  c.name_ar AS cat_name_ar,
  c.name_en AS cat_name_en,
  c.description_fr AS cat_desc_fr,
  c.description_ar AS cat_desc_ar,
  c.description_en AS cat_desc_en,
  c.image AS cat_image
FROM products p
JOIN collections c ON c.slug = p.category_slug
`;

function loadVariants(): Map<string, ProductVariant[]> {
  const db = getDb();
  const map = new Map<string, ProductVariant[]>();
  const rows = db.prepare('SELECT * FROM product_variants ORDER BY sort_order').all() as Row[];
  for (const row of rows) {
    const key = String(row.product_id);
    const list = map.get(key) ?? [];
    list.push(mapVariantRow(row));
    map.set(key, list);
  }
  return map;
}

function loadCategoryCounts(): Map<string, number> {
  const db = getDb();
  const map = new Map<string, number>();
  const rows = db.prepare('SELECT category_slug, COUNT(*) AS n FROM products GROUP BY category_slug').all() as Row[];
  for (const row of rows) map.set(String(row.category_slug), Number(row.n));
  return map;
}

// ── Collections (the public "collections"/garment types) ──

export function getCategories(): Category[] {
  const db = getDb();
  const counts = loadCategoryCounts();
  const rows = db
    .prepare('SELECT *, (SELECT COUNT(*) FROM products p WHERE p.category_slug = collections.slug) AS product_count FROM collections ORDER BY sort_order')
    .all() as Row[];
  return rows.map((r) => ({...mapCategoryRow(r), productCount: Number(r.product_count ?? counts.get(String(r.slug)) ?? 0)}));
}

export function getCategoryBySlug(slug: string): Category | null {
  const db = getDb();
  const row = db
    .prepare('SELECT *, (SELECT COUNT(*) FROM products p WHERE p.category_slug = collections.slug) AS product_count FROM collections WHERE slug = ?')
    .get(slug) as Row | undefined;
  return row ? mapCategoryRow(row) : null;
}

// ── Models ──

export function getModels(): Model[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM models ORDER BY collection_slug, name_fr').all() as Row[];
  return rows.map(mapModelRow);
}

export function getModelsByCollection(collectionSlug: string): Model[] {
  return getModels().filter((m) => m.collectionSlug === collectionSlug);
}

export function upsertModel(model: Model): Model {
  const db = getDb();
  db.prepare(
    `INSERT INTO models (id, slug, collection_slug, name_fr, name_ar, name_en)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug,
       collection_slug = excluded.collection_slug,
       name_fr = excluded.name_fr,
       name_ar = excluded.name_ar,
       name_en = excluded.name_en`
  ).run(model.id, model.slug, model.collectionSlug, model.name.fr, model.name.ar, model.name.en);
  return model;
}

export function removeModel(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM models WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Products ──

export function getAllProducts(): Product[] {
  const db = getDb();
  const variants = loadVariants();
  const counts = loadCategoryCounts();
  const rows = db.prepare(`${PRODUCT_SELECT} ORDER BY p.created_at DESC, p.slug`).all() as Row[];
  return rows.map((row) => mapProductRow(row, variants.get(String(row.id)) ?? [], counts));
}

export function getProductById(id: string): Product | null {
  const db = getDb();
  const variants = loadVariants();
  const counts = loadCategoryCounts();
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id) as Row | undefined;
  return row ? mapProductRow(row, variants.get(String(row.id)) ?? [], counts) : null;
}

export function getProductBySlug(slug: string, category?: string): Product | null {
  const db = getDb();
  const variants = loadVariants();
  const counts = loadCategoryCounts();
  const row = category
    ? (db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ? AND p.category_slug = ?`).get(slug, category) as Row | undefined)
    : (db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ?`).get(slug) as Row | undefined);
  return row ? mapProductRow(row, variants.get(String(row.id)) ?? [], counts) : null;
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
  categorySlug: string;
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
};

type ProductRow = {
  id: string;
  slug: string;
  name: Record<Locale, string>;
  reference: string;
  categorySlug: string;
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
};

function insertProductRow(db: ReturnType<typeof getDb>, product: ProductRow) {
  db.prepare(
    `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, description_fr, description_ar, description_en, material_fr, material_ar, material_en, material_slug, width, price, in_stock, featured, is_new, category_slug, characteristics_fr, characteristics_ar, characteristics_en, images, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
       category_slug = excluded.category_slug,
       characteristics_fr = excluded.characteristics_fr,
       characteristics_ar = excluded.characteristics_ar,
       characteristics_en = excluded.characteristics_en,
       images = excluded.images,
       updated_at = excluded.updated_at`
  ).run(
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
    product.categorySlug,
    JSON.stringify(product.characteristics?.fr ?? []),
    JSON.stringify(product.characteristics?.ar ?? []),
    JSON.stringify(product.characteristics?.en ?? []),
    JSON.stringify(product.images ?? []),
    new Date().toISOString(),
    new Date().toISOString()
  );
}

function replaceVariants(productId: string, variants: ProductVariantInput[], reference: string) {
  const db = getDb();
  db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
  const stmt = db.prepare(
    `INSERT INTO product_variants (id, product_id, color_fr, color_ar, color_en, color_hex, sku, price, in_stock, sort_order, images)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  variants.forEach((variant, index) => {
    stmt.run(
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
      JSON.stringify(variant.images ?? [])
    );
  });
}

export function createProduct(input: ProductInput): Product {
  const db = getDb();
  const slug = input.slug?.trim() || slugify(input.name.fr || input.name.en || input.name.ar || input.reference);
  const id = nowId('p');
  insertProductRow(db, {
    id,
    slug,
    ...input,
    categorySlug: input.categorySlug,
    inStock: input.inStock ?? true,
    featured: input.featured ?? false,
    isNew: input.isNew ?? false,
  });
  if (input.variants) replaceVariants(id, input.variants, input.reference);
  return getProductById(id)!;
}

export function updateProduct(id: string, input: Partial<ProductInput>): Product | null {
  const existing = getProductById(id);
  if (!existing) return null;

  const db = getDb();
  const merged: ProductInput = {
    name: input.name ?? existing.name,
    reference: input.reference ?? existing.reference,
    categorySlug: input.categorySlug ?? existing.category.slug,
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
  };

  insertProductRow(
    db,
    {
      id: existing.id,
      slug: existing.slug,
      ...merged,
    },
  );

  if (input.variants) replaceVariants(id, input.variants, merged.reference);

  return getProductById(id);
}

export function deleteProduct(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Site settings ──

const SITE_SETTINGS_KEY = 'site';

export function getSiteSettings(): SiteSettings {
  const db = getDb();
  const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(SITE_SETTINGS_KEY) as Row | undefined;
  if (!row) return getDefaultSiteSettings();
  const parsed = parseJSON<SiteSettings>(row.value, null as unknown as SiteSettings);
  return parsed ?? getDefaultSiteSettings();
}

export function saveSiteSettings(settings: SiteSettings): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO site_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(SITE_SETTINGS_KEY, JSON.stringify(settings));
}

// ── Inquiries (WhatsApp order clicks) ──

export type InquiryEntry = {
  id: string;
  productName: string;
  reference: string;
  color: string;
  quantity: number;
  locale: string;
  createdAt: string;
  read: boolean;
};

export function getInquiries(): InquiryEntry[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all() as Row[];
  return rows.map((row) => ({
    id: String(row.id),
    productName: String(row.product_name),
    reference: String(row.reference),
    color: String(row.color),
    quantity: Number(row.quantity),
    locale: String(row.locale),
    createdAt: String(row.created_at),
    read: Boolean(row.read),
  }));
}

export function addInquiry(entry: Omit<InquiryEntry, 'id' | 'createdAt' | 'read'>): InquiryEntry {
  const db = getDb();
  const newEntry: InquiryEntry = {
    ...entry,
    id: nowId('i'),
    createdAt: new Date().toISOString(),
    read: false,
  };
  db.prepare(
    `INSERT INTO inquiries (id, product_name, reference, color, quantity, locale, read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newEntry.id,
    newEntry.productName,
    newEntry.reference,
    newEntry.color,
    newEntry.quantity,
    newEntry.locale,
    0,
    newEntry.createdAt
  );
  return newEntry;
}

export function markInquiryRead(id: string): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE inquiries SET read = 1 WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Dashboard stats ──

export type CategoryBreakdown = {
  slug: string;
  name: string;
  count: number;
  percentage: number;
};

export type ProductStat = Product & {whatsappClicks: number};

export type DashboardData = {
  totalProducts: number;
  totalColorVariants: number;
  categoryBreakdown: CategoryBreakdown[];
  topRequested: ProductStat[];
  products: ProductStat[];
};

function getInquiryCountByReference(): Map<string, number> {
  const db = getDb();
  const map = new Map<string, number>();
  const rows = db.prepare('SELECT reference, COUNT(*) AS n FROM inquiries GROUP BY reference').all() as Row[];
  for (const row of rows) map.set(String(row.reference), Number(row.n));
  return map;
}

export function getDashboardData(): DashboardData {
  const products = getAllProducts();
  const clicks = getInquiryCountByReference();

  const productStats: ProductStat[] = products.map((p) => ({
    ...p,
    whatsappClicks: clicks.get(p.reference) ?? 0,
  }));

  const totalColorVariants = productStats.reduce((sum, p) => sum + Math.max(p.variants?.length ?? 0, 1), 0);

  const byCategory = productStats.reduce<Map<string, {slug: string; name: string; count: number}>>((acc, p) => {
    const slug = p.category.slug;
    const name = p.category.name.fr;
    const current = acc.get(slug) ?? {slug, name, count: 0};
    current.count += 1;
    acc.set(slug, current);
    return acc;
  }, new Map());

  const categoryBreakdown: CategoryBreakdown[] = Array.from(byCategory.values()).map(({slug, name, count}) => ({
    slug,
    name,
    count,
    percentage: productStats.length > 0 ? Math.round((count / productStats.length) * 100) : 0,
  }));

  const topRequested = [...productStats]
    .filter((p) => p.whatsappClicks > 0)
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks)
    .slice(0, 5);

  return {totalProducts: productStats.length, totalColorVariants, categoryBreakdown, topRequested, products: productStats};
}