'use client';

import {usePathname} from '@/i18n/navigation';
import {Header} from '@/components/layout/Header';
import {Footer} from '@/components/layout/Footer';
import {WhatsAppButton} from '@/components/whatsapp/WhatsAppButton';
import {ChromeBars} from '@/components/layout/ChromeBars';
import {type SiteSettings} from '@/lib/siteSettings';
import {SiteSettingsProvider} from '@/lib/siteSettingsContext';

export function SiteChrome({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <SiteSettingsProvider settings={settings}>
      <Header siteSettings={settings} />
      {/* pb clears the fixed bottom bar on phones only. */}
      <main className="flex-1 pt-[100px] pb-16 lg:pb-0">{children}</main>
      <Footer siteSettings={settings} />
      <ChromeBars />
      <WhatsAppButton className="hidden lg:flex" />
    </SiteSettingsProvider>
  );
}
