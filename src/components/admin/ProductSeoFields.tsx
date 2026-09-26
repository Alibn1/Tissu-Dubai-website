'use client';

import {cn} from '@/lib/utils';
import type {Locale} from '@/types';
import {resolveSeoValue, seoFieldDisplayValue, type ProductSeoByLanguage, type SeoFieldKey} from '@/lib/productSeo';
import {Search as SearchIcon} from 'lucide-react';

const LANGUAGES: {key: Locale; label: string; dir: 'ltr' | 'rtl'}[] = [
  {key: 'fr', label: 'Français', dir: 'ltr'},
  {key: 'en', label: 'English', dir: 'ltr'},
  {key: 'ar', label: 'العربية', dir: 'rtl'},
];

/** Rough search-engine budgets. Over the limit is a warning, never a block. */
const FIELD_LIMITS: Record<SeoFieldKey, number> = {
  title: 60,
  metaDescription: 160,
  altImage: 125,
};

const FIELD_LABELS: Record<SeoFieldKey, string> = {
  title: 'Titre',
  metaDescription: 'Meta description',
  altImage: 'Alt image',
};

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
  field,
  value,
  fallback,
  enabled,
  onChange,
}: {
  field: SeoFieldKey;
  /** What the field shows: the custom draft on Personnalisé, the published text on Auto. */
  value: string;
  /** The text the page publishes when this field is empty. */
  fallback: string;
  enabled: boolean;
  onChange: (value: string) => void;
}) {
  const limit = FIELD_LIMITS[field];
  const over = value.length > limit;
  const isTextarea = field === 'metaDescription';

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
          {FIELD_LABELS[field]}
        </label>
        <span
          className={cn(
            'text-[11px] tabular-nums',
            over ? 'font-semibold text-brand-error' : 'text-brand-muted/80'
          )}
        >
          {value.length}/{limit}
        </span>
      </div>

      {isTextarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // On Auto the text is pre-filled; selecting it on focus means the
          // admin's first keystroke replaces it instead of appending.
          onFocus={(e) => {
            if (!enabled && value) e.currentTarget.select();
          }}
          placeholder={fallback}
          className={cn(inputClass, 'resize-none')}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            if (!enabled && value) e.currentTarget.select();
          }}
          placeholder={fallback}
          className={inputClass}
        />
      )}

      <p className="mt-1 text-xs text-brand-muted">
        {enabled ? (
          value.trim() ? (
            <>Publié tel quel.</>
          ) : (
            <>
              Vide → publie : <span className="font-medium text-brand-primary">{fallback}</span>
            </>
          )
        ) : (
          <>
            Repris automatiquement du produit. Modifiez-le pour passer en « Personnalisé ».
          </>
        )}
      </p>
    </div>
  );
}

type Props = {
  seo: ProductSeoByLanguage;
  /** Per-language product content the auto values are derived from. */
  content: Record<Locale, {name: string; description: string}>;
  /**
   * Called on every keystroke. Implementations must set the field value and,
   * when the language was on Auto, flip it to Personnalisé in the *same* state
   * update — doing it in two steps would drop the keystroke that triggered it.
   */
  onFieldEdit: (lang: Locale, field: SeoFieldKey, value: string) => void;
  onEnabledChange: (lang: Locale, enabled: boolean) => void;
};

/**
 * Per-language SEO overrides. On "Auto" each field is pre-filled with the exact
 * text that will be published; editing it flips the language to
 * "Personnalisé". Shared by the create and edit product forms so both stay in
 * sync.
 */
export function ProductSeoFields({seo, content, onFieldEdit, onEnabledChange}: Props) {
  return (
    <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
      <div className="flex items-start gap-3 border-b border-brand-border px-5 py-4">
        <SearchIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
        <div>
          <h2 className="font-heading text-base font-semibold text-brand-secondary">
            SEO (par langue)
          </h2>
          <p className="mt-0.5 text-sm text-brand-muted">
            Les champs sont pré-remplis avec le texte exact qui sera publié. Modifiez-en un pour
            basculer la langue en « Personnalisé » ; repassez en « Auto » pour revenir au texte du
            produit.
          </p>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 gap-0 divide-y divide-brand-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {LANGUAGES.map((lang) => {
            const fields = seo[lang.key];
            const {name, description} = content[lang.key] ?? {name: '', description: ''};

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
                  {(['title', 'metaDescription', 'altImage'] as SeoFieldKey[]).map((field) => {
                    // Exactly what the public page will publish for this field.
                    const published = resolveSeoValue(seo, lang.key, field, name, description);
                    return (
                      <SeoField
                        key={field}
                        field={field}
                        fallback={published}
                        enabled={fields.enabled}
                        // On Auto the field shows the published text; the stored
                        // value stays empty so nothing is overridden.
                        value={seoFieldDisplayValue(seo, lang.key, field, name, description)}
                        onChange={(v) => onFieldEdit(lang.key, field, v)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
