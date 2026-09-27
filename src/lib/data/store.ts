import {dbAll, dbBatch, dbFirst, dbRun, type BatchStatement} from '@/db';
import {
  checkImageBudget,
  EditConflictError,
  modelInputSchema,
  parseOrThrow,
  productInputSchema,
  siteSettingsSchema
} from '@/lib/validation/schemas';
import type {
  Collection,
  Locale,
  Model,
  Product,
  ProductSeoByLanguage,
  ProductVariant,
} from '@/types';
import {normalizeSeo, parseSeoFields} from '@/lib/productSeo';
import {
  migrateSiteSettings,
  type BusinessDay,
  type BusinessHours,
  type CollectionCard,
  type FaqEntry,
  type GenderCard,
  type SiteSettings
} from '@/lib/siteSettings';

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
    // Sent back to the client on save so a second editor's write can be detected
    // instead of quietly overwriting this one.
    updatedAt: row.updated_at == null ? undefined : String(row.updated_at),
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
  // mapCollectionRow already reads product_count, so there is nothing to add.
  return rows.map((row) => mapCollectionRow(row));
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
  parseOrThrow(modelInputSchema, model, 'model');

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
  /**
   * The `updatedAt` the editor loaded. When present, the write is refused if the
   * stored row has moved on, so two admins cannot silently overwrite each other.
   */
  expectedUpdatedAt?: string;
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
  validateProductInput(input, {partial: false});
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

/**
 * Checks a product before it reaches SQL.
 *
 * The routes already reject an empty reference, no collection and a missing
 * image. This covers what they cannot see: a blank French name, a price that
 * arrived as NaN, and an image payload too large for a D1 row. All three would
 * otherwise be stored wrong, or fail without a usable message.
 */
function validateProductInput(input: Partial<ProductInput>, options: {partial: boolean}): void {
  // On an update the top-level keys become optional, but any key that is
  // present is still checked by its own schema, so a partial edit cannot smuggle
  // in a nameless product or a NaN price.
  const schema = options.partial ? productInputSchema.partial() : productInputSchema;
  parseOrThrow(schema, input, 'product');

  checkImageBudget([
    {label: 'Images du produit', images: input.images},
    ...(input.variants ?? []).map((variant) => ({
      label: `Image de la variante ${variant.color?.fr ?? ''}`.trim(),
      images: variant.images
    }))
  ]);
}

/** Stable JSON so key order cannot make two equal objects look different. */
function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
}

/** The variant fields updateProduct actually persists, ignoring anything else. */
function comparableVariants(variants: ProductVariantInput[] | ProductVariant[]): unknown {
  return variants.map((variant) => ({
    id: variant.id,
    color: variant.color,
    colorHex: variant.colorHex ?? '',
    sku: variant.sku ?? '',
    price: variant.price ?? null,
    inStock: variant.inStock ?? true,
    images: variant.images ?? [],
    sortOrder: (variant as ProductVariantInput).sortOrder ?? 0
  }));
}

/**
 * Whether the caller's partial input actually differs from what is stored.
 *
 * Deliberately limited to the fields updateProduct merges, so a field that is
 * sent but not persisted cannot make this report a change that never happens.
 */
