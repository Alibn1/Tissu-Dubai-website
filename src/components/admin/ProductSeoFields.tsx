'use client';

import {cn} from '@/lib/utils';
import type {Locale} from '@/types';
import {
  generateSeoAltImage,
  generateSeoDescription,
  generateSeoTitle,
  type ProductSeoByLanguage,
  type SeoFieldKey,
} from '@/lib/productSeo';
import {Search as SearchIcon} from 'lucide-react';

const LANGUAGES: {key: Locale; label: string; dir: 'ltr' | 'rtl'}[] = [
  {key: 'fr', label: 'Français', dir: 'ltr'},
  {key: 'en', label: 'English', dir: 'ltr'},
  {key: 'ar', label: 'العربية', dir: 'rtl'},
];

const inputClass = cn(
  'w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-secondary',
  'placeholder:text-brand-muted/70',
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
);

function Toggle({checked, onChange}: {checked: boolean; onChange: (v: boolean) => void}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Activer les champs SEO personnalisés"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand-primary' : 'bg-brand-light'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
          checked ? 'left-[18px]' : 'left-0.5'
        )}
      />
    </button>
  );
}

function SeoField({
  label,
  value,
  placeholder,
  final,
  textarea,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  final: string;
  textarea?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(inputClass, 'resize-none')}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      <p className="mt-1 text-xs text-brand-muted">
        Final:{' '}
        <span className="font-medium text-brand-primary">{final || '—'}</span>
      </p>
    </div>
  );
}

type Props = {
  seo: ProductSeoByLanguage;
  /** Localized product name, used to build the auto-generated previews. */
  names: Record<Locale, string>;
  onFieldChange: (lang: Locale, field: SeoFieldKey, value: string) => void;
  onEnabledChange: (lang: Locale, enabled: boolean) => void;
};

/**
 * Per-language SEO overrides with a live preview of the value that will be
 * published. Shared by the create and edit product forms so both stay in sync.
 */
export function ProductSeoFields({seo, names, onFieldChange, onEnabledChange}: Props) {
  const resolveFinal = (lang: Locale, field: SeoFieldKey, auto: string) => {
    const override = seo[lang][field]?.trim();
    return seo[lang].enabled && override ? override : auto;
  };

  return (
    <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
      <div className="flex items-start gap-3 border-b border-brand-border px-5 py-4">
        <SearchIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
        <div>
          <h2 className="font-heading text-base font-semibold text-brand-secondary">
            SEO (aperçu par langue)
          </h2>
          <p className="mt-0.5 text-sm text-brand-muted">
            Aperçu en direct du titre et de la description pour chaque langue ; laissez un champ
            vide pour utiliser la valeur générée automatiquement, ou saisissez du texte pour la
            remplacer
          </p>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 gap-0 divide-y divide-brand-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {LANGUAGES.map((lang) => {
            const fields = seo[lang.key];
            const name = names[lang.key];
            const autoTitle = generateSeoTitle(lang.key, name);
            const autoDescription = generateSeoDescription(lang.key, name);
            const autoAltImage = generateSeoAltImage(lang.key, name);

            return (
              <div key={lang.key} dir={lang.dir} className="p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold uppercase tracking-wide text-brand-secondary">
                    {lang.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-muted">
                      {fields.enabled ? 'Personnalisé' : 'Auto'}
                    </span>
                    <Toggle
                      checked={fields.enabled}
                      onChange={(v) => onEnabledChange(lang.key, v)}
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <SeoField
                    label="Titre"
                    value={fields.title}
                    onChange={(v) => onFieldChange(lang.key, 'title', v)}
                    placeholder={autoTitle || '…'}
                    final={resolveFinal(lang.key, 'title', autoTitle)}
                  />
                  <SeoField
                    label="Meta description"
                    textarea
                    value={fields.metaDescription}
                    onChange={(v) => onFieldChange(lang.key, 'metaDescription', v)}
                    placeholder={autoDescription || '…'}
                    final={resolveFinal(lang.key, 'metaDescription', autoDescription)}
                  />
                  <SeoField
                    label="Alt image"
                    value={fields.altImage}
                    onChange={(v) => onFieldChange(lang.key, 'altImage', v)}
                    placeholder={autoAltImage || '…'}
                    final={resolveFinal(lang.key, 'altImage', autoAltImage)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
