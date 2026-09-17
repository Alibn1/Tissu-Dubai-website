import {setRequestLocale} from 'next-intl/server';
import {SiteSettingsForm} from '@/components/admin/SiteSettingsForm';
import {getSiteSettings} from '@/lib/data/store';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminSettingsPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Paramètres du site
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Gérez les coordonnées, horaires, FAQ, textes et images du site
        </p>
      </div>

      <SiteSettingsForm initialData={getSiteSettings()} />
    </div>
  );
}