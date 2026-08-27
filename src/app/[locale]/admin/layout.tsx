import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {AdminNav} from '@/components/admin/AdminNav';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default async function AdminLayout({children, params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const session = cookieStore.get('admin-session');

  // Login page: render without nav/auth guard
  if (!session) {
    return (
      <div className="min-h-screen bg-light">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </div>
      </div>
    );
  }

  // Protected pages: render with nav
  return (
    <div className="min-h-screen bg-light">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
