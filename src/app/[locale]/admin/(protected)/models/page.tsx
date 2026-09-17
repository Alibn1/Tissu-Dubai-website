import {setRequestLocale} from 'next-intl/server';
import {getCategories, getModels} from '@/lib/data/store';
import {ModelsManager} from '@/components/admin/ModelsManager';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminModelsPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const collections = getCategories();
  const models = getModels();

  return (
    <div className="min-h-[70vh]">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Modèles
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Gérez les modèles disponibles par collection
        </p>
      </div>

      <ModelsManager collections={collections} initialModels={models} />
    </div>
  );
}