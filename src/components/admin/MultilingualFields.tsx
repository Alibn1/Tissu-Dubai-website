'use client';

import {useState} from 'react';
import {Languages, Loader2} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {Locale} from '@/types';
import {
  clientTranslate,
  DEEPL_TARGET_CODE,
  FIELD_LABELS,
  FIELD_PLACEHOLDERS,
  TRANSLATION_LANGUAGES,
  type ProductTranslations,
  type TranslatableFieldKey,
} from '@/lib/translation';

const FIELD_ORDER: TranslatableFieldKey[] = ['name', 'materials', 'description', 'composition', 'width', 'origin'];

// Composition / Largeur / Origine: rendered side by side to save vertical space.
const INLINE_FIELDS: TranslatableFieldKey[] = ['composition', 'width', 'origin'];

// Priority used to pick the source language for a field: French, then English,
// then Arabic (first non-empty value wins).
const SOURCE_ORDER: Locale[] = ['fr', 'en', 'ar'];

const TEXTAREAS: TranslatableFieldKey[] = ['description'];

const inputClass = cn(
  'w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-secondary',
  'placeholder:text-brand-muted/70',
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
);

type FieldErrors = Record<TranslatableFieldKey, string | null>;

function createEmptyErrors(): FieldErrors {
  return {name: null, materials: null, description: null, composition: null, width: null, origin: null};
}

type Props = {
  translations: ProductTranslations;
  onChange: (lang: Locale, field: TranslatableFieldKey, value: string) => void;
};

export function MultilingualFields({translations, onChange}: Props) {
  const [active, setActive] = useState<Locale>('fr');
  const [errors, setErrors] = useState<Record<Locale, FieldErrors>>({
    en: createEmptyErrors(),
    fr: createEmptyErrors(),
    ar: createEmptyErrors(),
  });

  const setFieldError = (lang: Locale, field: TranslatableFieldKey, message: string | null) =>
    setErrors((prev) => ({...prev, [lang]: {...prev[lang], [field]: message}}));

  const hasAnyInput = (lang: Locale) => FIELD_ORDER.some((field) => translations[lang][field].trim() !== '');

  // First non-empty value for a field across all languages (FR → EN → AR).
  const findSource = (field: TranslatableFieldKey): {lang: Locale; text: string} | null => {
    for (const lang of SOURCE_ORDER) {
      const value = translations[lang][field].trim();
      if (value) return {lang, text: value};
    }
    return null;
  };

  // True when at least one field has content in any language (so the button can act).
  const hasAnythingToTranslate = FIELD_ORDER.some((field) => findSource(field) !== null);

  // One-click translate: for every filled field, translate its source value into
  // ALL the other languages (overwriting them), so the button can be pressed
  // again after editing a source language.
  const translateAll = async () => {
    setErrors({en: createEmptyErrors(), fr: createEmptyErrors(), ar: createEmptyErrors()});
    let failed = false;
    const tasks: Promise<void>[] = [];

    for (const field of FIELD_ORDER) {
      const source = findSource(field);
      if (!source) continue;
      for (const target of SOURCE_ORDER) {
        if (target === source.lang) continue;
        const code = DEEPL_TARGET_CODE[target];
        tasks.push(
          (async () => {
            try {
              const translated = await clientTranslate(source.text, code, source.lang);
              onChange(target, field, translated);
            } catch (err) {
              failed = true;
              setFieldError(target, field, err instanceof Error ? err.message : 'Échec de la traduction');
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
          Saisissez les informations dans une langue, puis cliquez sur « Traduire » pour les traduire dans les autres langues.
        </p>
        <SectionTranslateButton onClick={translateAll} disabled={!hasAnythingToTranslate} />
      </div>

      {/* Language tabs */}
      <div
        role="tablist"
        aria-label="Langues du produit"
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
      <div>
        <div className="space-y-6">
          {FIELD_ORDER.filter((field) => !INLINE_FIELDS.includes(field)).map((field) => (
            <FieldContent
              key={field}
              label={FIELD_LABELS[field]}
              placeholder={FIELD_PLACEHOLDERS[field]}
              dir={activeLang.dir}
              value={translations[active][field]}
              textarea={TEXTAREAS.includes(field)}
              error={errors[active][field]}
              onChange={(v) => onChange(active, field, v)}
            />
          ))}

          {/* Composition / Largeur / Origine on one line */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {INLINE_FIELDS.map((field) => (
              <div key={field}>
                <FieldContent
                  label={FIELD_LABELS[field]}
                  placeholder={FIELD_PLACEHOLDERS[field]}
                  dir={activeLang.dir}
                  value={translations[active][field]}
                  textarea={TEXTAREAS.includes(field)}
                  error={errors[active][field]}
                  onChange={(v) => onChange(active, field, v)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldContent({
  label,
  placeholder,
  dir,
  value,
  textarea,
  error,
  onChange,
}: {
  label: string;
  placeholder: string;
  dir: 'ltr' | 'rtl';
  value: string;
  textarea: boolean;
  error: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-brand-muted">{label}</label>
      {textarea ? (
        <textarea
          rows={4}
          dir={dir}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(inputClass, 'resize-none')}
        />
      ) : (
        <input
          dir={dir}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      {error && <p className="mt-1 text-xs text-brand-error">{error}</p>}
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