'use client';

import {useMemo, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {Save, Loader2, Check} from 'lucide-react';
import {MultilingualFields} from '@/components/admin/MultilingualFields';
import type {Locale, Product} from '@/types';
import type {ProductTranslations, TranslatableFieldKey} from '@/lib/translation';

type Props = {
  product: Product;
  locale: string;
};

export function ProductEditForm({product}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initialTranslations = useMemo<ProductTranslations>(
    () => ({
      en: {
        name: product.name.en,
        materials: product.material.en,
        description: product.description.en,
        characteristics: (product.characteristics?.en ?? []).join('\n'),
      },
      fr: {
        name: product.name.fr,
        materials: product.material.fr,
        description: product.description.fr,
        characteristics: (product.characteristics?.fr ?? []).join('\n'),
      },
      ar: {
        name: product.name.ar,
        materials: product.material.ar,
        description: product.description.ar,
        characteristics: (product.characteristics?.ar ?? []).join('\n'),
      },
    }),
    [product]
  );

  const [translations, setTranslations] = useState<ProductTranslations>(initialTranslations);

  const setTranslationValue = (lang: Locale, field: TranslatableFieldKey, value: string) =>
    setTranslations((prev) => ({
      ...prev,
      [lang]: {...prev[lang], [field]: value},
    }));

  const [formData, setFormData] = useState({
    price: product.price ?? '',
    inStock: product.inStock,
    featured: product.featured,
    isNew: product.isNew,
  });

  const pick = (field: keyof ProductTranslations['en']): Record<Locale, string> => ({
    en: translations.en[field],
    fr: translations.fr[field],
    ar: translations.ar[field],
  });

  const splitCharacteristics = (value: string): string[] =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: pick('name'),
          description: pick('description'),
          material: pick('materials'),
          characteristics: {
            en: splitCharacteristics(translations.en.characteristics),
            fr: splitCharacteristics(translations.fr.characteristics),
            ar: splitCharacteristics(translations.ar.characteristics),
          },
          price: formData.price === '' ? null : Number(formData.price),
          inStock: formData.inStock,
          featured: formData.featured,
          isNew: formData.isNew,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const inputClass = cn(
    'w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-secondary',
    'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
  );

  const labelClass = 'block text-sm font-medium text-brand-secondary mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Multilingual content */}
      <section className="rounded-md border border-brand-border bg-brand-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-secondary">
          Contenu multilingue
        </h2>
        <p className="mb-4 mt-1 text-sm text-brand-muted">
          Saisissez les textes dans chaque langue, ou traduisez un champ depuis une autre langue.
        </p>
        <MultilingualFields translations={translations} onChange={setTranslationValue} />
      </section>

      {/* Pricing & Status */}
      <section className="rounded-md border border-brand-border bg-brand-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-4">Prix et statut</h2>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full sm:w-64 lg:w-60">
            <label className={labelClass}>Prix de base (MAD)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value === '' ? '' : Number(e.target.value)})}
              className={inputClass}
              placeholder="Laisser vide pour un prix sur demande"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(
              [
                {key: 'inStock', label: 'En stock'},
                {key: 'featured', label: 'En vedette'},
                {key: 'isNew', label: 'Nouveau'},
              ] as const
            ).map((opt) => {
              const active = formData[opt.key];
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFormData({...formData, [opt.key]: !active})}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                      : 'border-brand-border bg-transparent text-brand-muted hover:border-brand-primary/60 hover:text-brand-secondary'
                  )}
                >
                  {active && <Check className="h-4 w-4 shrink-0" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-semibold text-white transition-colors',
            saved
              ? 'bg-green-600'
              : 'bg-brand-primary hover:bg-brand-primary/90',
            'disabled:opacity-50'
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            'Enregistré !'
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="rounded-md px-4 py-2.5 text-sm font-medium text-brand-muted hover:text-brand-secondary transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}