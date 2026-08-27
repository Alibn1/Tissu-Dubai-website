import {describe, it, expect} from 'vitest';
import {products} from '@/mock/products';
import {categories} from '@/mock/categories';
import {collections} from '@/mock/collections';

describe('Mock Data', () => {
  describe('Products', () => {
    it('has 16 products', () => {
      expect(products).toHaveLength(16);
    });

    it('all products have required fields', () => {
      products.forEach((product) => {
        expect(product.id).toBeTruthy();
        expect(product.slug).toBeTruthy();
        expect(product.name.fr).toBeTruthy();
        expect(product.name.ar).toBeTruthy();
        expect(product.name.en).toBeTruthy();
        expect(product.reference).toBeTruthy();
        expect(product.material.fr).toBeTruthy();
        expect(product.variants.length).toBeGreaterThan(0);
        expect(product.images.length).toBeGreaterThan(0);
      });
    });

    it('has products in each category', () => {
      const slugs = categories.map((c) => c.slug);
      slugs.forEach((slug) => {
        const filtered = products.filter((p) => p.category.slug === slug);
        expect(filtered.length).toBeGreaterThan(0);
      });
    });

    it('has at least 3 featured products', () => {
      const featured = products.filter((p) => p.featured);
      expect(featured.length).toBeGreaterThanOrEqual(3);
    });

    it('has at least 4 new products', () => {
      const newProducts = products.filter((p) => p.isNew);
      expect(newProducts.length).toBeGreaterThanOrEqual(4);
    });

    it('has unique slugs', () => {
      const slugs = products.map((p) => p.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('has unique references', () => {
      const refs = products.map((p) => p.reference);
      expect(new Set(refs).size).toBe(refs.length);
    });

    it('each variant has unique SKU', () => {
      const skus = products.flatMap((p) => p.variants.map((v) => v.sku));
      expect(new Set(skus).size).toBe(skus.length);
    });

    it('price is number or null', () => {
      products.forEach((p) => {
        expect(typeof p.price === 'number' || p.price === null).toBe(true);
      });
    });
  });

  describe('Categories', () => {
    it('has 3 categories', () => {
      expect(categories).toHaveLength(3);
    });

    it('all categories have translations', () => {
      categories.forEach((cat) => {
        expect(cat.name.fr).toBeTruthy();
        expect(cat.name.ar).toBeTruthy();
        expect(cat.name.en).toBeTruthy();
      });
    });
  });

  describe('Collections', () => {
    it('has 3 collections', () => {
      expect(collections).toHaveLength(3);
    });

    it('all collections have translations', () => {
      collections.forEach((col) => {
        expect(col.name.fr).toBeTruthy();
        expect(col.name.ar).toBeTruthy();
        expect(col.name.en).toBeTruthy();
      });
    });
  });
});
