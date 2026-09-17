export type LocalizedText = Partial<Record<'fr' | 'en' | 'ar', string>>;

/** Best-effort display name for a color, falling back across languages. */
export function localizedColorName(color?: LocalizedText | null): string {
  if (!color) return '';
  return (color.fr ?? '').trim() || (color.en ?? '').trim() || (color.ar ?? '').trim();
}

/** True when the variant has at least one non-empty image reference. */
export function hasImage(images?: string[] | null): boolean {
  return Array.isArray(images) && images.some((img) => typeof img === 'string' && img.trim() !== '');
}

/** Variants that are missing an image (used by both the forms and the API). */
export function variantsMissingImage<T extends {color?: LocalizedText | null; images?: string[] | null}>(
  variants: T[]
): T[] {
  return variants.filter((v) => !hasImage(v.images));
}

/** User-facing message listing the colors that still need an image. */
export function missingVariantImageMessage(colors: (LocalizedText | null | undefined)[]): string {
  const names = colors.map((color, i) => {
    const name = localizedColorName(color);
    return name ? `« ${name} »` : `la couleur #${i + 1}`;
  });
  if (names.length === 1) return `Ajoutez une image pour ${names[0]}.`;
  return `Ajoutez une image pour : ${names.join(', ')}.`;
}
