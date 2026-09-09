'use client';

import {Link, usePathname} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {LayoutDashboard, Package, LogOut, ExternalLink} from 'lucide-react';

const navItems = [
  {href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard},
  {href: '/admin/products', label: 'Produits', icon: Package},
];

export function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {method: 'POST'});
    // Hard navigation so the admin layout re-renders server-side
    // without the session cookie and hides the sidebar.
    window.location.href = '/fr/admin/login';
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-brand-border bg-brand-surface">
      <div className="flex h-16 shrink-0 items-center border-b border-brand-border px-6">
        <span className="font-heading text-lg font-bold text-brand-primary">
          Administration
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-primary/15 text-brand-primary'
                  : 'text-brand-muted hover:bg-brand-light/60 hover:text-brand-secondary'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-brand-border p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-brand-muted hover:bg-brand-light/60 hover:text-brand-secondary transition-colors"
        >
          <ExternalLink className="h-5 w-5" />
          Voir le site
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-brand-muted hover:bg-brand-light/60 hover:text-brand-error transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
