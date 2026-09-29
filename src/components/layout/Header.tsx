'use client';

import {useTranslations, useLocale} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';
import {Logo} from '@/components/ui/Logo';
import {LanguageSwitcher} from '@/components/ui/LanguageSwitcher';
import {cn} from '@/lib/utils';
import {type SiteSettings, resolveContact} from '@/lib/siteSettings';
import {useState, useEffect, useCallback} from 'react';
import {Menu, X, Phone, Truck, ChevronDown} from 'lucide-react';

type NavChild = {key: string; href: string};
type NavItem = {key: string; href: string; children?: NavChild[]};

const collectionChildren: NavChild[] = [
  {key: 'nav.fabrics.caftanShort', href: '/collections/caftan'},
  {key: 'nav.fabrics.jellabaShort', href: '/collections/jellaba'},
  {key: 'nav.fabrics.tekchitaShort', href: '/collections/tekchita'},
  {key: 'nav.fabrics.hommeShort', href: '/collections/homme'}
];

const navLinks: NavItem[] = [
  {key: 'common.home', href: '/'},
  {key: 'common.collections', href: '/collections', children: collectionChildren},
  {key: 'common.about', href: '/a-propos'},
  {key: 'common.contact', href: '/contact'},
  {key: 'common.location', href: '/localisation'},
  {key: 'common.faq', href: '/faq'}
];

export function Header({siteSettings}: {siteSettings: SiteSettings}) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const phone = resolveContact(siteSettings).primaryPhone;

  const isHome = pathname === `/${locale}` || pathname === '/';

  const toggleSection = useCallback((key: string) => {
    setOpenSections((current) =>
      current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]
    );
  }, []);

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

  // Deep links such as /collections/caftan reveal their parent section on open,
  // derived from the current route instead of an effect.
  const activeSectionKey = navLinks.find(
    (link) => link.children && link.href !== '/' && pathname.startsWith(link.href)
  )?.key;

  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, [isHome]);

  const handleNavHomeClick = useCallback(() => {
    setSidebarOpen(false);
    setOpenSections([]);
    if (isHome) {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, [isHome]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setOpenSections([]);
  }, []);

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
        {/* Top bar (scrolls away under fixed navbar) */}
        <div
          className={cn(
            'flex h-9 items-center justify-center overflow-hidden bg-brand-light/95 px-4 text-center transition-all duration-300',
            scrolled ? 'max-h-0 py-0' : 'max-h-9'
          )}
        >
          <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-brand-gold-light sm:text-sm whitespace-nowrap">
            <Truck className="h-4 w-4 shrink-0" />
            {t('common.deliveryBanner')}
          </span>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:gap-8 lg:px-8">
          {/* Sidebar toggle (mobile) + Brand */}
          <div className="flex items-center gap-3 lg:gap-8">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={cn(
                'lg:hidden flex items-center justify-center',
                'h-10 w-10 rounded-lg',
                'text-brand-secondary hover:bg-brand-light',
                'transition-colors duration-200'
              )}
              aria-label={t('common.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              href="/"
              onClick={handleHomeClick}
              className="ms-3 flex items-center gap-2.5 flex-shrink-0 group lg:ms-0"
              aria-label={t('common.brand')}
            >
              <Logo size="lg" />
              <span className="hidden sm:block font-heading text-xl font-bold text-brand-secondary group-hover:text-brand-primary transition-colors duration-200">
                Tissu Dubai
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-0.5" aria-label="Main navigation">
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

          {/* Call icon then Language menu */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href={`tel:${phone}`}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                'text-brand-secondary hover:text-brand-primary',
                'transition-colors duration-200 hover:bg-brand-light'
              )}
              aria-label={t('common.phone')}
            >
              <Phone className="h-[18px] w-[18px]" />
            </a>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeSidebar}
      />

      {/* Mobile Sidebar — anchored to the inline-start edge: left in FR/EN, right in AR */}
      <div
        className={cn(
          'fixed inset-y-0 start-0 z-[70] w-[300px] max-w-[85vw] bg-brand-surface shadow-2xl',
          'transition-transform duration-300 ease-out lg:hidden',
          'flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        )}
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
            onClick={closeSidebar}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-brand-secondary hover:bg-brand-light transition-colors"
            aria-label={t('common.closeMenu')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile navigation">
          <ul className="space-y-0.5">
            {navLinks.map((link) => {
              const isSection = !!link.children?.length;
              const expanded = openSections.includes(link.key) || link.key === activeSectionKey;
              const isActive =
                link.href === '/' ? isHome : link.href !== '/' && pathname.startsWith(link.href);

              return (
                <li key={link.key}>
                  {isSection ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleSection(link.key)}
                        aria-expanded={expanded}
                        aria-controls={`${link.key}-submenu`}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3',
                          'text-[15px] font-medium transition-colors duration-150',
                          isActive
                            ? 'bg-brand-light text-brand-primary'
                            : 'text-brand-secondary hover:bg-brand-light hover:text-brand-primary'
                        )}
                      >
                        <span>{t(link.key)}</span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-200',
                            expanded && 'rotate-180'
                          )}
                        />
                      </button>

                      <ul
                        id={`${link.key}-submenu`}
                        hidden={!expanded}
                        className="mt-0.5 space-y-0.5 border-s border-brand-border ps-3 ms-3"
                      >
                        <li>
                          <Link
                            href={link.href}
                            onClick={closeSidebar}
                            className="block rounded-lg px-3 py-2.5 text-sm text-brand-muted transition-colors duration-150 hover:bg-brand-light hover:text-brand-primary"
                          >
                            {t('common.viewAll')}
                          </Link>
                        </li>
                        {link.children!.map((child) => (
                          <li key={child.key}>
                            <Link
                              href={child.href}
                              onClick={closeSidebar}
                              className={cn(
                                'block rounded-lg px-3 py-2.5 text-sm transition-colors duration-150',
                                pathname.endsWith(child.href)
                                  ? 'bg-brand-light text-brand-primary'
                                  : 'text-brand-secondary hover:bg-brand-light hover:text-brand-primary'
                              )}
                            >
                              {t(child.key)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={link.key === 'common.home' ? handleNavHomeClick : closeSidebar}
                      className={cn(
                        'flex items-center rounded-lg px-3 py-3 text-[15px] font-medium',
                        'transition-colors duration-150',
                        isActive
                          ? 'bg-brand-light text-brand-primary'
                          : 'text-brand-secondary hover:bg-brand-light hover:text-brand-primary'
                      )}
                    >
                      {t(link.key)}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
