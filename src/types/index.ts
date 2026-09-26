export type Locale = 'fr' | 'ar' | 'en';

/** Per-language SEO overrides for a product. Empty values fall back to the
 *  auto-generated text, so an admin only fills in what they want to change. */
export type ProductSeo = {
  title: string;
  metaDescription: string;
  altImage: string;
  enabled: boolean;
};

export type ProductSeoByLanguage = Record<Locale, ProductSeo>;

export type ProductVariant = {
  id: string;
  color: Record<Locale, string>;
  colorHex: string;
  sku: string;
  price: number | null;
  inStock: boolean;
  images: string[];
};

export type Product = {
  id: string;
  slug: string;
  name: Record<Locale, string>;
  reference: string;
  description: Record<Locale, string>;
  material: Record<Locale, string>;
  materialSlug: string;
  width: string;
  price: number | null;
  inStock: boolean;
  collections: Collection[];
  variants: ProductVariant[];
  featured: boolean;
  isNew: boolean;
  images: string[];
  characteristics: Record<Locale, string[]>;
  seo?: ProductSeoByLanguage;
};

export type Collection = {
  id: string;
  slug: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  image: string;
  productCount: number;
};

export type Model = {
  id: string;
  slug: string;
  collectionSlugs: string[];
  name: Record<Locale, string>;
};

export type ContactFormData = {
  name: string;
  phone: string;
  subject: string;
  message: string;
};

export type SortOption = {
  value: string;
  labelKey: string;
};

export type FilterState = {
  collections: string[];
  materials: string[];
  inStockOnly: boolean;
  search: string;
  sort: string;
};
