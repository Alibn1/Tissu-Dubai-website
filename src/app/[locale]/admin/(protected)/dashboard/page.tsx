import {setRequestLocale} from 'next-intl/server';
import {getDashboardData} from '@/lib/data/store';
import {Package, ChevronRight} from 'lucide-react';
import {Link} from '@/i18n/navigation';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminDashboardPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const {totalProducts, totalColorVariants, collectionBreakdown} = getDashboardData();

  return (
    <div className="min-h-full">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Aperçu de l&apos;activité de votre boutique
        </p>
      </div>

      <div className="space-y-4">
        {/* Product cards, centered */}
        <div className="flex flex-wrap items-stretch justify-center gap-4">
          <div className="w-full max-w-xs rounded-md border border-brand-border bg-brand-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-muted">Total produits</span>
              <Package className="h-5 w-5 text-brand-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold text-brand-secondary">{totalProducts}</p>
          </div>

          <Link
            href="/admin/colors"
            className="group w-full max-w-xs rounded-md border border-brand-border bg-brand-surface p-5 shadow-sm transition-colors hover:border-brand-primary/60"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-muted">Références (avec couleurs)</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-brand-secondary">{totalColorVariants}</p>
            <p className="mt-1 text-xs text-brand-muted">
              {totalProducts} produits
              {totalColorVariants - totalProducts > 0
                ? ` · ${totalColorVariants - totalProducts} couleurs supplémentaires`
                : ''}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
              Voir tous les produits et couleurs
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

        {/* Collection cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {collectionBreakdown.map((cat) => (
            <div
              key={cat.slug}
              className="rounded-md border border-brand-border bg-brand-surface p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-muted">{cat.name}</span>
                <span className="text-sm font-semibold text-brand-secondary">{cat.count}</span>
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-brand-light">
                  <div
                    className="h-1.5 rounded-full bg-brand-primary"
                    style={{width: `${cat.percentage}%`}}
                  />
                </div>
                <p className="mt-1.5 text-xs text-brand-muted">{cat.percentage}% du catalogue</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}