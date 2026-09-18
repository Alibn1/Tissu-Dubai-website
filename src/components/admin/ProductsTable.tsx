'use client';

import {useMemo, useState} from 'react';
import {Link} from '@/i18n/navigation';
import {Edit, Loader2, Package, Search, Filter, Trash2} from 'lucide-react';
import type {Locale, Product} from '@/types';

export function ProductsTable({
  initialProducts,
  locale,
}: {
  initialProducts: Product[];
  locale: Locale;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const collectionCounts = useMemo(() => {
    const acc = new Map<string, {slug: string; name: string; count: number}>();
    for (const product of products) {
      const slug = product.collection.slug;
      const existing = acc.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        acc.set(slug, {slug, name: product.collection.name.fr, count: 1});
      }
    }
    return [...acc.values()].sort((a, b) => b.count - a.count);
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (collectionFilter && p.collection.slug !== collectionFilter) return false;
      if (!q) return true;
      const name = p.name[locale] || p.name.fr;
      return (
        name.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q)
      );
    });
  }, [products, query, collectionFilter, locale]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce produit ? Cette action est irréversible.')) return;
    setBusyId(id);
    try {
      await fetch(`/api/products/${id}`, {method: 'DELETE'});
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {/* Collection counts */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {collectionCounts.map((cat) => (
          <div
            key={cat.slug}
            className="flex items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-4 py-2.5"
          >
            <span className="text-sm font-medium text-brand-secondary">{cat.name}</span>
            <span className="rounded-full bg-brand-primary/15 px-2.5 py-0.5 text-sm font-semibold text-brand-primary">
              {cat.count}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-3 py-2">
          <Search className="h-4 w-4 text-brand-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des produits..."
            className="bg-transparent text-sm text-brand-secondary outline-none placeholder:text-brand-muted"
          />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-3 py-2">
          <Filter className="h-4 w-4 text-brand-muted" />
          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="bg-transparent text-sm text-brand-secondary outline-none"
          >
            <option value="">Toutes les collections</option>
            <option value="caftan">Caftans</option>
            <option value="jellaba">Djellabas</option>
            <option value="tekchita">Takchitas</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-md border border-brand-border bg-brand-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-border bg-brand-light/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Produit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Référence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Collection</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Prix</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-brand-light/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-brand-light flex items-center justify-center">
                      <Package className="h-5 w-5 text-brand-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-secondary">
                        {product.name[locale] || product.name.fr}
                      </p>
                      <p className="text-xs text-brand-muted">
                        {product.variants.length} variante{product.variants.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-brand-muted">{product.reference}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-brand-secondary capitalize">{product.collection.slug}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-brand-secondary">
                    {product.price ? `${product.price.toLocaleString()} MAD` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {product.inStock ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        En stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Rupture de stock
                      </span>
                    )}
                    {product.featured && (
                      <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                        En vedette
                      </span>
                    )}
                    {product.isNew && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Nouveau
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-muted hover:bg-brand-light hover:text-brand-primary transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Modifier
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      disabled={busyId === product.id}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-muted hover:bg-red-50 hover:text-brand-error transition-colors disabled:opacity-50"
                    >
                      {busyId === product.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-brand-muted">
                  Aucun produit trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}