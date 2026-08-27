'use client';

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {MessageCircle, ArrowRight} from 'lucide-react';
import {cn} from '@/lib/utils';
import {buildWhatsAppUrl, getWhatsAppNumber} from '@/lib/whatsapp';
import Image from 'next/image';

export function HeroSection() {
  const t = useTranslations('home.hero');

  return (
    <section className="relative overflow-hidden bg-brand-secondary">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.svg"
          alt=""
          fill
          priority
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-e from-brand-secondary via-brand-secondary/80 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
            {t('title')}
          </h1>

          <p className="mt-4 text-base text-white/80 sm:text-lg md:mt-6 md:text-xl max-w-xl leading-relaxed">
            {t('description')}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4 md:mt-10">
            <Link
              href="/collections"
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'bg-brand-primary hover:bg-brand-primary/90 text-white',
                'px-6 py-3 sm:px-8 sm:py-3.5 rounded-md',
                'text-sm font-semibold sm:text-base',
                'transition-colors duration-200',
                'shadow-lg'
              )}
            >
              {t('discover')}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href={buildWhatsAppUrl(getWhatsAppNumber(), '')}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'bg-[#25D366] hover:bg-[#20BD5A] text-white',
                'px-6 py-3 sm:px-8 sm:py-3.5 rounded-md',
                'text-sm font-semibold sm:text-base',
                'transition-colors duration-200'
              )}
            >
              <MessageCircle className="h-4 w-4" />
              {t('whatsapp')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
