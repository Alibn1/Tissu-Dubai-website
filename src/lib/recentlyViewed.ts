'use client';

import {useSyncExternalStore} from 'react';
import {readStorage, writeStorage} from '@/lib/browserStorage';
import {type Locale} from '@/types';

const STORAGE_KEY = 'tissu-dubai:recently-viewed:v1';
export const MAX_RECENT_ITEMS = 8;

export type RecentlyViewedItem = {
  id: string;
  slug: string;
  href: string;
  image: string;
  price: number | null;
  name: Record<Locale, string>;
  material: Record<Locale, string>;
};

const EMPTY: RecentlyViewedItem[] = [];

let cache: RecentlyViewedItem[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): RecentlyViewedItem[] {
  if (cache === null) {
    const stored = readStorage<RecentlyViewedItem[]>(STORAGE_KEY, EMPTY);
    cache = Array.isArray(stored)
      ? stored.filter((item) => !!item && typeof item.id === 'string' && !!item.name)
      : EMPTY;
  }
  return cache;
}

function getServerSnapshot(): RecentlyViewedItem[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: RecentlyViewedItem[]): void {
  cache = next;
  writeStorage(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function useRecentlyViewed(): RecentlyViewedItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Moves the viewed product to the front and keeps the eight most recent. */
export function recordRecentlyViewed(item: RecentlyViewedItem): void {
  const current = getSnapshot();
  if (current[0]?.id === item.id) return;

  commit([item, ...current.filter((entry) => entry.id !== item.id)].slice(0, MAX_RECENT_ITEMS));
}

export function clearRecentlyViewed(): void {
  commit(EMPTY);
}
