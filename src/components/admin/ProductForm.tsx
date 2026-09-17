'use client';

import {useState} from 'react';
import {cn} from '@/lib/utils';
import type {Category, Locale, Model} from '@/types';
import {MultilingualFields} from '@/components/admin/MultilingualFields';
import {ModelSelect} from '@/components/admin/ModelSelect';
import {FileUploadButton, ImagePreview} from '@/components/admin/imageUpload';
import {ColorVariantsEditor, type ColorVariantForm} from '@/components/admin/ColorVariantsEditor';
import {
  createEmptyTranslations,
  type ProductTranslations,
  type TranslatableFieldKey,
} from '@/lib/translation';
import {missingVariantImageMessage} from '@/lib/variantValidation';
import {Package, Palette, Search as SearchIcon, Check, Loader2, Trash2} from 'lucide-react';

// ── Types ──

export type {ColorVariantForm} from '@/components/admin/ColorVariantsEditor';

export interface SeoFieldsForm {
  title: string;
  metaDescription: string;
  altImage: string;
  enabled: boolean;
}

export type SeoByLanguage = Record<Locale, SeoFieldsForm>;

export interface ProductFormData {
  collection: string;
  modelId: string;
  reference: string;
  mainColor: Record<Locale, string>;
  isMainColor: boolean;
  price: string;
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  baseImages: string[];
  colorVariants: ColorVariantForm[];
  seo: SeoByLanguage;
}

// ── Constants ──

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

const labelClass = 'block text-sm font-medium text-brand-secondary mb-1';

// ── Helpers ──

function createEmptySeo(): SeoByLanguage {
  return {
    en: {title: '', metaDescription: '', altImage: '', enabled: false},
    fr: {title: '', metaDescription: '', altImage: '', enabled: false},
    ar: {title: '', metaDescription: '', altImage: '', enabled: false},
  };
}

const uidCounter = 0;

export function createEmptyFormData(): ProductFormData {
  return {
    collection: '',
    modelId: '',
    reference: `TD-${Date.now().toString(36).toUpperCase()}${uidCounter}`,
    mainColor: {en: '', fr: '', ar: ''},
    isMainColor: true,
    price: '',
    inStock: true,
    featured: false,
    isNew: false,
    baseImages: [],
    colorVariants: [],
    seo: createEmptySeo(),
  };
}

function generateSeoTitle(lang: Locale, name: string): string {
  if (lang === 'ar') return `لـ ${name} | تيسو دبي`;
  if (lang === 'fr') return `pour ${name} | Tissu Dubai`;
  return `for ${name} | Tissu Dubai`;
}

function generateSeoDescription(lang: Locale, name: string): string {
  if (lang === 'ar') return `${name}. جديد. تواصل مع تيسو دبي للحصول على عرض سعر، توصيل لجميع أنحاء المغرب.`;
  if (lang === 'fr') return `${name}. Nouveau. Contactez Tissu Dubai pour un devis, livraison partout au Maroc.`;
  return `${name}. New. Contact Tissu Dubai for a quote, delivery across Morocco.`;
}

function generateSeoAltImage(_lang: Locale, name: string): string {
  return name;
}

type SeoFieldKey = keyof Omit<SeoFieldsForm, 'enabled'>;

// ── Sub components ──

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon?: React.ComponentType<{className?: string}>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
      <div className="flex items-start gap-3 border-b border-brand-border px-5 py-4">
        {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />}
        <div>
          <h2 className="font-heading text-base font-semibold text-brand-secondary">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-brand-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

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

// ── Main component ──

type Props = {
  mode: 'create' | 'edit';
  productId?: string;
  initialData?: ProductFormData;
  collections: Category[];
  models: Model[];
};

