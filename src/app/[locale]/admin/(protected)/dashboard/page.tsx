import Image from 'next/image';
import {setRequestLocale} from 'next-intl/server';
import {getDashboardData} from '@/mock/dashboard';
import {Package, TrendingUp} from 'lucide-react';
import {cn} from '@/lib/utils';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminDashboardPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const {totalProducts, categoryBreakdown, topRequested} = getDashboardData();
  const maxClicks = Math.max(...topRequested.map((p) => p.whatsappClicks), 1);

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

      {/* Key metric cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-brand-border bg-brand-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-muted">Total produits</span>
            <Package className="h-5 w-5 text-brand-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold text-brand-secondary">{totalProducts}</p>
        </div>

        {categoryBreakdown.map((cat) => (
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

      {/* Most Requested Products */}
      <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-brand-border px-5 py-3">
            <TrendingUp className="h-4 w-4 text-brand-primary" />
            <h2 className="font-heading text-base font-semibold text-brand-secondary">
              Produits les plus demandés
            </h2>
          </div>

          <ul className="divide-y divide-brand-border">
            {topRequested.map((product, index) => (
              <li key={product.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="w-5 shrink-0 text-sm font-bold text-brand-muted">
                  {index + 1}
                </span>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-brand-light">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name.fr}
                      fill
                      sizes="40px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-brand-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-secondary">
                    {product.name.fr}
                  </p>
                  <p className="text-xs text-brand-muted">{product.reference}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="text-sm font-semibold text-brand-primary">
                    {product.whatsappClicks}
                  </span>
                  <span className="text-xs text-brand-muted">clics</span>
                </div>
                <div className="hidden h-6 w-20 shrink-0 items-end sm:flex">
                  <div
                    className={cn(
                      'w-full rounded-t-sm',
                      index === 0 ? 'bg-brand-primary' : 'bg-brand-primary/40'
                    )}
                    style={{height: `${Math.max((product.whatsappClicks / maxClicks) * 100, 8)}%`}}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
    </div>
  );
}