import type {Product, Category, Collection} from '@/types';
import {products as mockProducts} from '@/mock/products';
import {categories as mockCategories} from '@/mock/categories';
import {collections as mockCollections} from '@/mock/collections';
import {getDefaultSiteSettings, type CategoryCard, type HomepageContent} from '@/lib/siteSettings';

function simulateDelay(ms = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getHomepageContent(): Promise<HomepageContent> {
  // TODO: load from a real API / durable storage (e.g. GET /api/site-settings or a KV/D1 binding).
  return getDefaultSiteSettings().homepage;
}

async function loadMergedCategories(): Promise<Category[]> {
  const homepage = await getHomepageContent();
  const cardsBySlug = new Map<string, CategoryCard>(homepage.categoryCards.map((card) => [card.id, card]));

  return mockCategories.map((cat) => {
    const card = cardsBySlug.get(cat.slug);
    if (!card) return cat;
    return {
      ...cat,
      name: card.title,
      description: card.description,
      image: card.image || cat.image,
    };
  });
}

export async function getProducts(filters?: {
  category?: string;
  material?: string;
  color?: string;
  collection?: string;
  inStockOnly?: boolean;
  search?: string;
  sort?: string;
}): Promise<Product[]> {
  await simulateDelay();

  let filtered = [...mockProducts];

  if (filters?.category) {
    filtered = filtered.filter((p) => p.category.slug === filters.category);
  }
  if (filters?.material) {
    filtered = filtered.filter((p) => p.materialSlug === filters.material);
  }
  if (filters?.color) {
    filtered = filtered.filter((p) =>
      p.variants.some((v) =>
        Object.values(v.color).some((c) => c.toLowerCase() === filters.color!.toLowerCase())
      )
    );
  }
  if (filters?.collection) {
    filtered = filtered.filter((p) => p.collection?.slug === filters.collection);
  }
  if (filters?.inStockOnly) {
    filtered = filtered.filter((p) => p.inStock);
  }
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    filtered = filtered.filter((p) =>
      Object.values(p.name).some((n) => n.toLowerCase().includes(term)) ||
      Object.values(p.material).some((m) => m.toLowerCase().includes(term)) ||
      p.reference.toLowerCase().includes(term)
    );
  }

  if (filters?.sort) {
    switch (filters.sort) {
      case 'price_asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.fr.localeCompare(b.name.fr));
        break;
    }
  }

  return filtered;
}

export async function getProductBySlug(
  slug: string,
  category?: string
): Promise<Product | null> {
  await simulateDelay();
  const product = mockProducts.find(
    (p) =>
      p.slug === slug && (!category || p.category.slug === category)
  );
  return product || null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  await simulateDelay();
  return mockProducts.filter((p) => p.featured).slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  await simulateDelay();
  return mockProducts.filter((p) => p.isNew).slice(0, limit);
}

export async function getCategories(): Promise<Category[]> {
  await simulateDelay();
  return loadMergedCategories();
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  await simulateDelay();
  const merged = await loadMergedCategories();
  return merged.find((c) => c.slug === slug) || null;
}

export async function getCollections(): Promise<Collection[]> {
  await simulateDelay();
  return mockCollections;
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  await simulateDelay();
  return mockCollections.find((c) => c.slug === slug) || null;
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  await simulateDelay();
  return mockProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category.slug === product.category.slug ||
          p.materialSlug === product.materialSlug)
    )
    .slice(0, limit);
}
