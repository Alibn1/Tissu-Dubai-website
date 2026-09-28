'use client';

import {useEffect, useRef, useState} from 'react';
import {CollectionCardLink} from '@/components/collection/CollectionCard';
import {type Collection, type Locale} from '@/types';

const PER_VIEW = 3;
const GAP = 32;
const SIDE_PADDING = 56;
const SPEED_PX_PER_SEC = 60;

type Props = {
  collections: Collection[];
  locale: Locale;
};

export function CollectionCarousel({collections, locale}: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(30);

  // Keep the scroll speed constant: one full row takes width / speed seconds,
  // re-measured whenever the row resizes.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const measure = () => {
      const width = row.getBoundingClientRect().width;
      if (width > 0) setDuration(width / SPEED_PX_PER_SEC);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  // Row = leading margin + the visible cards + their gaps + a trailing gap, so
  // exactly PER_VIEW cards fill the page width and the copy boundary is even.
  const cardWidth = `calc((100cqw - ${SIDE_PADDING + GAP * 3}px) / ${PER_VIEW})`;
  const rowStyle = {
    gap: `${GAP}px`,
    paddingInlineStart: `${SIDE_PADDING}px`,
    paddingInlineEnd: `${GAP}px`
  };

  return (
    <div className="mt-10 lg:mt-12">
      {/* Mobile / tablet: stacked grid */}
      <div className="grid grid-cols-1 gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:hidden">
        {collections.map((collection) => (
          <CollectionCardLink key={collection.id} collection={collection} locale={locale} />
        ))}
      </div>

      {/* Desktop: seamless infinite marquee */}
      <div className="hidden overflow-hidden lg:block [container-type:inline-size]">
        <div
          className="marquee-track flex w-max"
          style={{'--marquee-duration': `${duration}s`} as React.CSSProperties}
        >
          {[0, 1].map((copy) => (
            <div
              key={copy}
              ref={copy === 0 ? rowRef : undefined}
              className="flex shrink-0"
              style={rowStyle}
            >
              {collections.map((collection) => (
                <div key={collection.id} className="shrink-0" style={{width: cardWidth}}>
                  <CollectionCardLink collection={collection} locale={locale} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
