import {z} from 'zod';

/**
 * Server-side validation for the admin write paths.
 *
 * The API routes already refuse an obviously broken payload (missing reference,
 * no collection, no product image), but everything past that point went straight
 * to SQL. This module covers the cases a route cannot see on its own, so the
 * database is never handed a value that would be stored wrong or not at all.
 *
 * Validated here, in the store, rather than in each route, because the store is
 * the only place every writer passes through: the routes, the tests and any
 * future importer all get the same guarantee.
 */

export const LOCALES = ['fr', 'ar', 'en'] as const;

/**
 * D1 refuses a row larger than 2,000,000 bytes. Images are stored inline as
 * data URLs until R2 is in place, so a product with many photos can reach that
 * ceiling and the INSERT fails with no useful error. The cap leaves headroom
 * for the text columns, and the message points at the real fix.
 */
export const MAX_IMAGES_PAYLOAD_BYTES = 1_400_000;

/** One image, judged by the length of its data URL. */
export const MAX_IMAGE_BYTES = 350_000;

/** Generous text limits. Nothing legitimate comes close; abuse does. */
const MAX_SHORT_TEXT = 500;
const MAX_LONG_TEXT = 20_000;

export class ValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join(' '));
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/**
 * Raised when the row changed after the editor loaded it. Kept separate from
 * ValidationError so the route can answer 409 rather than 400: nothing is wrong
 * with the payload, the caller is simply working from an out-of-date copy.
 */
export class EditConflictError extends Error {
  constructor() {
    super(
      "Ce produit a ete modifie par quelqu'un d'autre pendant que vous le modifiiez. Rechargez la page pour voir les changements actuels avant de relancer l'enregistrement."
    );
    this.name = 'EditConflictError';
  }
}

/** French is the source language, so it is the one that must not be empty. */
const localizedText = (max: number) =>
  z
    .object({
      fr: z.string().max(max),
      ar: z.string().max(max).optional().default(''),
      en: z.string().max(max).optional().default('')
    })
    .refine((value) => value.fr.trim() !== '', {
      message: 'Le texte en francais est obligatoire',
      path: ['fr']
    });

const optionalLocalizedText = (max: number) =>
  z
    .object({
      fr: z.string().max(max).optional().default(''),
      ar: z.string().max(max).optional().default(''),
      en: z.string().max(max).optional().default('')
    })
    .optional();

/** A price that is absent, null, or a real number. Never NaN. */
const price = z
  .union([z.number(), z.null()])
  .refine((value) => value === null || Number.isFinite(value), {
    message: 'Le prix doit etre un nombre'
  })
  .optional();

const imageList = z
  .array(z.string())
  .max(30)
  .optional()
  .transform((images) => images ?? []);

export const productVariantSchema = z.object({
  id: z.string().optional(),
  color: localizedText(MAX_SHORT_TEXT),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'La couleur hexadecimale doit etre au format #RRGGBB')
    .optional(),
  sku: z.string().max(120).optional(),
  price,
  inStock: z.boolean().optional(),
  images: imageList,
  sortOrder: z.number().int().optional()
});

export const productInputSchema = z.object({
  name: localizedText(MAX_SHORT_TEXT),
  slug: z.string().max(MAX_SHORT_TEXT).optional(),
  reference: z.string().trim().min(1, 'La reference est obligatoire').max(120),
  collectionSlugs: z
    .array(z.string().min(1))
    .min(1, 'Choisissez au moins une collection')
    .max(10),
  description: optionalLocalizedText(MAX_LONG_TEXT),
  material: optionalLocalizedText(MAX_SHORT_TEXT),
  materialSlug: z.string().max(MAX_SHORT_TEXT).optional(),
  width: z.string().max(MAX_SHORT_TEXT).optional(),
  price,
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  characteristics: z.record(z.array(z.string().max(MAX_SHORT_TEXT))).optional(),
  images: imageList,
  variants: z.array(productVariantSchema).max(60).optional(),
  seo: z.record(z.unknown()).optional()
});

