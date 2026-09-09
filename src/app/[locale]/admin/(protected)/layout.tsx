import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {AdminSidebar} from '@/components/admin/AdminSidebar';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default async function AdminProtectedLayout({children, params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const session = cookieStore.get('admin-session');

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-light">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
