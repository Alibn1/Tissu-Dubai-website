import type {Product, Collection} from '@/types';
import {
  getAllProducts,
  getProductBySlug as getProductBySlugFromStore,
  getCollections as getCollectionsFromStore,
  getSiteSettings,
} from '@/lib/data/store';
import type {CollectionCard, HomepageContent} from '@/lib/siteSettings';

function getHomepageContent(): HomepageContent {
  return getSiteSettings().homepage;
}

function loadMergedCollections(): Collection[] {
  const homepage = getHomepageContent();
  const cardsBySlug = new Map<string, CollectionCard>(homepage.collectionCards.map((card) => [card.id, card]));

  return getCollectionsFromStore().map((cat) => {
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
  collection?: string;
  material?: string;
  color?: string;
  inStockOnly?: boolean;
  search?: string;
  sort?: string;
}): Promise<Product[]> {
  let filtered = [...getAllProducts()];

  if (filters?.collection) {
    filtered = filtered.filter((p) => p.collection.slug === filters.collection);
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
  if (filters?.inStockOnly) {
    filtered = filtered.filter((p) => p.inStock);
  }
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
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

export async function getProductBySlug(slug: string, collection?: string): Promise<Product | null> {
  return getProductBySlugFromStore(slug, collection);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return getAllProducts().filter((p) => p.featured).slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return getAllProducts().filter((p) => p.isNew).slice(0, limit);
}

export async function getCollections(): Promise<Collection[]> {
  return loadMergedCollections();
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const merged = loadMergedCollections();
  return merged.find((c) => c.slug === slug) || null;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return getAllProducts()
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.collection.slug === product.collection.slug || p.materialSlug === product.materialSlug)
    )
    .slice(0, limit);
}