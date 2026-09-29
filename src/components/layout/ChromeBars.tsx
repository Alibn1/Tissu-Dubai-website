'use client';

import {MobileBottomBar} from '@/components/ui/MobileBottomBar';
import {BackToTop} from '@/components/ui/BackToTop';

/**
 * The phone-only bottom bar and the desktop back-to-top button, mounted once so
 * they appear on every public page.
 */
export function ChromeBars() {
  return (
    <>
      <MobileBottomBar />
      <BackToTop />
    </>
  );
}
