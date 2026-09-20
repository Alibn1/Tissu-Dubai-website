import type {Model} from '@/types';

// One row per model; the collections a model belongs to are stored in the
// model_collections junction table (a model can be in several collections).
export const mockModels: Model[] = [
  // ── Caftan + Takchita ──
  {id: 'soie', slug: 'soie', collectionSlugs: ['caftan', 'tekchita'], name: {fr: 'Soie', en: 'Silk', ar: 'حرير'}},
  {id: 'brocard', slug: 'brocard', collectionSlugs: ['caftan', 'tekchita'], name: {fr: 'Brocard', en: 'Brocade', ar: 'بروكار'}},
  {id: 'velours', slug: 'velours', collectionSlugs: ['caftan', 'tekchita'], name: {fr: 'Velours', en: 'Velvet', ar: 'مخمل'}},

  // ── Caftan only ──
  {id: 'tulle', slug: 'tulle', collectionSlugs: ['caftan'], name: {fr: 'Tulle', en: 'Tulle', ar: 'تور'}},

  // ── Djellaba ──
  {id: 'laine', slug: 'laine', collectionSlugs: ['jellaba'], name: {fr: 'Laine', en: 'Wool', ar: 'صوف'}},
  {id: 'cachemire', slug: 'cachemire', collectionSlugs: ['jellaba'], name: {fr: 'Cachemire', en: 'Cashmere', ar: 'كشمير'}},
];