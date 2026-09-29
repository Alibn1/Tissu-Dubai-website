'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {ArrowUp} from 'lucide-react';
import {cn} from '@/lib/utils';

/**
 * Desktop-only: on phones the bottom bar already carries Home for scroll-to-top,
 * and this corner holds the floating WhatsApp button.
 */
export function BackToTop() {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
      aria-label={t('common.backToTop')}
      className={cn(
        'fixed bottom-6 start-6 z-40 hidden lg:flex',
        'h-11 w-11 items-center justify-center rounded-full',
        'border border-brand-border bg-brand-surface/90 text-brand-secondary',
        'shadow-lg backdrop-blur transition-all duration-300',
        'hover:bg-brand-light hover:text-brand-primary',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