function hasFieldChanges(input: Partial<ProductInput>, existing: Product): boolean {
  const current: Record<string, unknown> = {
    name: existing.name,
    reference: existing.reference,
    collectionSlugs: existing.collections.map((c) => c.slug).sort(),
    description: existing.description ?? {},
    material: existing.material ?? {},
    materialSlug: existing.materialSlug,
    width: existing.width,
    price: existing.price ?? null,
    inStock: existing.inStock,
    featured: existing.featured,
    isNew: existing.isNew,
    characteristics: existing.characteristics ?? {},
    images: existing.images ?? [],
    variants: comparableVariants(existing.variants ?? []),
    seo: existing.seo ?? {}
  };

  for (const [key, value] of Object.entries(input)) {
    if (key === 'expectedUpdatedAt' || value === undefined) continue;
    if (key === 'variants') {
      if (stable(comparableVariants(value as ProductVariantInput[])) !== stable(current.variants)) return true;
      continue;
    }
    if (!(key in current)) continue;
    if (stable(value) !== stable(current[key])) return true;
  }
  return false;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  // Checked against the fields the caller actually sent, before they are merged
  // with the existing row, so a bad value is reported rather than persisted.
  validateProductInput(input, {partial: true});

  // If the editor told us which version it loaded, refuse the write when the row
  // has moved on. An update that leaves the whole row alone is not a real edit,
  // so a stale timestamp alone is not worth rejecting.
  const stillSameVersion =
    !input.expectedUpdatedAt || !hasFieldChanges(input, existing) || input.expectedUpdatedAt === existing.updatedAt;
  if (!stillSameVersion) throw new EditConflictError();

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

// ── FAQs ──

/**
 * FAQ entries in display order, one row per question.
 *
 * These live outside the site_settings blob because a question is an
 * individually editable, ordered record rather than a scalar. See
 * migrations/0002_faqs.sql for the reasoning.
 */
export async function getFaqs(): Promise<FaqEntry[]> {
  const rows = await dbAll<Row>(
    'SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order, created_at, id'
  );
  return rows.map((row) => ({
    id: String(row.id),
    question: {
      fr: String(row.question_fr ?? ''),
      ar: String(row.question_ar ?? ''),
      en: String(row.question_en ?? '')
    },
    answer: {
      fr: String(row.answer_fr ?? ''),
      ar: String(row.answer_ar ?? ''),
      en: String(row.answer_en ?? '')
    }
  }));
}

/**
 * Replaces the FAQ list. The admin form always submits the whole list, so this
 * upserts every entry and then drops the ones no longer present. Going row by
 * row rather than DELETE-then-INSERT keeps created_at intact for entries whose
 * wording was merely edited.
 */
export async function saveFaqs(faqs: FaqEntry[]): Promise<void> {
  const statements: BatchStatement[] = faqs.map((entry, index) => ({
    sql: `INSERT INTO faqs (id, question_fr, question_ar, question_en, answer_fr, answer_ar, answer_en, sort_order, is_active, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            question_fr = excluded.question_fr,
            question_ar = excluded.question_ar,
            question_en = excluded.question_en,
            answer_fr = excluded.answer_fr,
            answer_ar = excluded.answer_ar,
            answer_en = excluded.answer_en,
            sort_order = excluded.sort_order,
            is_active = 1,
            updated_at = excluded.updated_at`,
    params: [
      entry.id,
      entry.question?.fr ?? '',
      entry.question?.ar ?? '',
      entry.question?.en ?? '',
      entry.answer?.fr ?? '',
      entry.answer?.ar ?? '',
      entry.answer?.en ?? '',
      index
    ]
  }));

  if (faqs.length === 0) {
    await dbRun('DELETE FROM faqs');
    return;
  }
  const placeholders = faqs.map(() => '?').join(', ');
  statements.push({
    sql: `DELETE FROM faqs WHERE id NOT IN (${placeholders})`,
    params: faqs.map((entry) => entry.id)
  });

  await dbBatch(statements);
}

// ── Site settings ──
//
// site_settings stays a key/value table, but every setting gets its own row
// rather than one JSON document holding the whole site. Editing the hero no
// longer rewrites the phone numbers, and two people saving different sections
// cannot clobber each other. FAQ is the exception: it has a real table
// (migrations/0002_faqs.sql) because each question is individually ordered.
//
// One row per setting, so the homepage images are no longer packed together with
// the contact details and every row stays far below the D1 row size limit.

const CONTACT_KEY = 'contact';
const HERO_KEY = 'homepage.hero';
const BUSINESS_HOURS_PREFIX = 'business_hours.';
const COLLECTION_CARDS_PREFIX = 'homepage.collection_cards.';
const GENDER_CARDS_PREFIX = 'homepage.gender_cards.';

/** The pre-split single-document row, read as a fallback and dropped on save. */
const LEGACY_SETTINGS_KEY = 'site';

const BUSINESS_DAY_ORDER: readonly BusinessDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

function valuesUnder(rows: Row[], prefix: string): unknown[] {
  return rows
    .filter((row) => String(row.key).startsWith(prefix))
    .map((row) => parseJSON<unknown>(row.value, null))
    .filter((value): value is NonNullable<unknown> => value !== null);
}

function valueAt(rows: Row[], key: string): unknown {
  const row = rows.find((candidate) => candidate.key === key);
  return row ? parseJSON<unknown>(row.value, null) : null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const [rows, faqs] = await Promise.all([
    dbAll<Row>('SELECT key, value FROM site_settings'),
    getFaqs()
  ]);

  const sectionRows = rows.filter((row) => row.key !== LEGACY_SETTINGS_KEY);

  // Before the first save nothing is stored per section yet, so the legacy
  // document is all there is. Reading it keeps a deploy in the window between
  // the code change and the backfill working.
  const legacy =
    sectionRows.length === 0
      ? migrateSiteSettings(
          parseJSON<unknown>(valueAt(rows, LEGACY_SETTINGS_KEY), null)
        )
      : null;

  const collectionCards = valuesUnder(sectionRows, COLLECTION_CARDS_PREFIX) as CollectionCard[];
  const genderCards = valuesUnder(sectionRows, GENDER_CARDS_PREFIX) as GenderCard[];
  const businessHours = (
    valuesUnder(sectionRows, BUSINESS_HOURS_PREFIX) as BusinessHours[]
  ).sort(
    (a, b) => BUSINESS_DAY_ORDER.indexOf(a.day) - BUSINESS_DAY_ORDER.indexOf(b.day)
  );

  const merged = migrateSiteSettings({
    contact: valueAt(sectionRows, CONTACT_KEY) ?? legacy?.contact,
    businessHours: businessHours.length > 0 ? businessHours : legacy?.businessHours,
    homepage: {
      hero: valueAt(sectionRows, HERO_KEY) ?? legacy?.homepage.hero,
      collectionCards:
        collectionCards.length > 0 ? collectionCards : legacy?.homepage.collectionCards,
      genderCards: genderCards.length > 0 ? genderCards : legacy?.homepage.genderCards
    }
  });

  // The faqs table wins once it holds rows, and otherwise the merged document
  // still carries the entries from before the split.
  return faqs.length > 0 ? {...merged, faq: faqs} : merged;
}

/**
 * Writes each setting to its own row and saves the FAQ table alongside.
 *
 * Rows that are no longer produced are deleted first, so removing a collection
 * card or a day of opening hours actually takes effect instead of lingering. The
 * legacy single-document row is dropped here too, which is what stops the old
 * "everything in one row" document from coming back.
 */
export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  // The settings route accepts any object at all, so this is the last place a
  // malformed payload can be caught before it is spread across fourteen rows.
  parseOrThrow(siteSettingsSchema, settings, 'settings');

  // Each card and the hero is its own settings row, so the image ceiling is
  // checked per image, exactly as for product rows.
  const homepage = settings.homepage;
  if (homepage) {
    checkImageBudget([
      {label: 'Banniere de la page d\'accueil', images: [homepage.hero?.image ?? '']},
      ...(homepage.collectionCards ?? []).map((card) => ({
        label: `Carte de collection ${card.id}`,
        images: [card.image ?? '']
      })),
      ...(homepage.genderCards ?? []).map((card) => ({
        label: `Carte ${card.id}`,
        images: [card.image ?? '']
      }))
    ]);
  }

  const {faq, ...rest} = settings;
  await saveFaqs(faq ?? []);

  const home = rest.homepage;
  const rows: Array<[string, unknown]> = [
    [CONTACT_KEY, rest.contact],
    [HERO_KEY, home?.hero],
    ...(home?.collectionCards ?? []).map(
      (card): [string, unknown] => [`${COLLECTION_CARDS_PREFIX}${card.id}`, card]
    ),
    ...(home?.genderCards ?? []).map(
      (card): [string, unknown] => [`${GENDER_CARDS_PREFIX}${card.id}`, card]
    ),
    ...(rest.businessHours ?? []).map(
      (day): [string, unknown] => [`${BUSINESS_HOURS_PREFIX}${day.day}`, day]
    )
  ];

  const keys = rows.map(([key]) => key);
  const filter = keys.length > 0 ? `('${keys.join("', '")}')` : "('')";

  // One round trip: the delete and every upsert travel together, so saving the
  // settings stays as fast as it was when the whole site was a single row.
  await dbBatch([
    {sql: `DELETE FROM site_settings WHERE key NOT IN ${filter}`},
    ...rows
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({
        sql: `INSERT INTO site_settings (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        params: [key, JSON.stringify(value)]
      }))
  ]);
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
