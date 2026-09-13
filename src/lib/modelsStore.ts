import type {Model} from '@/types';
import {mockModels} from '@/mock/models';

const STORAGE_KEY = 'tissudubai.models';

export function getModels(): Model[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Model[];
      }
    } catch {
      // fall through to mock data
    }
  }
  return mockModels;
}

export function saveModels(models: Model[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  } catch {
    // storage unavailable — ignore
  }
}

export function getModelsByCollection(collectionSlug: string): Model[] {
  return getModels().filter((m) => m.collectionSlug === collectionSlug);
}

// id = `${slug}-${collectionSlug}`: unique per (slug, collection) pair and a
// stable value for filters/selects. Re-adding the same slug under the same
// collection overwrites the existing entry.
export function upsertModel(model: Model): void {
  const models = getModels().filter((m) => m.id !== model.id);
  models.push(model);
  saveModels(models);
}

export function removeModel(id: string): void {
  saveModels(getModels().filter((m) => m.id !== id));
}