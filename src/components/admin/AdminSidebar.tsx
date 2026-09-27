'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {cn} from '@/lib/utils';
import {LayoutDashboard, Package, Tags, Settings, LogOut, ExternalLink} from 'lucide-react';

const navItems = [
  {href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard},
  {href: '/admin/models', label: 'Modèles', icon: Tags},
  {href: '/admin/products', label: 'Produits', icon: Package},
  {href: '/admin/settings', label: 'Paramètres du site', icon: Settings},
];

export function AdminSidebar() {
  // Defensive: the pages are served through a locale-prefixed rewrite, so
  // usePathname can report either /admin/... or /fr/admin/... depending on
  // where the navigation came from. Normalise before matching.
  const pathname = (usePathname() ?? '').replace(/^\/(fr|ar|en)(?=\/|$)/, '');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {method: 'POST'});
      // Hard navigation so the admin layout re-renders server-side
      // without the session cookie and hides the sidebar. A client-side
      // router.push() would not re-run the server layout that reads the cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/admin/login';
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
