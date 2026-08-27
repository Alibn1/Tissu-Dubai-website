import {setRequestLocale, getTranslations} from 'next-intl/server';
import {products} from '@/mock/products';
import {Link} from '@/i18n/navigation';
import {Package, Edit, Search, Filter} from 'lucide-react';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminProductsPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: 'admin'});

  return (
    <div className="min-h-[70vh]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-secondary">
            Products
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Manage your product catalog ({products.length} products)
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
        >
          <Package className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-3 py-2">
          <Search className="h-4 w-4 text-brand-muted" />
          <input
            type="text"
            placeholder="Search products..."
            className="bg-transparent text-sm text-brand-secondary outline-none placeholder:text-brand-muted"
          />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-3 py-2">
          <Filter className="h-4 w-4 text-brand-muted" />
          <select className="bg-transparent text-sm text-brand-secondary outline-none">
            <option value="">All categories</option>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-brand-light/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-brand-light flex items-center justify-center">
                      <Package className="h-5 w-5 text-brand-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-secondary">
                        {product.name[locale as keyof typeof product.name] || product.name.fr}
                      </p>
                      <p className="text-xs text-brand-muted">
                        {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-brand-muted">{product.reference}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-brand-secondary capitalize">{product.category.slug}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-brand-secondary">
                    {product.price ? `${product.price.toLocaleString()} MAD` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {product.inStock ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Out of Stock
                      </span>
                    )}
                    {product.featured && (
                      <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                        Featured
                      </span>
                    )}
                    {product.isNew && (
                      <span className="inline-flex items rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        New
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-muted hover:bg-brand-light hover:text-brand-primary transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
