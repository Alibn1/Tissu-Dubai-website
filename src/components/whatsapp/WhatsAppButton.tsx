'use client';

import {useTranslations, useLocale} from 'next-intl';
import {MessageCircle} from 'lucide-react';
import {cn} from '@/lib/utils';
import {type Locale} from '@/types';
import {buildWhatsAppUrl, getWhatsAppNumber} from '@/lib/whatsapp';

const greetings: Record<Locale, string> = {
  fr: 'Bonjour, je suis intéressé(e) par vos tissus.',
  ar: 'مرحبًا، أنا مهتم(ة) بأقمشتكم.',
  en: 'Hello, I am interested in your fabrics.'
};

export function WhatsAppButton({className}: {className?: string}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const handleClick = () => {
    const number = getWhatsAppNumber();
    if (!number) return;

    window.open(
      buildWhatsAppUrl(number, greetings[locale] || greetings.fr),
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 end-6 z-50',
        'lg:bottom-8 lg:end-8',
        className
      )}
    >
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2',
          'bg-[#25D366] hover:bg-[#20BD5A] text-white',
          'rounded-full px-5 py-3.5',
          'shadow-lg hover:shadow-xl',
          'transition-all duration-300',
          'group'
        )}
        aria-label={t('common.whatsapp')}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">
          {t('common.whatsapp')}
        </span>
      </button>
    </div>
  );
}
