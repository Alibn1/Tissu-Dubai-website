import {setRequestLocale} from 'next-intl/server';
import {getCategories, getModels} from '@/lib/data/store';
import {ProductForm} from '@/components/admin/ProductForm';
import {ArrowLeft} from 'lucide-react';
import {Link} from '@/i18n/navigation';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminNewProductPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const collections = getCategories();
  const models = getModels();

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="mb-4 inline-flex items-center gap-1 text-sm text-brand-muted transition-colors hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux produits
        </Link>
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Nouveau produit
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Renseignez les informations du produit et son référencement
        </p>
      </div>

      <ProductForm mode="create" collections={collections} models={models} />
    </div>
  );
}