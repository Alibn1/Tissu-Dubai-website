'use client';

import {useState} from 'react';
import {cn} from '@/lib/utils';
import type {Locale, Model} from '@/types';
import {MultilingualFields} from '@/components/admin/MultilingualFields';
import {FileUploadButton, ImagePreview} from '@/components/admin/imageUpload';
import {getModels} from '@/lib/modelsStore';
import {clientTranslate, DEEPL_TARGET_CODE} from '@/lib/translation';
import {
  createEmptyTranslations,
  type ProductTranslations,
  type TranslatableFieldKey,
} from '@/lib/translation';
import {
  Trash2,
  Plus,
  Package,
  Palette,
  Search as SearchIcon,
  Loader2,
  Check,
  ChevronDown,
  Languages,
} from 'lucide-react';

// ── Types ──

export interface ColorVariantForm {
  id: string;
  colorLabel: Record<Locale, string>;
  image: string;
  inStock: boolean;
}

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

const COLLECTIONS: {value: string; label: string}[] = [
  {value: 'caftan', label: 'Caftan'},
  {value: 'jellaba', label: 'Djellaba'},
  {value: 'tekchita', label: 'Takchita'},
];

let uidCounter = 0;
const uid = () => `v-${Date.now()}-${uidCounter++}`;

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

export function createEmptyFormData(): ProductFormData {
  return {
    collection: '',
    modelId: '',
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

function ModelSelect({
  models,
  value,
  onChange,
  placeholder,
}: {
  models: Model[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, 'appearance-none pr-9')}
      >
        <option value="">{placeholder}</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name.fr}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
    </div>
  );
}

const COLOR_LANGUAGES: {key: Locale; label: string; dir: 'ltr' | 'rtl'; placeholder: string}[] = [
  {key: 'fr', label: 'FR', dir: 'ltr', placeholder: 'Couleur (fr)'},
  {key: 'en', label: 'EN', dir: 'ltr', placeholder: 'Color (en)'},
  {key: 'ar', label: 'AR', dir: 'rtl', placeholder: 'اللون'},
];

function VariantColorFields({
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
      for (const target of COLOR_LANGUAGES) {
        if (target.key === source.key) continue;
        const translated = await clientTranslate(
          colorLabel[source.key].trim(),
          DEEPL_TARGET_CODE[target.key],
          source.key
        );
        onChange({...colorLabel, [target.key]: translated});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la traduction');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
            'inline-flex items-center gap-2 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors',
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
};

export function ProductForm({mode, productId, initialData}: Props) {
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
  const [models] = useState<Model[]>(() => getModels());
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

  const addColorVariant = () =>
    setFormData((f) => ({
      ...f,
      colorVariants: [
        ...f.colorVariants,
        {id: uid(), colorLabel: {fr: '', en: '', ar: ''}, image: '', inStock: true},
      ],
    }));

  const updateColorVariant = (id: string, patch: Partial<ColorVariantForm>) =>
    setFormData((f) => ({
      ...f,
      colorVariants: f.colorVariants.map((v) => (v.id === id ? {...v, ...patch} : v)),
    }));

  const removeColorVariant = (id: string) =>
    setFormData((f) => ({
      ...f,
      colorVariants: f.colorVariants.filter((v) => v.id !== id),
    }));

  const selectCollection = (collection: string) =>
    setFormData((f) => ({...f, collection, modelId: ''}));

  const selectedModels = models.filter((m) => m.collectionSlug === formData.collection);
  const selectedModel = models.find((m) => m.id === formData.modelId) ?? null;

  const updateBaseImage = (index: number, value: string) =>
    setField(
      'baseImages',
      formData.baseImages.map((img, i) => (i === index ? value : img))
    );

  const removeBaseImage = (index: number) =>
    setField('baseImages', formData.baseImages.filter((_, i) => i !== index));

  const resolveFinal = (lang: Locale, field: SeoFieldKey, auto: string) => {
    const seo = formData.seo[lang];
    const override = seo[field]?.trim();
    return seo.enabled && override ? override : auto;
  };

  // Build the payload to send — swap with a real API call later.
  const buildPayload = () => {
    const {collection, modelId, price, inStock, featured, isNew, baseImages, colorVariants, seo} = formData;

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

    return {
      ...(mode === 'edit' && productId ? {id: productId} : {}),
      name: pick('name'),
      description: pick('description'),
      material: pick('materials'),
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
      colorVariants,
      seo,
    };
  };

  const saveProduct = async () => {
    const payload = buildPayload();

    // TODO: replace with a real API call (one-line swap):
    // const res = await fetch(mode === 'create' ? '/api/products' : `/api/products/${productId}`, {
    //   method: mode === 'create' ? 'POST' : 'PUT',
    //   headers: {'Content-Type': 'application/json'},
    //   body: JSON.stringify(payload),
    // });
    // return res.ok;
    console.log(`[mock] ${mode === 'create' ? 'creating' : 'updating'} product`, payload);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <MultilingualFields translations={translations} onChange={setTranslationValue} />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Collection</label>
            <div className="flex flex-wrap gap-2">
              {COLLECTIONS.map((col) => {
                const active = formData.collection === col.value;
                return (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => selectCollection(col.value)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                      active
                        ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                        : 'border-brand-border bg-transparent text-brand-muted hover:border-brand-primary/60 hover:text-brand-secondary'
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    {col.label}
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

        <div className="mt-6">
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
              onUpload={(dataUrl) => setField('baseImages', [...formData.baseImages, dataUrl])}
              label="Ajouter une image"
            />
          </div>
        </div>
      </Section>

      {/* ── 2. Color Variants ── */}
      <Section
        icon={Palette}
        title="Variantes de couleur"
        subtitle="Ajoutez plusieurs couleurs sous le même produit"
      >
        {formData.colorVariants.length === 0 ? (
          <div className="mb-4 rounded-md border border-dashed border-brand-border p-6 text-center text-sm text-brand-muted">
            Aucune variante de couleur pour le moment.
          </div>
        ) : (
          <div className="mb-4 space-y-3">
            {formData.colorVariants.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center gap-3 rounded-md border border-brand-border p-3"
              >
                <ImagePreview src={variant.image} alt={variant.colorLabel.fr || 'Variante'} />
                <div className="flex flex-1 flex-col gap-2">
                  <VariantColorFields
                    colorLabel={variant.colorLabel}
                    onChange={(colorLabel) => updateColorVariant(variant.id, {colorLabel})}
                  />
                  <FileUploadButton
                    onUpload={(dataUrl) => updateColorVariant(variant.id, {image: dataUrl})}
                    label={variant.image ? 'Changer l’image' : 'Ajouter une image'}
                  />
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm text-brand-secondary">
                  <input
                    type="checkbox"
                    checked={variant.inStock}
                    onChange={(e) => updateColorVariant(variant.id, {inStock: e.target.checked})}
                    className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                  />
                  En stock
                </label>
                <button
                  type="button"
                  onClick={() => removeColorVariant(variant.id)}
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
          onClick={addColorVariant}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-brand-border px-3 py-2 text-sm text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter une couleur
        </button>
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