export function ProductForm({mode, productId, initialData, collections, models}: Props) {
  const [formData, setFormData] = useState<ProductFormData>(() => {
    const base = createEmptyFormData();
    return {
      ...base,
      ...(initialData ?? {}),
      seo: {
        ...base.seo,
        ...(initialData?.seo ?? {}),
      } as SeoByLanguage,
    };
  });
  const [colorError, setColorError] = useState<string | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [variantError, setVariantError] = useState<{ids: string[]; message: string} | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [translations, setTranslations] = useState<ProductTranslations>(createEmptyTranslations);

  const setTranslationValue = (lang: Locale, field: TranslatableFieldKey, value: string) =>
    setTranslations((prev) => ({
      ...prev,
      [lang]: {...prev[lang], [field]: value},
    }));

  const setField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) =>
    setFormData((f) => ({...f, [key]: value}));

  const setSeoField = (lang: Locale, field: SeoFieldKey, value: string) =>
    setFormData((f) => ({
      ...f,
      seo: {...f.seo, [lang]: {...f.seo[lang], [field]: value}},
    }));

  const setSeoEnabled = (lang: Locale, enabled: boolean) =>
    setFormData((f) => ({
      ...f,
      seo: {...f.seo, [lang]: {...f.seo[lang], enabled}},
    }));

  const selectCollection = (collection: string) =>
    setFormData((f) => ({...f, collection, modelId: ''}));

  const selectedModels = models.filter((m) => m.collectionSlug === formData.collection);
  const selectedModel = models.find((m) => m.id === formData.modelId) ?? null;

  const setBaseImages = (next: string[]) => {
    setField('baseImages', next);
    if (next.some((img) => img.trim() !== '')) setImageError(null);
  };

  const updateBaseImage = (index: number, value: string) =>
    setBaseImages(formData.baseImages.map((img, i) => (i === index ? value : img)));

  const removeBaseImage = (index: number) =>
    setBaseImages(formData.baseImages.filter((_, i) => i !== index));

  const handleVariantsChange = (next: ColorVariantForm[]) => {
    setField('colorVariants', next);
    setVariantError((prev) => {
      if (!prev) return prev;
      const stillMissing = prev.ids.filter((id) => {
        const v = next.find((x) => x.id === id);
        return v ? v.image.trim() === '' : false;
      });
      return stillMissing.length === 0 ? null : {...prev, ids: stillMissing};
    });
  };

  const resolveFinal = (lang: Locale, field: SeoFieldKey, auto: string) => {
    const seo = formData.seo[lang];
    const override = seo[field]?.trim();
    return seo.enabled && override ? override : auto;
  };

  // Build the payload to send — swap with a real API call later.
  const buildPayload = () => {
    const {
      collection,
      modelId,
      reference,
      mainColor,
      isMainColor,
      price,
      inStock,
      featured,
      isNew,
      baseImages,
      colorVariants,
      seo,
    } = formData;

    const pick = (field: keyof ProductTranslations['en']): Record<Locale, string> => ({
      en: translations.en[field],
      fr: translations.fr[field],
      ar: translations.ar[field],
    });

    const buildCharacteristics = (): Record<Locale, string[]> => {
      const labels: Record<Locale, string[]> = {
        fr: ['Composition', 'Largeur', 'Origine'],
        en: ['Composition', 'Width', 'Origin'],
        ar: ['التركيب', 'العرض', 'المصدر'],
      };
      const fields: TranslatableFieldKey[] = ['composition', 'width', 'origin'];
      return Object.fromEntries(
        (['en', 'fr', 'ar'] as Locale[]).map((lang) => [
          lang,
          fields
            .map((field, i) =>
              translations[lang][field].trim()
                ? `${labels[lang][i]} : ${translations[lang][field].trim()}`
                : ''
            )
            .filter(Boolean),
        ])
      ) as Record<Locale, string[]>;
    };

    // Colors are one shared pool: the main color entered next to "Nom du
    // produit" + the colors added in "Variantes de couleur". Exactly one is
    // "Principale" (the one shown on the product card). If a variant already
    // matches the main color label, it plays the main-color role instead of
    // adding a duplicate.
    const baseVariants = [...colorVariants];
    const hasMainColor = (['fr', 'en', 'ar'] as Locale[]).some(
      (lang) => mainColor[lang].trim() !== ''
    );

    let mainVariantId: string | null = null;
    let colorVariantsPayload: ColorVariantForm[] = baseVariants;
    if (hasMainColor) {
      const existingMainIndex = baseVariants.findIndex(
        (v) =>
          v.colorLabel.fr.trim() !== '' &&
          v.colorLabel.fr.trim() === mainColor.fr.trim()
      );
      if (existingMainIndex === -1) {
        mainVariantId = 'v-main';
        // The main color's picture is the product's primary image.
        const mainImage = baseImages.find((img) => img.trim() !== '') ?? '';
        colorVariantsPayload = [
          {
            id: 'v-main',
            colorLabel: mainColor,
            image: mainImage,
            inStock: true,
            isDefault: isMainColor,
          },
          ...baseVariants,
        ];
      } else {
        mainVariantId = baseVariants[existingMainIndex].id;
      }
    }

    // Enforce a single "Principale": when the main-color checkbox is on, the
    // main color is the only default; otherwise the variant marked "Principale"
    // keeps its flag. The default ends up first so the card shows it.
    if (isMainColor && mainVariantId) {
      colorVariantsPayload = colorVariantsPayload.map((v) => ({
        ...v,
        isDefault: v.id === mainVariantId,
      }));
    }
    colorVariantsPayload = [...colorVariantsPayload].sort(
      (a, b) => Number(b.isDefault) - Number(a.isDefault)
    );

    return {
      ...(mode === 'edit' && productId ? {id: productId} : {}),
      name: pick('name'),
      description: pick('description'),
      reference,
      mainColor,
      material: selectedModel?.name ?? {fr: '', en: '', ar: ''},
      materialSlug: selectedModel?.slug ?? '',
      collection,
      modelId,
      composition: pick('composition'),
      width: pick('width'),
      origin: pick('origin'),
      characteristics: buildCharacteristics(),
      price: price === '' ? null : Number(price),
      inStock,
      featured,
      isNew,
      baseImages,
      isMainColor,
      colorVariants: colorVariantsPayload,
      seo,
    };
  };

  const saveProduct = async () => {
    const payload = buildPayload();

    const res = await fetch(
      mode === 'create' ? '/api/products' : `/api/products/${productId}`,
      {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      }
    );

    return res.ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasMainColor = (['fr', 'en', 'ar'] as Locale[]).some(
      (lang) => formData.mainColor[lang].trim() !== ''
    );
    if (!hasMainColor) {
      setColorError('Saisissez la couleur principale du produit.');
      setReferenceError(null);
      setImageError(null);
      setVariantError(null);
      return;
    }

    if (!formData.reference.trim()) {
      setColorError(null);
      setReferenceError('Saisissez la référence du produit.');
      setImageError(null);
      setVariantError(null);
      return;
    }
    setColorError(null);
    setReferenceError(null);

    if (!formData.baseImages.some((img) => img.trim() !== '')) {
      setImageError('Ajoutez au moins une image du produit.');
      setVariantError(null);
      return;
    }
    setImageError(null);

    const missingImage = formData.colorVariants.filter((v) => v.image.trim() === '');
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
    try {
      const ok = await saveProduct();
      if (ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── 1. Product Information ── */}
      <Section
        icon={Package}
        title="Informations produit"
        subtitle="Les informations de base du produit"
      >
        <MultilingualFields
          translations={translations}
          onChange={setTranslationValue}
          exclude={['materials']}
          nameRightSlot={(lang) => (
            <div>
              <label className={labelClass}>Couleur</label>
              <input
                type="text"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                value={formData.mainColor[lang]}
                onChange={(e) => {
                  setColorError(null);
                  setFormData((f) => ({
                    ...f,
                    mainColor: {...f.mainColor, [lang]: e.target.value},
                  }));
                }}
                className={cn(inputClass, colorError && 'border-brand-error')}
                placeholder={
                  lang === 'fr' ? 'Ex. Bordeaux'
                    : lang === 'en' ? 'Ex. Burgundy'
                    : 'أحمر داكن'
                }
                aria-invalid={!!colorError}
              />
              {colorError && (
                <p className="mt-1 text-xs text-brand-error">{colorError}</p>
              )}
            </div>
          )}
        />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Collection</label>
            <div className="flex flex-wrap gap-2">
              {collections.map((col) => {
                const active = formData.collection === col.slug;
                return (
                  <button
                    key={col.slug}
                    type="button"
                    onClick={() => selectCollection(col.slug)}
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
              value={formData.modelId}
              onChange={(id) => setFormData((f) => ({...f, modelId: id}))}
              placeholder={
                formData.collection
                  ? selectedModels.length > 0
                    ? 'Sélectionner un modèle'
                    : 'Aucun modèle pour cette collection'
                  : 'Choisir d’abord une collection'
              }
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Référence</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => {
                setReferenceError(null);
                setField('reference', e.target.value);
              }}
              className={cn(inputClass, referenceError && 'border-brand-error')}
            />
            <p className="mt-1 text-xs text-brand-muted">
              Générée automatiquement — vous pouvez la modifier.
            </p>
            {referenceError && (
              <p className="mt-1 text-xs text-brand-error">{referenceError}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Prix (MAD)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setField('price', e.target.value === '' ? '' : e.target.value)}
              className={inputClass}
              placeholder="Laisser vide pour prix sur demande"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <label className={labelClass}>Statut</label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
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
                    onClick={() => setField(opt.key, !active)}
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
          <div>
            <label className={labelClass}>Statut de couleur</label>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  // Only one "Principale" overall: enabling the main color
                  // clears the per-variant default flags.
                  const next = !formData.isMainColor;
                  setFormData((f) => ({
                    ...f,
                    isMainColor: next,
                    colorVariants: next
                      ? f.colorVariants.map((v) => ({...v, isDefault: false}))
                      : f.colorVariants,
                  }));
                }}
                aria-pressed={formData.isMainColor}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all',
                  formData.isMainColor
                    ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                    : 'border-brand-border bg-transparent text-brand-muted hover:border-brand-primary/60 hover:text-brand-secondary'
                )}
              >
                {formData.isMainColor && <Check className="h-4 w-4 shrink-0" />}
                Principale
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className={labelClass}>Images du produit</label>
          <div className="mt-3 space-y-2">
            {formData.baseImages.map((img, i) => (
              <div key={i} className="flex items-center gap-3">
                <ImagePreview src={img} alt={translations.fr.name || 'Produit'} />
                <input
                  value={img}
                  onChange={(e) => updateBaseImage(i, e.target.value)}
                  className={inputClass}
                  placeholder="URL de l'image…"
                />
                <button
                  type="button"
                  onClick={() => removeBaseImage(i)}
                  className="shrink-0 rounded-md p-2 text-brand-muted hover:bg-brand-light hover:text-brand-error transition-colors"
                  aria-label="Supprimer l'image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <FileUploadButton
              onUpload={(dataUrl) => setBaseImages([...formData.baseImages, dataUrl])}
              label="Ajouter une image"
            />
          </div>
          {imageError && <p className="mt-2 text-xs text-brand-error">{imageError}</p>}
        </div>
      </Section>

      {/* ── 2. Color Variants ── */}
      <Section
        icon={Palette}
        title="Variantes de couleur"
        subtitle="Ajoutez plusieurs couleurs sous le même produit"
      >
        <ColorVariantsEditor
          variants={formData.colorVariants}
          onChange={handleVariantsChange}
          onDefaultChange={() => setField('isMainColor', false)}
          invalidIds={variantError?.ids ?? []}
        />
      </Section>

      {/* ── 3. SEO Management ── */}
      <Section
        icon={SearchIcon}
        title="SEO (aperçu par langue)"
        subtitle="Aperçu en direct du titre et de la description pour chaque langue ; laissez un champ vide pour utiliser la valeur générée automatiquement, ou saisissez du texte pour la remplacer"
      >
        <div className="grid grid-cols-1 gap-0 divide-y divide-brand-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {LANGUAGES.map((lang) => {
            const seo = formData.seo[lang.key];
            const localizedName = translations[lang.key].name;
            const autoTitle = generateSeoTitle(lang.key, localizedName);
            const autoDescription = generateSeoDescription(lang.key, localizedName);
            const autoAltImage = generateSeoAltImage(lang.key, localizedName);

            return (
              <div key={lang.key} dir={lang.dir} className="p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold uppercase tracking-wide text-brand-secondary">
                    {lang.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-muted">
                      {seo.enabled ? 'Personnalisé' : 'Auto'}
                    </span>
                    <Toggle checked={seo.enabled} onChange={(v) => setSeoEnabled(lang.key, v)} />
                  </div>
                </div>

                <div className="space-y-5">
                  <SeoField
                    label="Titre"
                    value={seo.title}
                    onChange={(v) => setSeoField(lang.key, 'title', v)}
                    placeholder={autoTitle || '…'}
                    final={resolveFinal(lang.key, 'title', autoTitle)}
                  />
                  <SeoField
                    label="Meta description"
                    textarea
                    value={seo.metaDescription}
                    onChange={(v) => setSeoField(lang.key, 'metaDescription', v)}
                    placeholder={autoDescription || '…'}
                    final={resolveFinal(lang.key, 'metaDescription', autoDescription)}
                  />
                  <SeoField
                    label="Alt image"
                    value={seo.altImage}
                    onChange={(v) => setSeoField(lang.key, 'altImage', v)}
                    placeholder={autoAltImage || '…'}
                    final={resolveFinal(lang.key, 'altImage', autoAltImage)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Submit ── */}
      {variantError && (
        <p className="text-sm font-medium text-brand-error">{variantError.message}</p>
      )}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-semibold text-white transition-colors',
            saved ? 'bg-green-600' : 'bg-brand-primary hover:bg-brand-primary/90',
            'disabled:opacity-50'
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            'Enregistré !'
          ) : mode === 'create' ? (
            'Créer le produit'
          ) : (
            'Enregistrer les modifications'
          )}
        </button>
      </div>
    </form>
  );
}