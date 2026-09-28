'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {CollectionCardLink} from '@/components/collection/CollectionCard';
import {type Collection, type Locale} from '@/types';

const PER_VIEW = 3;
const GAP = 24;
const AUTOPLAY_MS = 3800;

type Props = {
  collections: Collection[];
  locale: Locale;
};

export function CollectionCarousel({collections, locale}: Props) {
  const t = useTranslations('common');
  const slideRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef<1 | -1>(1);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  const isRtl = locale === 'ar';
  const maxIndex = Math.max(0, collections.length - PER_VIEW);

  useEffect(() => {
    const measure = () => {
      const slide = slideRef.current;
      if (slide) setStep(slide.getBoundingClientRect().width + GAP);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((prev) => {
        const next = prev + dir;
        if (next >= maxIndex) {
          directionRef.current = -1;
          return maxIndex;
        }
        if (next <= 0) {
          directionRef.current = 1;
          return 0;
        }
        directionRef.current = dir;
        return next;
      });
    },
    [maxIndex]
  );

  useEffect(() => {
    if (paused || maxIndex === 0) return;
    const id = setInterval(() => go(directionRef.current), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [go, paused, maxIndex]);

  const offset = isRtl ? index * step : -index * step;

  return (
    <div className="mt-10 lg:mt-12">
      {/* Mobile / tablet: stacked grid */}
      <div className="grid grid-cols-1 gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:hidden">
        {collections.map((collection) => (
          <CollectionCardLink key={collection.id} collection={collection} locale={locale} />
        ))}
      </div>

      {/* Desktop: full-bleed auto-scrolling carousel */}
      <div
        className="relative hidden lg:block"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex gap-6 px-6 will-change-transform"
          style={{
            transform: `translateX(${offset}px)`,
            transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          {collections.map((collection, i) => (
            <div
              key={collection.id}
              ref={i === 0 ? slideRef : undefined}
              className="shrink-0"
              style={{width: `calc((100% - ${GAP * (PER_VIEW - 1)}px) / ${PER_VIEW})`}}
            >
              <CollectionCardLink collection={collection} locale={locale} />
            </div>
          ))}
        </div>

        {maxIndex > 0 && (
          <div className="pointer-events-none absolute inset-y-0 flex items-center justify-between px-2">
            <button
              onClick={() => go(-1)}
              className={cn(
                'pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full',
                'border border-brand-border bg-brand-surface/90 text-brand-secondary',
                'shadow-lg backdrop-blur transition-colors duration-200',
                'hover:bg-brand-surface hover:text-brand-primary'
              )}
              aria-label={t('previous')}
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              onClick={() => go(1)}
              className={cn(
                'pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full',
                'border border-brand-border bg-brand-surface/90 text-brand-secondary',
                'shadow-lg backdrop-blur transition-colors duration-200',
                'hover:bg-brand-surface hover:text-brand-primary'
              )}
              aria-label={t('next')}
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
