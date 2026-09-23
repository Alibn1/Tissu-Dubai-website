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

// Composition / Longueur & Largeur / Origine: rendered side by side.
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

// ── Longueur / Largeur composite input ──
// The width field stores ONE combined string ("3 cm × 140 cm"); the UI splits
// it into two numeric inputs joined by "×", and rejoins on change.

function splitDimensions(raw: string): {longueur: string; largeur: string} {
  const nums = raw.replace(',', '.').match(/\d+(\.\d+)?/g) ?? [];
  if (nums.length === 1) return {longueur: '', largeur: nums[0] ?? ''};
  if (nums.length >= 2) return {longueur: nums[0] ?? '', largeur: nums[1] ?? ''};
  return {longueur: '', largeur: ''};
}

function joinDimensions(longueur: string, largeur: string): string {
  const l = longueur.trim();
  const w = largeur.trim();
  if (l && w) return `${l} cm × ${w} cm`;
  if (w) return `${w} cm`;
  if (l) return `${l} cm`;
  return '';
}

// Keep the field numeric-only (digits + decimal separator).
const toNumeric = (v: string) => v.replace(/[^\d.,]/g, '').replace(/,/g, '.');

type Props = {
  translations: ProductTranslations;
  onChange: (lang: Locale, field: TranslatableFieldKey, value: string) => void;
  // Fields to hide (e.g. the model name now comes from the Models page).
  exclude?: TranslatableFieldKey[];
  // Optional content rendered on the right side of the language tabs.
  rightSlot?: React.ReactNode;
  // Optional slot rendered to the right of the "Nom" field (e.g. for color input).
  // Receives the active locale so the caller can render per-language content.
  nameRightSlot?: (activeLang: Locale) => React.ReactNode;
  // An extra per-language value living outside `translations` (e.g. the main
  // color) that must also be filled when the section "Traduire" is pressed.
  extraTranslate?: {
    value: (lang: Locale) => string;
    onChange: (lang: Locale, value: string) => void;
  };
};

export function MultilingualFields({translations, onChange, exclude = [], rightSlot, nameRightSlot, extraTranslate}: Props) {
  const [active, setActive] = useState<Locale>('fr');
  const [extraError, setExtraError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<Locale, FieldErrors>>({
    en: createEmptyErrors(),
    fr: createEmptyErrors(),
    ar: createEmptyErrors(),
  });

  const visibleFields = FIELD_ORDER.filter((field) => !exclude.includes(field));

  const setFieldError = (lang: Locale, field: TranslatableFieldKey, message: string | null) =>
    setErrors((prev) => ({...prev, [lang]: {...prev[lang], [field]: message}}));

  const hasAnyInput = (lang: Locale) => visibleFields.some((field) => translations[lang][field].trim() !== '');

  // First non-empty value for a field across all languages (FR → EN → AR).
  const findSource = (field: TranslatableFieldKey): {lang: Locale; text: string} | null => {
    for (const lang of SOURCE_ORDER) {
      const value = translations[lang][field].trim();
      if (value) return {lang, text: value};
    }
    return null;
  };

  // True when at least one field has content in any language (so the button can act).
  const hasAnythingToTranslate =
    visibleFields.some((field) => findSource(field) !== null) ||
    (extraTranslate !== undefined &&
      SOURCE_ORDER.some((lang) => extraTranslate.value(lang).trim() !== ''));

  // One-click translate: for every filled field, translate its source value into
  // ALL the other languages (overwriting them), so the button can be pressed
  // again after editing a source language.
  const translateAll = async () => {
    setErrors({en: createEmptyErrors(), fr: createEmptyErrors(), ar: createEmptyErrors()});
    setExtraError(null);
    let failed = false;
    const tasks: Promise<void>[] = [];

    if (extraTranslate) {
      const extraSource = SOURCE_ORDER.find((lang) => extraTranslate.value(lang).trim() !== '');
      if (extraSource) {
        const extraText = extraTranslate.value(extraSource).trim();
        for (const target of SOURCE_ORDER) {
          if (target === extraSource) continue;
          tasks.push(
            (async () => {
              try {
                const translated = await clientTranslate(extraText, DEEPL_TARGET_CODE[target]);
                extraTranslate.onChange(target, translated);
              } catch (err) {
                failed = true;
                setExtraError(err instanceof Error ? err.message : 'Échec de la traduction');
              }
            })()
          );
        }
      }
    }

    for (const field of visibleFields) {
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

      {/* Language tabs + right slot (e.g. Référence) */}
      <div className="mb-6 flex items-center gap-1 rounded-md border border-brand-border bg-brand-surface p-1">
        <div
          role="tablist"
          aria-label="Langues du produit"
          className="flex flex-1 items-center gap-1"
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
        {rightSlot && <div className="ml-1 shrink-0">{rightSlot}</div>}
      </div>

      {/* Active language panel */}
      <div>
        <div className="space-y-6">
          {visibleFields
            .filter((field) => !INLINE_FIELDS.includes(field))
            .map((field) => (
              field === 'name' ? (
                <div key={field}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldContent
                      label={FIELD_LABELS[field]}
                      placeholder={FIELD_PLACEHOLDERS[field]}
                      dir={activeLang.dir}
                      value={translations[active][field]}
                      textarea={TEXTAREAS.includes(field)}
                      error={errors[active][field]}
                      onChange={(v) => onChange(active, field, v)}
                    />
                    {nameRightSlot?.(active)}
                  </div>
                  {extraError && (
                    <p className="mt-1 text-xs text-brand-error">{extraError}</p>
                  )}
                </div>
              ) : (
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
              )
            ))}

          {/* Composition / Longueur & Largeur / Origine on one line */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {visibleFields
              .filter((field) => INLINE_FIELDS.includes(field))
              .map((field) => (
                <div key={field}>
                  {field === 'width' ? (
                    <DimensionsField
                      dir={activeLang.dir}
                      value={translations[active][field]}
                      error={errors[active][field]}
                      onChange={(v) => onChange(active, field, v)}
                    />
                  ) : (
                    <FieldContent
                      label={FIELD_LABELS[field]}
                      placeholder={FIELD_PLACEHOLDERS[field]}
                      dir={activeLang.dir}
                      value={translations[active][field]}
                      textarea={TEXTAREAS.includes(field)}
                      error={errors[active][field]}
                      onChange={(v) => onChange(active, field, v)}
                    />
                  )}
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

function DimensionsField({
  dir,
  value,
  error,
  onChange,
}: {
  dir: 'ltr' | 'rtl';
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  const {longueur, largeur} = splitDimensions(value);

  const update = (nextLongueur: string, nextLargeur: string) =>
    onChange(joinDimensions(toNumeric(nextLongueur), toNumeric(nextLargeur)));

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-brand-muted">Longueur / Largeur (cm)</label>
      <div className="flex items-center gap-2" dir={dir}>
        <input
          dir="ltr"
          inputMode="decimal"
          value={longueur}
          onChange={(e) => update(e.target.value, largeur)}
          placeholder="Longueur"
          className={inputClass}
          title="Longueur (cm)"
        />
        <span className="shrink-0 text-sm text-brand-muted">×</span>
        <input
          dir="ltr"
          inputMode="decimal"
          value={largeur}
          onChange={(e) => update(longueur, e.target.value)}
          placeholder="Largeur"
          className={inputClass}
          title="Largeur (cm)"
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-brand-error">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-brand-muted/80">Valeurs en cm — ex. 300 × 140</p>
      )}
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