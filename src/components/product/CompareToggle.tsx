'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Check, Scale} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useCompare, type CompareItem} from '@/lib/compareContext';

/**
 * Sits on top of the product card image, outside its link, so the card stays a
 * single tap target while comparison stays one tap as well.
 */
export function CompareToggle({item}: {item: CompareItem}) {
  const t = useTranslations();
  const {isSelected, isFull, toggle} = useCompare();
  const [blocked, setBlocked] = useState(false);

  const selected = isSelected(item.id);

  useEffect(() => {
    if (!blocked) return;
    const timer = setTimeout(() => setBlocked(false), 2200);
    return () => clearTimeout(timer);
  }, [blocked]);

  const handleClick = () => {
    if (!selected && isFull) {
      setBlocked(true);
      return;
    }
    toggle(item);
  };

  return (
    <div className="absolute bottom-2.5 end-2.5 z-10">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={selected}
        aria-label={selected ? t('common.removeFromCompare') : t('common.addToCompare')}
        title={blocked ? t('common.compareFull') : selected ? t('common.removeFromCompare') : t('common.addToCompare')}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          'border backdrop-blur transition-colors duration-200',
          selected
            ? 'border-brand-primary bg-brand-primary text-white'
            : 'border-brand-border/70 bg-brand-surface/85 text-brand-secondary hover:bg-brand-light hover:text-brand-primary'
        )}
      >
        {selected ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
      </button>

      {blocked && (
        <p className="absolute bottom-10 end-0 w-max max-w-[14rem] rounded-md border border-brand-border bg-brand-light px-3 py-2 text-start text-xs text-brand-secondary shadow-lg">
          {t('common.compareFull')}
        </p>
      )}
    </div>
  );
}
