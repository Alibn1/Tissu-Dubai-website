'use client';

import {useMemo, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {Save, Loader2, Check} from 'lucide-react';
import {MultilingualFields} from '@/components/admin/MultilingualFields';
import {ModelSelect} from '@/components/admin/ModelSelect';
import {ColorVariantsEditor, type ColorVariantForm} from '@/components/admin/ColorVariantsEditor';
import type {Collection, Locale, Product, Model} from '@/types';
import type {ProductTranslations, TranslatableFieldKey} from '@/lib/translation';
import {missingVariantImageMessage} from '@/lib/variantValidation';

type Props = {
  product: Product;
  models: Model[];
  collections: Collection[];
  locale: string;
};

const CHARACTERISTIC_LABELS: Record<Locale, string[]> = {
  fr: ['Composition', 'Largeur', 'Origine'],
  en: ['Composition', 'Width', 'Origin'],
  ar: ['التركيب', 'العرض', 'المصدر'],
};

// Extracts "100% soie naturelle" out of "Composition : 100% soie naturelle".
function stripLabel(line: string): string {
  return line.split(':').slice(1).join(':').trim();
}

function findCharacteristic(product: Product, lang: Locale, keywords: string[]): string {
  const lines = product.characteristics?.[lang] ?? [];
  const line = lines.find((l) => keywords.some((k) => l.toLowerCase().includes(k)));
  return line ? stripLabel(line) : '';
}

function parseCharacteristics(product: Product, lang: Locale): {
  composition: string;
  width: string;
  origin: string;
} {
  return {
    composition: findCharacteristic(product, lang, ['composition', 'التركيب']),
    width:
      findCharacteristic(product, lang, ['largeur', 'width', 'العرض']) ||
      (product.width ?? ''),
    origin: findCharacteristic(product, lang, ['origine', 'origin', 'المصدر', 'منشأ']),
  };
}

export function ProductEditForm({product, models, collections}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [collectionSlugs, setCollectionSlugs] = useState<string[]>(product.collections.map((c) => c.slug));
  const [modelId, setModelId] = useState<string>(() => {
    const match = models.find(
      (m) =>
        m.slug === product.materialSlug &&
        product.collections.some((c) => m.collectionSlugs.includes(c.slug))
    );
    return match?.id ?? '';
  });

  const toggleCollection = (slug: string) => {
    const next = collectionSlugs.includes(slug)
      ? collectionSlugs.filter((s) => s !== slug)
      : [...collectionSlugs, slug];
    const modelStillValid = models.some(
      (m) => m.id === modelId && m.collectionSlugs.some((s) => next.includes(s))
    );
    setCollectionSlugs(next);
    if (!modelStillValid) setModelId('');
  };

  const selectedModels = models.filter((m) =>
    m.collectionSlugs.some((slug) => collectionSlugs.includes(slug))
  );
  const selectedModel = models.find((m) => m.id === modelId) ?? null;

  const initialTranslations = useMemo<ProductTranslations>(() => {
    const build = (lang: Locale) => {
      const {composition, width, origin} = parseCharacteristics(product, lang);
      return {
        name: product.name[lang],
        materials: product.material[lang],
        description: product.description[lang],
        composition,
        width,
        origin,
      };
    };
    return {en: build('en'), fr: build('fr'), ar: build('ar')};
  }, [product]);

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

  const [colorVariants, setColorVariants] = useState<ColorVariantForm[]>(() =>
    (product.variants ?? []).map((v, idx) => ({
      id: v.id,
      colorLabel: v.color,
      image: v.images?.[0] ?? '',
      inStock: v.inStock,
      isDefault: idx === 0,
    }))
  );

  const [variantError, setVariantError] = useState<{ids: string[]; message: string} | null>(null);

  // Clear the error as soon as every flagged color has received an image.
  const handleVariantsChange = (next: ColorVariantForm[]) => {
    setColorVariants(next);
    setVariantError((prev) => {
      if (!prev) return prev;
      const stillMissing = prev.ids.filter((id) => {
        const v = next.find((x) => x.id === id);
        return v ? v.image.trim() === '' : false;
      });
      return stillMissing.length === 0 ? null : {...prev, ids: stillMissing};
    });
  };

  const buildVariants = (): Product['variants'] => {
    const mapped = colorVariants.map((v) => {
      const existing = product.variants.find((pv) => pv.id === v.id);
      return existing
        ? {
            ...existing,
            color: v.colorLabel,
            inStock: v.inStock,
            images: v.image ? [v.image] : existing.images,
          }
        : {
            id: v.id,
            color: v.colorLabel,
            colorHex: '#000000',
            sku: `${product.reference}-${v.id}`,
            price: null,
            inStock: v.inStock,
            images: v.image ? [v.image] : [],
          };
    });

    // The default ("Principale") variant must stay first so the public page
    // shows it by default when a customer orders.
    return [...mapped].sort((a, b) => {
      const da = colorVariants.find((v) => v.id === a.id)?.isDefault ?? false;
      const db = colorVariants.find((v) => v.id === b.id)?.isDefault ?? false;
      return Number(db) - Number(da);
    });
  };

  const pick = (field: keyof ProductTranslations['en']): Record<Locale, string> => ({
    en: translations.en[field],
    fr: translations.fr[field],
    ar: translations.ar[field],
  });

  const buildCharacteristics = (lang: Locale): string[] =>
    (['composition', 'width', 'origin'] as TranslatableFieldKey[])
      .map((field, i) =>
        translations[lang][field].trim()
          ? `${CHARACTERISTIC_LABELS[lang][i]} : ${translations[lang][field].trim()}`
          : ''
      )
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingImage = colorVariants.filter((v) => v.image.trim() === '');
    if (missingImage.length > 0) {
      setVariantError({
        ids: missingImage.map((v) => v.id),
        message: missingVariantImageMessage(missingImage.map((v) => v.colorLabel)),
      });
      requestAnimationFrame(() => {
        document
          .getElementById(`variant-row-${missingImage[0].id}`)
          ?.scrollIntoView({behavior: 'smooth', block: 'center'});
      });
      return;
    }
    setVariantError(null);

    setSaving(true);

    // The "Principale" variant's picture becomes the product's main picture so
    // cards, lists and shared images follow the selected principale.
    const principaleImage =
      colorVariants.find((v) => v.isDefault)?.image ?? colorVariants[0]?.image ?? '';
    const images = principaleImage
      ? [principaleImage, ...product.images.filter((img) => img !== principaleImage)]
      : product.images;

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: pick('name'),
          description: pick('description'),
          collectionSlugs,
          images,
          material: selectedModel?.name ?? product.material,
          materialSlug: selectedModel?.slug ?? product.materialSlug,
          characteristics: {
            en: buildCharacteristics('en'),
            fr: buildCharacteristics('fr'),
            ar: buildCharacteristics('ar'),
          },
          width: translations.fr.width.trim() || undefined,
          price: formData.price === '' ? null : Number(formData.price),
          inStock: formData.inStock,
          featured: formData.featured,
          isNew: formData.isNew,
          variants: buildVariants(),
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
        <MultilingualFields
          translations={translations}
          onChange={setTranslationValue}
          exclude={['materials']}
        />
      </section>

      {/* Collection & Modèle */}
      <section className="rounded-md border border-brand-border bg-brand-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-4">
          Collection et modèle
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Collections</label>
            <div className="flex flex-wrap gap-2">
              {collections.map((col) => {
                const active = collectionSlugs.includes(col.slug);
                return (
                  <button
                    key={col.slug}
                    type="button"
                    onClick={() => toggleCollection(col.slug)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                      active
                        ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                        : 'border-brand-border bg-transparent text-brand-muted hover:border-brand-primary/60 hover:text-brand-secondary'
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    {col.name.fr}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={labelClass}>Modèle</label>
            <ModelSelect
              models={selectedModels}
              value={modelId}
              onChange={setModelId}
              placeholder={
                selectedModels.length > 0
                  ? 'Sélectionner un modèle'
                  : 'Aucun modèle pour ces collections'
              }
            />
          </div>
        </div>
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

      {/* Color Variants */}
      <section className="rounded-md border border-brand-border bg-brand-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-secondary">
          Variantes de couleur
        </h2>
        <p className="mb-4 mt-1 text-sm text-brand-muted">
          Ajoutez plusieurs couleurs sous le même produit.
        </p>
        <ColorVariantsEditor
          variants={colorVariants}
          onChange={handleVariantsChange}
          invalidIds={variantError?.ids ?? []}
        />
      </section>

      {/* Save */}
      {variantError && (
        <p className="text-sm font-medium text-brand-error">{variantError.message}</p>
      )}
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