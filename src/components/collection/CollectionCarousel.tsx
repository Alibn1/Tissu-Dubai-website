'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {CollectionCardLink} from '@/components/collection/CollectionCard';
import {type Collection, type Locale} from '@/types';

const PER_VIEW = 3;
const GAP = 32;
const SIDE_PADDING = 56;
const AUTOPLAY_MS = 3800;

type Props = {
  collections: Collection[];
  locale: Locale;
};

export function CollectionCarousel({collections, locale}: Props) {
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
          className="flex will-change-transform"
          style={{
            gap: `${GAP}px`,
            paddingInline: `${SIDE_PADDING}px`,
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
      </div>
    </div>
  );
}
