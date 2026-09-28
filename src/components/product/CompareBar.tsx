'use client';

import {useState} from 'react';
import Image from 'next/image';
import {useLocale, useTranslations} from 'next-intl';
import {Columns3, X} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {Modal} from '@/components/ui/Modal';
import {cn} from '@/lib/utils';
import {useCompare, type CompareItem} from '@/lib/compareContext';
import {type Locale} from '@/types';

function localise(record: Record<Locale, string>, locale: Locale): string {
  return record[locale] || record.fr;
}

/**
 * Sticky tray that appears as soon as a product is marked for comparison. It
 * replaces the mobile bottom bar (passed up through `compareActive`) so only one
 * bar ever sits at the bottom of the screen.
 */
export function CompareBar() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const {items, remove, clear} = useCompare();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-brand-surface/97 backdrop-blur-lg"
        style={{paddingBottom: 'env(safe-area-inset-bottom)'}}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <ul className="flex flex-1 items-center gap-2 overflow-x-auto">
            {items.map((item) => (
              <li key={item.id} className="relative shrink-0">
                <span className="block h-12 w-9 overflow-hidden rounded border border-brand-border bg-brand-light">
                  <Image src={item.image} alt="" fill sizes="36px" className="object-cover" />
                </span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`${t('common.removeFromCompare')}: ${localise(item.name, locale)}`}
                  className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-brand-secondary ring-1 ring-brand-border transition-colors hover:text-brand-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={clear}
            className="shrink-0 text-xs font-medium text-brand-muted transition-colors hover:text-brand-secondary"
          >
            {t('common.clear')}
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5',
              'text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90'
            )}
          >
            <Columns3 className="h-4 w-4" />
            {t('common.compare')}
            <span className="text-xs opacity-80">({items.length})</span>
          </button>
        </div>
      </div>

      <CompareModal open={open} onClose={() => setOpen(false)} items={items} />
    </>
  );
}

function CompareModal({
  open,
  onClose,
  items
}: {
  open: boolean;
  onClose: () => void;
  items: CompareItem[];
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  return (
    <Modal open={open} onClose={onClose} title={t('common.compareTitle')}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-brand-muted">{t('common.compareEmpty')}</p>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-start text-sm">
            <thead>
              <tr>
                <th className="w-28 pb-3 text-start text-xs font-medium uppercase tracking-wide text-brand-muted">
                  {t('product.name')}
                </th>
                {items.map((item) => (
                  <th key={item.id} className="px-2 pb-3 text-start align-bottom">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block overflow-hidden rounded border border-brand-border bg-brand-light"
                    >
                      <span className="relative block aspect-[3/4] w-full">
                        <Image src={item.image} alt="" fill sizes="160px" className="object-cover" />
                      </span>
                    </Link>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="mt-2 block font-heading text-sm font-semibold text-brand-secondary transition-colors hover:text-brand-primary"
                    >
                      {localise(item.name, locale)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_td]:border-t [&_td]:border-brand-border/60 [&_td]:px-2 [&_td]:py-3 [&_td]:align-top [&_th]:text-start">
              <tr>
                <th className="text-start text-xs font-medium text-brand-muted">{t('product.material')}</th>
                {items.map((item) => (
                  <td key={item.id} className="text-brand-secondary">
                    {localise(item.material, locale)}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="text-start text-xs font-medium text-brand-muted">{t('product.width')}</th>
                {items.map((item) => (
                  <td key={item.id} className="text-brand-secondary">
                    {item.width}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="text-start text-xs font-medium text-brand-muted">{t('product.price')}</th>
                {items.map((item) => (
                  <td key={item.id} className="font-semibold text-brand-primary">
                    {item.price !== null ? `${item.price} ${t('common.currency')}` : t('common.surDevis')}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="text-start text-xs font-medium text-brand-muted">{t('product.availability')}</th>
                {items.map((item) => (
                  <td key={item.id} className={item.inStock ? 'text-brand-success' : 'text-brand-muted'}>
                    {item.inStock ? t('common.inStock') : t('product.outOfStock')}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="text-start text-xs font-medium text-brand-muted">{t('common.compare')}</th>
                {items.map((item) => (
                  <td key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="font-semibold text-brand-primary transition-colors hover:text-brand-secondary"
                    >
                      {t('common.viewProduct')}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
