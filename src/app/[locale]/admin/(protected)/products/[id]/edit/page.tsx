import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {products} from '@/mock/products';
import {ProductEditForm} from '@/components/admin/ProductEditForm';
import {ArrowLeft} from 'lucide-react';
import {Link} from '@/i18n/navigation';

type Props = {
  params: Promise<{locale: string; id: string}>;
};

export default async function AdminProductEditPage({params}: Props) {
  const {locale, id} = await params;
  setRequestLocale(locale);

  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <div className="min-h-[70vh]">
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux produits
        </Link>
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Modifier : {product.name.fr}
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Référence : {product.reference}
        </p>
      </div>

      <ProductEditForm product={product} locale={locale} />
    </div>
  );
}