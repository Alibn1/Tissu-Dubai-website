'use client';

import {useCallback, useMemo, useSyncExternalStore} from 'react';
import {readStorage, writeStorage} from '@/lib/browserStorage';
import {type Locale} from '@/types';

const STORAGE_KEY = 'tissu-dubai:compare:v1';
export const MAX_COMPARE_ITEMS = 4;

export type CompareItem = {
  id: string;
  slug: string;
  href: string;
  image: string;
  price: number | null;
  inStock: boolean;
  width: string;
  name: Record<Locale, string>;
  material: Record<Locale, string>;
  collections: Record<Locale, string>[];
};

const EMPTY: CompareItem[] = [];

let cache: CompareItem[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): CompareItem[] {
  if (cache === null) {
    const stored = readStorage<CompareItem[]>(STORAGE_KEY, EMPTY);
    cache = Array.isArray(stored) ? stored.filter((item) => !!item && typeof item.id === 'string') : EMPTY;
  }
  return cache;
}

function getServerSnapshot(): CompareItem[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: CompareItem[]): void {
  cache = next;
  writeStorage(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function useCompare() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isSelected = useCallback(
    (id: string) => items.some((entry) => entry.id === id),
    [items]
  );

  const toggle = useCallback((item: CompareItem) => {
    const current = getSnapshot();
    if (current.some((entry) => entry.id === item.id)) {
      commit(current.filter((entry) => entry.id !== item.id));
      return;
    }
    if (current.length >= MAX_COMPARE_ITEMS) return;
    commit([...current, item]);
  }, []);

  const remove = useCallback((id: string) => {
    commit(getSnapshot().filter((entry) => entry.id !== id));
  }, []);

  const clear = useCallback(() => commit(EMPTY), []);

  return useMemo(
    () => ({
      items,
      isFull: items.length >= MAX_COMPARE_ITEMS,
      isSelected,
      toggle,
      remove,
      clear
    }),
    [items, isSelected, toggle, remove, clear]
  );
}
