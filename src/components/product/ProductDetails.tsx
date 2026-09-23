'use client';

import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {formatDimensions, DIMENSION_LABEL_RE} from '@/lib/dimensions';
import {type Product, type Locale} from '@/types';

// Groups a characteristic line by its label so equivalent lines match across
// languages despite sparse arrays (e.g. "Composition" == "Composition",
// "Longueur / Largeur" == "Length / Width" == "الطول / العرض").
function characteristicKey(line: string): string {
  const label = line.split(':')[0].trim().toLowerCase();
  if (/composition|التركيب/.test(label)) return 'composition';
  if (/longueur|largeur|length|width|الطول|العرض/.test(label)) return 'dimensions';
  if (/origine|origin|المصدر|منشأ/.test(label)) return 'origin';
  return label.replace(/[^a-z0-9]/g, '');
}

// Per-line merge: for each characteristic shown in the richest language, use
// the current locale's line when present, otherwise fall back to French.
function mergeCharacteristics(product: Product, locale: Locale): string[] {
  const fr = product.characteristics.fr ?? [];
  const target = product.characteristics[locale] ?? [];
  const frMap = new Map(fr.map((l) => [characteristicKey(l), l]));
  const targetMap = new Map(target.map((l) => [characteristicKey(l), l]));

  const keys = [...fr.map(characteristicKey)];
  for (const key of targetMap.keys()) if (!keys.includes(key)) keys.push(key);
  return keys
    .map((key) => targetMap.get(key) ?? frMap.get(key))
    .filter((l): l is string => l !== undefined);
}

type ProductDetailsProps = {
  product: Product;
  locale: Locale;
};

export function ProductDetails({product, locale}: ProductDetailsProps) {
  const t = useTranslations();

  const description = product.description[locale] || product.description.fr;
  const characteristics = mergeCharacteristics(product, locale).map((char) => {
    if (!DIMENSION_LABEL_RE.test(char)) return char;
    const sep = char.indexOf(':');
    if (sep === -1) return formatDimensions(char, locale);
    return `${char.slice(0, sep + 1)} ${formatDimensions(char.slice(sep + 1), locale)}`;
  });

  return (
    <div className="mt-12 space-y-8 border-t border-brand-border pt-8">
      {/* Description */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-3">
          {t('product.description')}
        </h2>
        <p className="text-sm leading-relaxed text-brand-muted max-w-3xl">
          {description}
        </p>
      </div>

      {/* Characteristics */}
      {characteristics.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-3">
            {t('product.characteristics')}
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-3xl">
            {characteristics.map((char, idx) => (
              <li
                key={idx}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  'py-2 border-b border-brand-border/50'
                )}
              >
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                <span className="text-brand-muted">{char}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
