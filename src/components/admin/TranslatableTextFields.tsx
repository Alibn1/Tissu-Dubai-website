'use client';

import {useState} from 'react';
import {Languages, Loader2} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {Locale} from '@/types';
import type {TranslatableText} from '@/lib/siteSettings';
import {
  clientTranslate,
  DEEPL_TARGET_CODE,
  TRANSLATION_LANGUAGES,
} from '@/lib/translation';

export interface LocalizedField {
  id: string;
  heading?: React.ReactNode;
  label?: string;
  value: TranslatableText;
  textarea?: boolean;
  placeholder?: string;
}

const SOURCE_ORDER: Locale[] = ['fr', 'en', 'ar'];

const inputClass = cn(
  'w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-secondary',
  'placeholder:text-brand-muted/70',
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
);

type Props = {
  fields: LocalizedField[];
  onChange: (id: string, lang: Locale, value: string) => void;
  hint?: string;
  ariaLabel?: string;
};

/**
 * Generic multilingual editor with the same UX as the product translation
 * section: one language tab at a time (FR/EN/AR) and a single « Traduire »
 * button that translates every filled value into the other languages
 * (overwriting them). Reuses the shared clientTranslate / /api/translate
 * pipeline so settings translations behave exactly like product ones.
 */
export function TranslatableTextFields({fields, onChange, hint, ariaLabel}: Props) {
  const [active, setActive] = useState<Locale>('fr');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const hasAnyInput = (lang: Locale) =>
    fields.some((f) => f.value[lang].trim() !== '');

  // First non-empty value for a field across all languages (FR → EN → AR).
  const findSource = (f: LocalizedField): {lang: Locale; text: string} | null => {
    for (const lang of SOURCE_ORDER) {
      const value = f.value[lang].trim();
      if (value) return {lang, text: value};
    }
    return null;
  };

  const hasAnythingToTranslate = fields.some((f) => findSource(f) !== null);

  const translateAll = async () => {
    setErrors({});
    let failed = false;
    const tasks: Promise<void>[] = [];

    for (const field of fields) {
      const source = findSource(field);
      if (!source) continue;
      for (const target of SOURCE_ORDER) {
        if (target === source.lang) continue;
        tasks.push(
          (async () => {
            try {
              const translated = await clientTranslate(source.text, DEEPL_TARGET_CODE[target], source.lang);
              onChange(field.id, target, translated);
            } catch (err) {
              failed = true;
              setErrors((prev) => ({
                ...prev,
                [field.id]: err instanceof Error ? err.message : 'Échec de la traduction',
              }));
            }
          })()
        );
      }
    }

    await Promise.all(tasks);
    if (failed) throw new Error('Certaines traductions ont échoué.');
  };

  const activeLang = TRANSLATION_LANGUAGES.find((l) => l.key === active) ?? TRANSLATION_LANGUAGES[0];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-brand-muted">
          {hint ??
            'Saisissez le texte dans une langue, puis cliquez sur « Traduire » pour le traduire dans les autres langues.'}
        </p>
        <SectionTranslateButton onClick={translateAll} disabled={!hasAnythingToTranslate} />
      </div>

      {/* Language tabs */}
      <div
        role="tablist"
        aria-label={ariaLabel ?? 'Langues'}
        className="mb-6 flex items-center gap-1 rounded-md border border-brand-border bg-brand-surface p-1"
      >
        {TRANSLATION_LANGUAGES.map((lang) => {
          const isActive = lang.key === active;
          return (
            <button
              key={lang.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(lang.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:bg-brand-light/60 hover:text-brand-secondary'
              )}
            >
              {lang.label}
              {hasAnyInput(lang.key) && (
                <span
                  className={cn(
                    'inline-block h-1.5 w-1.5 rounded-full',
                    isActive ? 'bg-white' : 'bg-brand-primary'
                  )}
                  title="Contient des données"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active language panel */}
      <div className="space-y-6">
        {fields.map((field) => {
          const isTextarea = field.textarea;
          return (
            <div key={field.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                {field.heading ?? (
                  <span className="text-xs font-medium text-brand-muted">{field.label}</span>
                )}
              </div>

              {isTextarea ? (
                <textarea
                  rows={4}
                  dir={activeLang.dir}
                  value={field.value[active]}
                  onChange={(e) => onChange(field.id, active, e.target.value)}
                  placeholder={field.placeholder}
                  className={cn(inputClass, 'resize-none')}
                />
              ) : (
                <input
                  dir={activeLang.dir}
                  value={field.value[active]}
                  onChange={(e) => onChange(field.id, active, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}

              {errors[field.id] && (
                <p className="mt-1 text-xs text-brand-error">{errors[field.id]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionTranslateButton({
  onClick,
  disabled,
}: {
  onClick: () => Promise<void>;
  disabled: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy || disabled) return;
    setBusy(true);
    setError(null);
    try {
      await onClick();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la traduction');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy || disabled}
        className={cn(
          'inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors',
          'hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
        {busy ? 'Traduction…' : 'Traduire'}
      </button>
      {error && <span className="mt-1 text-[11px] leading-tight text-brand-error">{error}</span>}
    </div>
  );
}