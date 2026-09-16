'use client';

import {useState} from 'react';
import {cn} from '@/lib/utils';
import type {Locale} from '@/types';
import {VariantImageControl} from '@/components/admin/imageUpload';
import {clientTranslate, DEEPL_TARGET_CODE} from '@/lib/translation';
import {Check, Languages, Loader2, Plus, Trash2} from 'lucide-react';

export interface ColorVariantForm {
  id: string;
  colorLabel: Record<Locale, string>;
  image: string;
  inStock: boolean;
  /** Main color: shown on the product / offered first when a customer orders. */
  isDefault: boolean;
}

const COLOR_LANGUAGES: {key: Locale; label: string; dir: 'ltr' | 'rtl'; placeholder: string}[] = [
  {key: 'fr', label: 'FR', dir: 'ltr', placeholder: 'Couleur (fr)'},
  {key: 'en', label: 'EN', dir: 'ltr', placeholder: 'Color (en)'},
  {key: 'ar', label: 'AR', dir: 'rtl', placeholder: 'اللون'},
];

const inputClass = cn(
  'w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-secondary',
  'placeholder:text-brand-muted/70',
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
);

let uidCounter = 0;
const uid = () => `v-${Date.now()}-${uidCounter++}`;

export function VariantColorFields({
  colorLabel,
  onChange,
}: {
  colorLabel: Record<Locale, string>;
  onChange: (next: Record<Locale, string>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnyInput = COLOR_LANGUAGES.some((lang) => colorLabel[lang.key].trim() !== '');

  const translate = async () => {
    const source = COLOR_LANGUAGES.find((lang) => colorLabel[lang.key].trim() !== '');
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const next: Record<Locale, string> = {...colorLabel};
      for (const target of COLOR_LANGUAGES) {
        if (target.key === source.key) continue;
        const translated = await clientTranslate(
          colorLabel[source.key].trim(),
          DEEPL_TARGET_CODE[target.key],
          source.key
        );
        next[target.key] = translated;
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la traduction');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-wrap items-end gap-2">
      <div className="grid min-w-[240px] flex-[2] grid-cols-1 gap-2 sm:grid-cols-3">
        {COLOR_LANGUAGES.map((lang) => (
          <div key={lang.key} className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold uppercase text-brand-muted">
              {lang.label}
            </span>
            <input
              dir={lang.dir}
              value={colorLabel[lang.key]}
              onChange={(e) => onChange({...colorLabel, [lang.key]: e.target.value})}
              className={inputClass}
              placeholder={lang.placeholder}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void translate()}
          disabled={busy || !hasAnyInput}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors',
            'hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
          {busy ? 'Traduction…' : 'Traduire'}
        </button>
        {error && <span className="text-[11px] leading-tight text-brand-error">{error}</span>}
      </div>
    </div>
  );
}

export function ColorVariantsEditor({
  variants,
  onChange,
}: {
  variants: ColorVariantForm[];
  onChange: (next: ColorVariantForm[]) => void;
}) {
  const addVariant = () =>
    onChange([
      ...variants,
      {
        id: uid(),
        colorLabel: {fr: '', en: '', ar: ''},
        image: '',
        inStock: true,
        isDefault: variants.length === 0,
      },
    ]);

  const updateVariant = (id: string, patch: Partial<ColorVariantForm>) =>
    onChange(variants.map((v) => (v.id === id ? {...v, ...patch} : v)));

  const setDefault = (id: string) =>
    onChange(variants.map((v) => ({...v, isDefault: v.id === id})));

  const removeVariant = (id: string) =>
    onChange(variants.filter((v) => v.id !== id));

  return (
    <div>
      {variants.length === 0 ? (
        <div className="mb-4 rounded-md border border-dashed border-brand-border p-6 text-center text-sm text-brand-muted">
          Aucune variante de couleur pour le moment.
        </div>
      ) : (
        <div className="mb-4 space-y-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-brand-border p-3"
            >
              <VariantImageControl
                src={variant.image}
                alt={variant.colorLabel.fr || 'Variante'}
                onUpload={(dataUrl) => updateVariant(variant.id, {image: dataUrl})}
                onRemove={() => updateVariant(variant.id, {image: ''})}
              />
              <div className="min-w-0 flex-1">
                <VariantColorFields
                  colorLabel={variant.colorLabel}
                  onChange={(colorLabel) => updateVariant(variant.id, {colorLabel})}
                />
              </div>
              <button
                type="button"
                onClick={() => setDefault(variant.id)}
                aria-pressed={variant.isDefault}
                title="Couleur affichée sur le produit / proposée en premier lors d'une commande"
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  variant.isDefault
                    ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                    : 'border-brand-border bg-transparent text-brand-muted hover:border-brand-primary/60 hover:text-brand-secondary'
                )}
              >
                {variant.isDefault && <Check className="h-3.5 w-3.5 shrink-0" />}
                Principale
              </button>
              <button
                type="button"
                onClick={() => updateVariant(variant.id, {inStock: !variant.inStock})}
                aria-pressed={variant.inStock}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  variant.inStock
                    ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                    : 'border-brand-border bg-transparent text-brand-muted hover:border-brand-primary/60 hover:text-brand-secondary'
                )}
              >
                {variant.inStock && <Check className="h-3.5 w-3.5 shrink-0" />}
                En stock
              </button>
              <button
                type="button"
                onClick={() => removeVariant(variant.id)}
                className="shrink-0 rounded-md p-2 text-brand-muted hover:bg-brand-light hover:text-brand-error transition-colors"
                aria-label="Supprimer la variante"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addVariant}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-brand-border px-3 py-2 text-sm text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-colors"
      >
        <Plus className="h-4 w-4" />
        Ajouter une couleur
      </button>
    </div>
  );
}