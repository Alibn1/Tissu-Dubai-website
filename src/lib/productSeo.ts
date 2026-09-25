import type {Locale, ProductSeo, ProductSeoByLanguage} from '@/types';

export type {ProductSeo, ProductSeoByLanguage};

export type SeoFieldKey = keyof Omit<ProductSeo, 'enabled'>;

export const LOCALES: Locale[] = ['fr', 'en', 'ar'];

export function createEmptySeo(): ProductSeoByLanguage {
  return {
    en: {title: '', metaDescription: '', altImage: '', enabled: false},
    fr: {title: '', metaDescription: '', altImage: '', enabled: false},
    ar: {title: '', metaDescription: '', altImage: '', enabled: false},
  };
}

export function generateSeoTitle(lang: Locale, name: string): string {
  if (lang === 'ar') return `لـ ${name} | تيسو دبي`;
  if (lang === 'fr') return `pour ${name} | Tissu Dubai`;
  return `for ${name} | Tissu Dubai`;
}

export function generateSeoDescription(lang: Locale, name: string): string {
  if (lang === 'ar') return `${name}. جديد. تواصل مع تيسو دبي للحصول على عرض سعر، توصيل لجميع أنحاء المغرب.`;
  if (lang === 'fr') return `${name}. Nouveau. Contactez Tissu Dubai pour un devis, livraison partout au Maroc.`;
  return `${name}. New. Contact Tissu Dubai for a quote, delivery across Morocco.`;
}

export function generateSeoAltImage(_lang: Locale, name: string): string {
  return name;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asPartialSeo(value: unknown): Partial<ProductSeo> | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  return {
    title: asString(record.title),
    metaDescription: asString(record.metaDescription),
    altImage: asString(record.altImage),
    enabled: record.enabled === true,
  };
}

/**
 * Normalizes the stored blob for a single language. A disabled language never
 * keeps overrides: it always renders the auto-generated text, so stale values
 * can never leak into the page.
 */
export function parseSeoFields(value: unknown): ProductSeo {
  const partial = asPartialSeo(value);
  if (!partial?.enabled) return {title: '', metaDescription: '', altImage: '', enabled: false};
  return {
    title: partial.title ?? '',
    metaDescription: partial.metaDescription ?? '',
    altImage: partial.altImage ?? '',
    enabled: true,
  };
}

/**
 * Coerces anything (form state, API body, stored row) into a complete
 * per-language SEO object so downstream code never has to null-check.
 */
export function normalizeSeo(value: unknown): ProductSeoByLanguage {
  const empty = createEmptySeo();
  if (!value || typeof value !== 'object') return empty;
  const record = value as Record<string, unknown>;
  for (const lang of LOCALES) {
    if (!(lang in record)) continue;
    empty[lang] = parseSeoFields(record[lang]);
  }
  return empty;
}

/** The custom value stored for a language, or '' when the language is on auto. */
export function seoOverride(
  seo: ProductSeoByLanguage | undefined,
  lang: Locale,
  field: SeoFieldKey
): string {
  if (!seo?.[lang]?.enabled) return '';
  return seo[lang][field]?.trim() ?? '';
}

/** The value a page should actually render: the override when enabled, else the generated text. */
export function resolveSeoValue(
  seo: ProductSeoByLanguage | undefined,
  lang: Locale,
  field: SeoFieldKey,
  name: string
): string {
  const override = seoOverride(seo, lang, field);
  if (override) return override;
  if (field === 'title') return generateSeoTitle(lang, name);
  if (field === 'metaDescription') return generateSeoDescription(lang, name);
  return generateSeoAltImage(lang, name);
}
