'use client';

import {usePathname} from '@/i18n/navigation';
import {Header} from '@/components/layout/Header';
import {Footer} from '@/components/layout/Footer';
import {WhatsAppButton} from '@/components/whatsapp/WhatsAppButton';
import {type SiteSettings} from '@/lib/siteSettings';

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
    <>
      <Header siteSettings={settings} />
      <main className="flex-1 pt-[100px]">{children}</main>
      <Footer siteSettings={settings} />
      <WhatsAppButton />
    </>
  );
}
