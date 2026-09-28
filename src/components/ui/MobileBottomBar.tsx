'use client';

import {useTranslations, useLocale} from 'next-intl';
import {Grid2X2, Home, MessageCircle, Phone} from 'lucide-react';
import {Link, usePathname} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {type Locale} from '@/types';
import {buildWhatsAppUrl, getWhatsAppNumber} from '@/lib/whatsapp';
import {useSiteSettings} from '@/lib/siteSettingsContext';

const greetings: Record<Locale, string> = {
  fr: 'Bonjour, je suis intéressé(e) par vos tissus.',
  ar: 'مرحباً، أنا مهتم بأقمشتكم.',
  en: 'Hello, I am interested in your fabrics.'
};

/**
 * Fixed bottom navigation for phones: the actions a shopper needs most are
 * always one thumb-tap away, which removes the scroll back to the header.
 * The floating WhatsApp button is hidden below `lg` because this replaces it.
 */
export function MobileBottomBar({compareActive}: {compareActive?: boolean}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const settings = useSiteSettings();

  const isHome = pathname === `/${locale}` || pathname === '/';
  const isCollections = pathname.startsWith('/collections');
  const phone = settings?.contact.phones?.[0]?.trim() || process.env.NEXT_PUBLIC_STORE_PHONE || '';
  const whatsapp = getWhatsAppNumber(settings);

  if (compareActive) return null;

  const itemClass =
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors duration-200';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-border bg-brand-surface/95 backdrop-blur-lg lg:hidden"
      style={{paddingBottom: 'env(safe-area-inset-bottom)'}}
      aria-label={t('common.menu')}
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        <Link
          href="/"
          onClick={(event) => {
            if (isHome) {
              event.preventDefault();
              window.scrollTo({top: 0, behavior: 'smooth'});
            }
          }}
          aria-current={isHome ? 'page' : undefined}
          className={cn(itemClass, isHome ? 'text-brand-primary' : 'text-brand-muted')}
        >
          <Home className="h-5 w-5" />
          <span className="truncate px-1">{t('common.home')}</span>
        </Link>

        <Link
          href="/collections"
          aria-current={isCollections ? 'page' : undefined}
          className={cn(itemClass, isCollections ? 'text-brand-primary' : 'text-brand-muted')}
        >
          <Grid2X2 className="h-5 w-5" />
          <span className="truncate px-1">{t('common.collections')}</span>
        </Link>

        <a
          href={whatsapp ? buildWhatsAppUrl(whatsapp, greetings[locale] || greetings.fr) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('common.whatsapp')}
          className={cn(itemClass, 'text-[#25D366]')}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="truncate px-1">{t('common.whatsapp')}</span>
        </a>

        <a
          href={phone ? `tel:${phone}` : undefined}
          aria-label={t('common.callUs')}
          className={cn(itemClass, 'text-brand-secondary')}
        >
          <Phone className="h-5 w-5" />
          <span className="truncate px-1">{t('common.callUs')}</span>
        </a>
      </div>
    </nav>
  );
}
