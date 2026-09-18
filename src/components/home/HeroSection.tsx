'use client';

import {useTranslations, useLocale} from 'next-intl';
import Image from 'next/image';
import {Link} from '@/i18n/navigation';
import {MessageCircle, ArrowRight} from 'lucide-react';
import {cn} from '@/lib/utils';
import {buildWhatsAppUrl, getWhatsAppNumber} from '@/lib/whatsapp';
import {useSiteSettings} from '@/lib/siteSettingsContext';
import type {Locale} from '@/types';

const DEFAULT_HERO_IMAGE = '/images/Herobackground.jpg';

export function HeroSection() {
  const t = useTranslations('home.hero');
  const locale = useLocale() as Locale;
  const settings = useSiteSettings();

  const hero = settings?.homepage?.hero;
  const image = hero?.image?.trim() || DEFAULT_HERO_IMAGE;
  const title = hero?.title?.[locale]?.trim() || t('title');
  const subtitle = hero?.subtitle?.[locale]?.trim() || t('description');

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-8xl px-6 sm:px-8 lg:px-12 pt-4 sm:pt-6 pb-12 sm:pb-16 lg:pb-20">
        <div className="relative overflow-hidden rounded-md border border-brand-border">
          {/* Hero background image */}
          <Image
            src={image}
            alt={title}
            fill
            priority
            unoptimized
            sizes="(max-width: 1024px) 100vw, 100vw"
            className="object-cover"
          />
          {/* Readable overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

          {/* Content overlaid on the image */}
          <div className="relative max-w-2xl py-16 px-6 sm:py-24 sm:px-10 lg:py-28">
            <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl md:text-5xl leading-tight">
              {title}
            </h1>

            <p className="mt-4 text-base text-white/80 sm:text-lg md:mt-6 md:text-xl max-w-xl leading-relaxed">
              {subtitle}
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
                href={buildWhatsAppUrl(getWhatsAppNumber(settings), '')}
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
      </div>
    </section>
  );
}
