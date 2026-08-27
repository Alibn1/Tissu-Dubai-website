'use client';

import {Link, usePathname, useRouter} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {LayoutDashboard, Mail, MessageCircle, Package, LogOut} from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard},
    {href: '/admin/requests', label: 'Requests', icon: Mail},
    {href: '/admin/products', label: 'Products', icon: Package},
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {method: 'POST'});
    router.push('/admin/login');
  };

  return (
    <nav className="mb-8 flex items-center justify-between border-b border-brand-border pb-4">
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname.includes(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-brand-secondary hover:bg-brand-light'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-xs text-brand-muted hover:text-brand-primary transition-colors"
        >
          View site
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-brand-muted hover:bg-brand-light hover:text-brand-secondary transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </nav>
  );
}
