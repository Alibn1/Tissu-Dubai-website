'use client';

import {usePathname} from '@/i18n/navigation';
import {Header} from '@/components/layout/Header';
import {Footer} from '@/components/layout/Footer';
import {WhatsAppButton} from '@/components/whatsapp/WhatsAppButton';

export function SiteChrome({children}: {children: React.ReactNode}) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 pt-[100px]">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
