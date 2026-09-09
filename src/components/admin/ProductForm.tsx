'use client';

import {useRef, useState} from 'react';
import Image from 'next/image';
import {cn} from '@/lib/utils';
import type {Locale} from '@/types';
import {MultilingualFields} from '@/components/admin/MultilingualFields';
import {
  createEmptyTranslations,
  type ProductTranslations,
  type TranslatableFieldKey,
} from '@/lib/translation';
import {
  ImagePlus,
  Trash2,
  Plus,
  Package,
  Palette,
  Search as SearchIcon,
  Loader2,
  Check,
  ChevronDown,
  Upload,
} from 'lucide-react';

// ── Types ──

export interface ColorVariantForm {
  id: string;
  colorLabel: string;
  image: string;
}

export interface SeoFieldsForm {
  title: string;
  metaDescription: string;
  altImage: string;
  enabled: boolean;
}

export type SeoByLanguage = Record<Locale, SeoFieldsForm>;

export interface ProductFormData {
  categories: string[];
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

const CATEGORIES: {value: string; label: string}[] = [
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
    categories: [],
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

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: {value: string; label: string}[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(inputClass, 'flex items-center justify-between gap-2 text-left')}
      >
        <span className={cn('truncate', value.length === 0 && 'text-brand-muted/70')}>
          {value.length === 0
            ? placeholder
            : value.map((v) => CATEGORY_LABELS[v] ?? v).join(', ')}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-brand-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-brand-border bg-brand-surface shadow-lg">
            {options.map((opt) => {
              const selected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-brand-secondary hover:bg-brand-light/60"
                >
                  <span>{opt.label}</span>
                  {selected && <Check className="h-4 w-4 text-brand-primary" />}
                </button>
              );
            })}
          </div>
        </>
      )}
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function FileUploadButton({
  onUpload,
  label = 'Ajouter une image',
}: {
  onUpload: (dataUrl: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            readFileAsDataUrl(file)
              .then(onUpload)
              .catch(() => {});
          }
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-brand-border px-3 py-2 text-sm text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-colors"
      >
        <Upload className="h-4 w-4" />
        {label}
      </button>
    </>
  );
}

function ImagePreview({src, alt = ''}: {src?: string; alt?: string}) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-brand-border bg-brand-light">
      {src ? (
        <Image src={src} alt={alt} width={48} height={48} unoptimized className="h-full w-full object-cover" />
      ) : (
        <ImagePlus className="h-5 w-5 text-brand-muted" />
      )}
    </div>
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
      colorVariants: [...f.colorVariants, {id: uid(), colorLabel: '', image: ''}],
    }));

  const updateColorVariant = (id: string, field: 'colorLabel' | 'image', value: string) =>
    setFormData((f) => ({
      ...f,
      colorVariants: f.colorVariants.map((v) => (v.id === id ? {...v, [field]: value} : v)),
    }));

  const removeColorVariant = (id: string) =>
    setFormData((f) => ({
      ...f,
      colorVariants: f.colorVariants.filter((v) => v.id !== id),
    }));

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
    const {categories, price, inStock, featured, isNew, baseImages, colorVariants, seo} = formData;

    const pick = (field: keyof ProductTranslations['en']): Record<Locale, string> => ({
      en: translations.en[field],
      fr: translations.fr[field],
      ar: translations.ar[field],
    });

    return {
      ...(mode === 'edit' && productId ? {id: productId} : {}),
      name: pick('name'),
      description: pick('description'),
      material: pick('materials'),
      characteristics: pick('characteristics'),
      categories,
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
            <label className={labelClass}>Catégories</label>
            <MultiSelect
              options={CATEGORIES}
              value={formData.categories}
              onChange={(next) => setField('categories', next)}
              placeholder="Sélectionner une ou plusieurs catégories"
            />
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
                <ImagePreview src={variant.image} alt={variant.colorLabel} />
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <input
                    value={variant.colorLabel}
                    onChange={(e) => updateColorVariant(variant.id, 'colorLabel', e.target.value)}
                    className={inputClass}
                    placeholder="Couleur (ex. Bordeaux)"
                  />
                  <FileUploadButton
                    onUpload={(dataUrl) => updateColorVariant(variant.id, 'image', dataUrl)}
                    label={variant.image ? 'Changer l’image' : 'Ajouter une image'}
                  />
                </div>
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