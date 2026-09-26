import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {Logo} from '@/components/ui/Logo';
import {Phone} from 'lucide-react';
import {GOOGLE_MAPS_EMBED_URL} from '@/lib/site';
import {resolveContact, type SiteSettings} from '@/lib/siteSettings';

function InstagramIcon({className}: {className?: string}) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TiktokIcon({className}: {className?: string}) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function FacebookIcon({className}: {className?: string}) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function Footer({siteSettings}: {siteSettings: SiteSettings}) {
  const t = useTranslations();
  const contact = resolveContact(siteSettings);
  const phone = contact.primaryPhone;
  const mapsUrl = GOOGLE_MAPS_EMBED_URL;
  const instagram = contact.social.instagram;
  const facebook = contact.social.facebook;
  const tiktok = contact.social.tiktok;

  const collections = [
    {label: t('nav.fabrics.hommeShort'), href: '/collections/homme'},
    {label: t('nav.fabrics.femmeShort'), href: '/collections/femme'}
  ];

  return (
    <footer className="bg-brand-light text-brand-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ps-2 sm:ps-3 lg:ps-4">
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-8 py-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">

          {/* Column 1: Brand */}
          <div className="space-y-4 pt-[80px]">
            <div className="flex items-center gap-4">
              <Logo variant="mark" size="md" />
              <h2 className="font-heading text-3xl font-bold text-brand-secondary">
                Tissu Dubai
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-brand-muted/80">
              {t('common.tagline')}
            </p>
          </div>

          {/* Column 2: Collections */}
          <div className="space-y-4">
            <h3 className="font-heading pt-6 text-xl font-bold uppercase tracking-wider text-brand-secondary">
              {t('common.collections')}
            </h3>
            <ul className="space-y-2">
              {collections.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-base text-brand-muted underline-offset-4 hover:underline hover:decoration-brand-accent hover:decoration-1 transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <h4 className="font-heading pt-6 text-lg font-bold uppercase tracking-wider text-brand-secondary">
                {t('common.followUs')}
              </h4>
              <div className="mt-3 flex items-center gap-4">
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-brand-muted/60 hover:text-brand-accent transition-colors duration-200"
                  >
                    <InstagramIcon className="h-6 w-6" />
                  </a>
                )}
                {tiktok && (
                  <a
                    href={tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="text-brand-muted/60 hover:text-brand-accent transition-colors duration-200"
                  >
                    <TiktokIcon className="h-6 w-6" />
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="text-brand-muted/60 hover:text-brand-accent transition-colors duration-200"
                  >
                    <FacebookIcon className="h-6 w-6" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Our Store */}
          <div className="space-y-3">
            <h3 className="font-heading pt-6 text-xl font-bold uppercase tracking-wider text-brand-secondary">
              {t('common.location')}
            </h3>
            {mapsUrl && (
              <div className="overflow-hidden rounded-md">
                <iframe
                  src={mapsUrl}
                  width="100%"
                  height="220"
                  style={{border: 0}}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Carte Tissu Dubai"
                  className="w-full"
                />
              </div>
            )}
            <div className="space-y-2">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 text-base text-brand-muted hover:text-brand-accent transition-colors duration-200"
                >
                  <Phone className="h-4 w-4 flex-shrink-0 text-brand-muted/60" />
                  {phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-5">
          <p className="text-center text-sm text-brand-muted/50">
            &copy; 2026 Tissu Dubai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
