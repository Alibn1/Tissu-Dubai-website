'use client';

import {useLocale, useTranslations} from 'next-intl';
import {useRouter, usePathname} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {type Locale} from '@/types';
import {useState, useRef, useEffect} from 'react';

const localeConfig: Record<Locale, {label: string; dir: 'ltr' | 'rtl'}> = {
  fr: {label: 'Français', dir: 'ltr'},
  ar: {label: 'العربية', dir: 'rtl'},
  en: {label: 'English', dir: 'ltr'}
};

export function LanguageSwitcher({className}: {className?: string}) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLocaleChange(newLocale: Locale) {
    router.replace(pathname, {locale: newLocale});
    setIsOpen(false);
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium',
          'rounded-md border border-brand-border',
          'text-brand-secondary hover:bg-brand-light',
          'transition-colors duration-200'
        )}
        aria-label={t('common.menu')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-xs capitalize tracking-wider">
          {localeConfig[locale].label}
        </span>
        <svg
          className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Language selection"
          className={cn(
            'absolute top-full mt-1 z-50 min-w-[140px]',
            'bg-brand-surface border border-brand-border rounded-md shadow-lg',
            'py-1'
          )}
        >
          {(Object.keys(localeConfig) as Locale[]).map((loc) => (
            <button
              key={loc}
              role="option"
              aria-selected={loc === locale}
              onClick={() => handleLocaleChange(loc)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm transition-colors',
                loc === locale
                  ? 'bg-brand-primary/10 text-brand-primary font-medium'
                  : 'text-brand-secondary hover:bg-brand-light'
              )}
            >
              {localeConfig[loc].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
