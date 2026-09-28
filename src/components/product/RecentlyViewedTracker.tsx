'use client';

import {useEffect} from 'react';
import {recordRecentlyViewed, type RecentlyViewedItem} from '@/lib/recentlyViewed';

/**
 * Rendered once per product page: stores a small snapshot so the "recently
 * viewed" row can be shown without another database round trip.
 */
export function RecentlyViewedTracker({item}: {item: RecentlyViewedItem}) {
  useEffect(() => {
    recordRecentlyViewed(item);
  }, [item]);

  return null;
}