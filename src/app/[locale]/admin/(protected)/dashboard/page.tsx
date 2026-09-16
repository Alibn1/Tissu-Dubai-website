import Image from 'next/image';
import {setRequestLocale} from 'next-intl/server';
import {getDashboardData} from '@/mock/dashboard';
import {getInquiries} from '@/lib/data/store';
import {Package, ChevronRight, TrendingUp, MessageCircle} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {cn} from '@/lib/utils';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminDashboardPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const {totalProducts, totalColorVariants, categoryBreakdown, topRequested} = getDashboardData();
  const inquiries = getInquiries();
  const recentInquiries = [...inquiries].reverse().slice(0, 10);
  const maxClicks = Math.max(...topRequested.map((p) => p.whatsappClicks), 1);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

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
      <div className="mb-8 space-y-4">
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

        {/* Category cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      </div>

      {/* Two main sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        {/* Demandes récentes */}
        <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-brand-border px-5 py-3">
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            <h2 className="font-heading text-base font-semibold text-brand-secondary">
              Demandes récentes
            </h2>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="p-8 text-center text-sm text-brand-muted">
              Aucune demande pour le moment.
            </div>
          ) : (
            <ul className="divide-y divide-brand-border">
              {recentInquiries.map((inquiry) => (
                <li key={inquiry.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-secondary">
                      {inquiry.productName}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {inquiry.reference}
                      {inquiry.color ? ` • ${inquiry.color}` : ''}
                      {inquiry.quantity > 0 ? ` • Qté ${inquiry.quantity}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-brand-muted">
                    {formatDate(inquiry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        </div>
    </div>
  );
}