'use client';

import {useTranslations} from 'next-intl';
import {MessageCircle} from 'lucide-react';
import {cn} from '@/lib/utils';
import {buildWhatsAppUrl, getWhatsAppNumber} from '@/lib/whatsapp';

export function WhatsAppCtaSection() {
  const t = useTranslations('home.whatsappCta');

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'rounded-lg border border-brand-border bg-brand-surface p-8 sm:p-12',
            'text-center shadow-sm',
            'transition-all duration-300',
            'hover:shadow-xl hover:-translate-y-1 hover:border-brand-primary/30'
          )}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]/10">
            <MessageCircle className="h-7 w-7 text-[#25D366]" />
          </div>

          <h2 className="font-heading text-xl font-bold text-brand-secondary sm:text-2xl md:text-3xl">
            {t('title')}
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-base text-brand-muted">
            {t('description')}
          </p>

          <a
            href={buildWhatsAppUrl(getWhatsAppNumber(), '')}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 mt-6',
              'bg-[#25D366] hover:bg-[#20BD5A] text-white',
              'px-8 py-3.5 rounded-md',
              'text-sm font-semibold sm:text-base',
              'transition-colors duration-200',
              'shadow-md'
            )}
          >
            <MessageCircle className="h-5 w-5" />
            {t('button')}
          </a>
        </div>
      </div>
    </section>
  );
}
