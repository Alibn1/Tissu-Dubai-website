'use client';

import {createContext, useContext} from 'react';
import type {SiteSettings} from '@/lib/siteSettings';

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings | null {
  return useContext(SiteSettingsContext);
}
