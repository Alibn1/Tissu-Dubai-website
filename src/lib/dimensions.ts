// Normalizes a stored dimension string for display. Tolerates legacy formats
// ("300", "140x250", "140cm", "3 m × 140 cm") and always outputs numbers with
// "cm" and spaces around "×".
export function formatDimensions(value: string): string {
  const clean = value.trim();
  if (!clean) return clean;

  if (/cm/i.test(clean)) {
    return clean
      .replace(/\s*[×xX]\s*/g, ' × ')
      .replace(/\s*cm/gi, ' cm')
      .replace(/(\d)([a-zA-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const nums = clean.replace(',', '.').match(/\d+(\.\d+)?/g) ?? [];
  if (nums.length === 1) return `${nums[0]} cm`;
  if (nums.length >= 2) return `${nums[0]} cm × ${nums[1]} cm`;
  return clean;
}

// Labels that introduce a dimension characteristic (Longueur / Largeur / …).
export const DIMENSION_LABEL_RE = /longueur|largeur|length|width|الطول|العرض/i;