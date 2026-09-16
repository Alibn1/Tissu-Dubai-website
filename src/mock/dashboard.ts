import type {Product} from '@/types';
import {products} from '@/mock/products';

export interface ProductStat extends Product {
  /** Simulated WhatsApp order clicks (mock field for the dashboard) */
  whatsappClicks: number;
}

export interface CategoryBreakdown {
  slug: string;
  name: string;
  count: number;
  percentage: number;
}

export interface DashboardData {
  totalProducts: number;
  totalColorVariants: number;
  categoryBreakdown: CategoryBreakdown[];
  topRequested: ProductStat[];
  products: ProductStat[];
}

// ── Mock data (isolated: swap `getDashboardData` for a real API call later) ──

const whatsappClicksMock: Record<string, number> = {
  'prod-001': 342,
  'prod-002': 205,
  'prod-003': 120,
  'prod-004': 87,
  'prod-005': 63,
  'prod-006': 41,
  'prod-007': 29,
  'prod-008': 156,
  'prod-009': 98,
  'prod-010': 54,
  'prod-011': 22,
  'prod-012': 15,
  'prod-013': 178,
  'prod-014': 112,
  'prod-015': 46,
  'prod-016': 18,
};

export function getDashboardData(): DashboardData {
  const productStats: ProductStat[] = products.map((product) => ({
    ...product,
    whatsappClicks: whatsappClicksMock[product.id] ?? 0
  }));

  const totalProducts = productStats.length;

  // Each color variant counts as a sellable item (products without variants count as 1).
  const totalColorVariants = productStats.reduce(
    (sum, p) => sum + Math.max(p.variants?.length ?? 0, 1),
    0
  );

  const byCategory = productStats.reduce<Map<string, {slug: string; name: string; count: number}>>(
    (acc, product) => {
      const slug = product.category.slug;
      const existing = acc.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        acc.set(slug, {slug, name: product.category.name.fr, count: 1});
      }
      return acc;
    },
    new Map()
  );

  const categoryBreakdown: CategoryBreakdown[] = [...byCategory.values()]
    .map(({slug, name, count}) => ({
      slug,
      name,
      count,
      percentage: totalProducts ? Math.round((count / totalProducts) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const topRequested = [...productStats]
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks)
    .slice(0, 5);

  return {
    totalProducts,
    totalColorVariants,
    categoryBreakdown,
    topRequested,
    products: productStats,
  };
}