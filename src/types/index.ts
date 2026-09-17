export type Locale = 'fr' | 'ar' | 'en';

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
  category: Category;
  variants: ProductVariant[];
  featured: boolean;
  isNew: boolean;
  images: string[];
  characteristics: Record<Locale, string[]>;
};

export type Category = {
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
  collectionSlug: string;
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
  categories: string[];
  materials: string[];
  inStockOnly: boolean;
  search: string;
  sort: string;
};
