'use client';

import {useTranslations, useLocale} from 'next-intl';
import {Link, useRouter, usePathname} from '@/i18n/navigation';
import {Logo} from '@/components/ui/Logo';
import {LanguageSwitcher} from '@/components/ui/LanguageSwitcher';
import {cn} from '@/lib/utils';
import {useState, useEffect, useCallback} from 'react';
import {Menu, X, Phone} from 'lucide-react';

const navLinks = [
  {key: 'common.home', href: '/'},
  {key: 'common.collections', href: '/collections'},
  {key: 'common.about', href: '/a-propos'},
  {key: 'common.contact', href: '/contact'},
  {key: 'common.location', href: '/localisation'},
  {key: 'common.faq', href: '/faq'}
];

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === `/${locale}` || pathname === '/';

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, [isHome]);

  const handleNavHomeClick = useCallback(() => {
    setSidebarOpen(false);
    if (isHome) {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, [isHome]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'bg-brand-surface/80 backdrop-blur-xl shadow-sm border-b border-brand-border/30'
            : 'bg-brand-surface/60 backdrop-blur-md border-b border-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo + Brand Name */}
          <Link
            href="/"
            onClick={handleHomeClick}
            className="flex items-center gap-2.5 flex-shrink-0 group"
            aria-label={t('common.brand')}
          >
            <Logo size="md" />
            <span className="hidden sm:block font-heading text-lg font-bold text-brand-secondary group-hover:text-brand-primary transition-colors duration-200">
              Tissu Dubai
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                onClick={link.key === 'common.home' ? handleNavHomeClick : undefined}
                className={cn(
                  'nav-link-animated relative px-3 py-2 text-sm font-medium',
                  'text-brand-secondary hover:text-brand-primary',
                  'transition-colors duration-200'
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden sm:block" />

            <a
              href={`tel:${process.env.NEXT_PUBLIC_STORE_PHONE}`}
              className={cn(
                'hidden md:flex items-center gap-2 px-3 py-2 text-sm',
                'text-brand-secondary hover:text-brand-primary',
                'transition-colors duration-200 rounded-lg hover:bg-white/60'
              )}
              aria-label={t('common.phone')}
            >
              <Phone className="h-4 w-4" />
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={cn(
                'lg:hidden flex items-center justify-center',
                'h-10 w-10 rounded-lg',
                'text-brand-secondary hover:bg-white/60',
                'transition-colors duration-200'
              )}
              aria-label={t('common.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-brand-dark/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 z-[70] h-full w-[280px] bg-white shadow-2xl',
          'transition-transform duration-300 ease-out lg:hidden',
          'flex flex-col',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        dir="ltr"
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-brand-border/50">
          <Link
            href="/"
            onClick={handleNavHomeClick}
            className="flex items-center gap-2"
          >
            <Logo size="sm" />
            <span className="font-heading text-base font-bold text-brand-secondary">
              Tissu Dubai
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-brand-secondary hover:bg-brand-light transition-colors"
            aria-label={t('common.closeMenu')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={link.key === 'common.home' ? handleNavHomeClick : () => setSidebarOpen(false)}
              className={cn(
                'flex items-center px-3 py-3 text-[15px] font-medium rounded-lg',
                'text-brand-secondary hover:bg-brand-light hover:text-brand-primary',
                'transition-colors duration-150'
              )}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-brand-border/50 px-5 py-4 space-y-3">
          <LanguageSwitcher />
          <a
            href={`tel:${process.env.NEXT_PUBLIC_STORE_PHONE}`}
            className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary transition-colors"
          >
            <Phone className="h-4 w-4" />
            {process.env.NEXT_PUBLIC_STORE_PHONE}
          </a>
        </div>
      </div>
    </>
  );
}
