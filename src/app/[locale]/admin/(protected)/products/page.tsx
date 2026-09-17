import {setRequestLocale} from 'next-intl/server';
import {getAllProducts} from '@/lib/data/store';
import {Link} from '@/i18n/navigation';
import {Package} from 'lucide-react';
import {ProductsTable} from '@/components/admin/ProductsTable';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminProductsPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const products = getAllProducts();

  return (
    <div className="min-h-[70vh]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-secondary">
            Produits
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Gérez votre catalogue de produits ({products.length} produits)
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
        >
          <Package className="h-4 w-4" />
          Ajouter un produit
        </Link>
      </div>

      <ProductsTable initialProducts={products} locale={locale as 'fr' | 'ar' | 'en'} />
    </div>
  );
}