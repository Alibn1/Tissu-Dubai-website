import {cookies, headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {AdminSidebar} from '@/components/admin/AdminSidebar';
import {readSession, sessionMatchesAccessIdentity, SESSION_COOKIE} from '@/lib/adminAuth';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

// Already reads a cookie, so Next.js treats these routes as dynamic; stated
// explicitly because the admin also reads and writes D1.
export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({children, params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const session = readSession(cookieStore.get(SESSION_COOKIE)?.value);

  // A valid signature is not enough: the session also has to be presented by
  // the same Cloudflare Access identity it was issued to.
  if (!session || !sessionMatchesAccessIdentity(session, headerList)) {
    redirect('/admin/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-light">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
