import Image from 'next/image';
import {setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {getAllProducts} from '@/lib/data/store';
import {ArrowLeft, Package, ChevronRight} from 'lucide-react';
import {cn} from '@/lib/utils';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminColorsPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const products = getAllProducts();

  const variantCount = (p: (typeof products)[number]) => Math.max(p.variants?.length ?? 0, 1);

  const grouped = products.reduce<
    Record<string, {name: string; products: (typeof products)[number][]}>
  >((acc, p) => {
    const slug = p.collection.slug;
    if (!acc[slug]) acc[slug] = {name: p.collection.name.fr, products: []};
    acc[slug].products.push(p);
    return acc;
  }, {});

  const totalProducts = products.length;
  const totalVariants = products.reduce((sum, p) => sum + variantCount(p), 0);

  return (
    <div className="min-h-full">
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-brand-muted transition-colors hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Produits et couleurs
        </h1>
      </div>

      {/* Key metric cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-brand-border bg-brand-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-muted">Total produits</span>
            <Package className="h-5 w-5 text-brand-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold text-brand-secondary">{totalProducts}</p>
        </div>
        <div className="rounded-md border border-brand-border bg-brand-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-muted">Références (avec couleurs)</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-brand-secondary">{totalVariants}</p>
          <p className="mt-1 text-xs text-brand-muted">
            {totalProducts} produits
            {totalVariants - totalProducts > 0
              ? ` · ${totalVariants - totalProducts} couleurs supplémentaires`
              : ''}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([slug, group]) => {
          const groupVariants = group.products.reduce((sum, p) => sum + variantCount(p), 0);
          return (
            <section
              key={slug}
              className="overflow-hidden rounded-md border border-brand-border bg-brand-surface shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b border-brand-border px-5 py-4">
                <h2 className="font-heading text-base font-semibold text-brand-secondary">
                  {group.name}
                </h2>
                <span className="text-sm text-brand-muted">
                  {group.products.length} produit{group.products.length > 1 ? 's' : ''} ·{' '}
                  {groupVariants} couleur{groupVariants > 1 ? 's' : ''}
                </span>
              </div>

              <ul className="divide-y divide-brand-border">
                {group.products.map((product) => {
                  const count = variantCount(product);
                  const variants = product.variants ?? [];
                  return (
                    <li key={product.id} className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-brand-border bg-brand-light">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name.fr}
                              fill
                              sizes="48px"
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
                          <p className="text-xs text-brand-muted">
                            {product.reference} · {product.material?.fr}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
                          {count} couleur{count > 1 ? 's' : ''}
                        </span>
                      </div>

                      {variants.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 pl-[60px]">
                          {variants.map((v) => (
                            <span
                              key={v.id}
                              className="inline-flex items-center gap-2 rounded-full border border-brand-border px-3 py-1.5 text-xs text-brand-secondary"
                            >
                              {v.color.fr}
                              {v.price != null && (
                                <span className="text-brand-muted">{v.price} MAD</span>
                              )}
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1',
                                  v.inStock ? 'text-green-600' : 'text-brand-muted'
                                )}
                              >
                                <span
                                  className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    v.inStock ? 'bg-green-500' : 'bg-brand-muted/40'
                                  )}
                                />
                                {v.inStock ? 'En stock' : 'Épuisé'}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-brand-muted">
        <ChevronRight className="mr-1 inline h-3 w-3" />
        Modifiez les produits depuis la page Produits
      </p>
    </div>
  );
}