export const modelInputSchema = z.object({
  id: z.string().max(MAX_SHORT_TEXT).optional(),
  slug: z
    .string()
    .trim()
    .min(1, 'Le slug est obligatoire')
    .max(MAX_SHORT_TEXT)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug ne peut contenir que des lettres, chiffres et tirets'),
  name: localizedText(MAX_SHORT_TEXT),
  collectionSlugs: z.array(z.string().min(1)).min(1).max(10)
});

const businessHoursSchema = z.object({
  day: z.enum([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ]),
  isClosed: z.boolean(),
  openTime: z.string().max(10).optional(),
  closeTime: z.string().max(10).optional()
});

const cardSchema = z.object({
  id: z.string().min(1).max(MAX_SHORT_TEXT),
  image: z.string().optional().default(''),
  title: z.record(z.string().max(MAX_SHORT_TEXT)).optional().default({}),
  description: z.record(z.string().max(MAX_LONG_TEXT)).optional().default({})
});

export const siteSettingsSchema = z.object({
  contact: z
    .object({
      address: z.string().max(MAX_LONG_TEXT).optional().default(''),
      phones: z.array(z.string().max(60)).max(10).optional().default([]),
      whatsappNumber: z.string().max(60).optional().default(''),
      social: z
        .object({
          instagram: z.string().max(300).optional(),
          tiktok: z.string().max(300).optional(),
          facebook: z.string().max(300).optional()
        })
        .optional()
        .default({})
    })
    .optional(),
  businessHours: z.array(businessHoursSchema).max(7).optional(),
  faq: z
    .array(
      z.object({
        id: z.string().min(1).max(MAX_SHORT_TEXT),
        question: z.record(z.string().max(MAX_LONG_TEXT)),
        answer: z.record(z.string().max(MAX_LONG_TEXT))
      })
    )
    .max(200)
    .optional(),
  homepage: z
    .object({
      hero: z
        .object({
          image: z.string().optional().default(''),
          title: z.record(z.string().max(MAX_SHORT_TEXT)).optional().default({}),
          subtitle: z.record(z.string().max(MAX_LONG_TEXT)).optional().default({})
        })
        .optional(),
      collectionCards: z.array(cardSchema).max(12).optional(),
      genderCards: z.array(cardSchema).max(12).optional()
    })
    .optional()
});

/**
 * Rejects an image payload that D1 could not store.
 *
 * Until images move to R2 they travel as data URLs inside the product row, and
 * a row over 2,000,000 bytes is refused by D1 with an error that says nothing
 * useful. Catching it here turns a silent failed save into a clear message.
 *
 * Each group is checked on its own, and deliberately not summed: `products.images`
 * and each `product_variants.images` are separate rows, so the ceiling applies
 * per row. Summing would reject products that store fine while still letting a
 * single oversized row through.
 */
export function checkImageBudget(
  groups: Array<{label: string; images: string[] | undefined}>,
  total = MAX_IMAGES_PAYLOAD_BYTES
): void {
  const issues: string[] = [];

  for (const group of groups) {
    let groupBytes = 0;
    for (const image of group.images ?? []) {
      const bytes = image.length;
      if (bytes > MAX_IMAGE_BYTES) {
        issues.push(
          `Image trop lourde (${Math.round(bytes / 1024)} Ko, maximum ${Math.round(
            MAX_IMAGE_BYTES / 1024
          )} Ko)`
        );
      }
      groupBytes += bytes;
    }
    if (groupBytes > total) {
      issues.push(
        `${group.label} : ${Math.round(groupBytes / 1024)} Ko d'images, maximum ${Math.round(
          total / 1024
        )} Ko. Reduisez le nombre d'images ou attendez le stockage R2.`
      );
    }
  }

  if (issues.length > 0) throw new ValidationError(issues);
}

/** Parses with a zod schema and raises ValidationError listing every problem. */
export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  const issues = result.error.issues.map((issue) => {
    const field = issue.path.filter((part) => typeof part === 'number' || typeof part === 'string');
    const where = field.length > 0 ? field.join('.') : label;
    return `${where}: ${issue.message}`;
  });
  throw new ValidationError(issues);
}
