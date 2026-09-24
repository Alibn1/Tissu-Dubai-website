export const EXCLUSIVE_COLLECTION_SLUG = 'homme';

export function toggleCollectionSlugs(current: string[], slug: string): string[] {
  if (current.includes(slug)) return current.filter((s) => s !== slug);
  if (slug === EXCLUSIVE_COLLECTION_SLUG) return [EXCLUSIVE_COLLECTION_SLUG];
  return [...current.filter((s) => s !== EXCLUSIVE_COLLECTION_SLUG), slug];
}