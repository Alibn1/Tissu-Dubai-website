'use client';

import {useCompare} from '@/lib/compareContext';
import {MobileBottomBar} from '@/components/ui/MobileBottomBar';
import {BackToTop} from '@/components/ui/BackToTop';
import {CompareBar} from '@/components/product/CompareBar';

/**
 * The three bottom-of-screen affordances share one spot, so they are mounted
 * together: the compare tray takes over the bottom edge while it has items and
 * the phone bar steps aside, and back-to-top stays out of the way.
 */
export function ChromeBars() {
  const {items} = useCompare();

  return (
    <>
      <MobileBottomBar compareActive={items.length > 0} />
      <CompareBar />
      <BackToTop />
    </>
  );
}
