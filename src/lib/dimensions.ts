import type {Locale} from '@/types';

// Normalizes a stored dimension string for display. Tolerates legacy formats
// ("300", "140x250", "140cm", "3 m × 140 cm", "140 سم") and always outputs
// numbers with a unit ("cm" — "سم" in Arabic) and spaces around "×".
export function formatDimensions(value: string, locale: Locale = 'fr'): string {
  const unit = locale === 'ar' ? 'سم' : 'cm';
  const unitRe = /(?:cm|سم)/i;
  const clean = value.trim();
  if (!clean) return clean;

  if (unitRe.test(clean)) {
    const unitG = new RegExp('(?:cm|سم)', 'gi');
    return clean
      .replace(/\s*[×xX]\s*/g, ' × ')
      .replace(unitG, ` ${unit}`)
      .replace(/(\d)([a-zA-Z\u0600-\u06FF])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const nums = clean.replace(',', '.').match(/\d+(\.\d+)?/g) ?? [];
  if (nums.length === 1) return `${nums[0]} ${unit}`;
  if (nums.length >= 2) return `${nums[0]} ${unit} × ${nums[1]} ${unit}`;
  return clean;
}

// Labels that introduce a dimension characteristic (Longueur / Largeur / …).
export const DIMENSION_LABEL_RE = /longueur|largeur|length|width|الطول|العرض/i;