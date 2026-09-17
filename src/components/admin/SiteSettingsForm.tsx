'use client';

import {useState} from 'react';
import {cn} from '@/lib/utils';
import type {Locale} from '@/types';
import {
  createEmptyText,
  CATEGORY_CARDS,
  DAY_LABELS,
  getDefaultSiteSettings,
  SOCIAL_LABELS,
  type BusinessDay,
  type CategoryCard,
  type CategoryCardId,
  type ContactInfo,
  type SiteSettings,
} from '@/lib/siteSettings';
import {TranslatableTextFields, type LocalizedField} from '@/components/admin/TranslatableTextFields';
import {FileUploadButton, ImagePreview} from '@/components/admin/imageUpload';
import {
  Home,
  MapPin,
  Clock,
  HelpCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Check,
} from 'lucide-react';

const TABS = [
  {key: 'contact', label: 'Contact', icon: MapPin},
  {key: 'hours', label: 'Horaires', icon: Clock},
  {key: 'home', label: 'Accueil', icon: Home},
  {key: 'faq', label: 'FAQ', icon: HelpCircle},
] as const;

type TabKey = (typeof TABS)[number]['key'];

let uidCounter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${uidCounter++}`;

const inputClass = cn(
  'w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-secondary',
  'placeholder:text-brand-muted/70',
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
);

const labelClass = 'block text-sm font-medium text-brand-secondary mb-1';

const iconBtnClass = cn(
  'rounded-md p-1.5 text-brand-muted transition-colors hover:bg-brand-light hover:text-brand-secondary disabled:cursor-not-allowed disabled:opacity-30'
);

const iconBtnDangerClass = cn(iconBtnClass, 'hover:text-brand-error');

function isValidUrl(s: string): boolean {
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function AddRowButton({onClick, label}: {onClick: () => void; label: string}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-2 rounded-md border border-dashed border-brand-border px-3 py-2 text-sm text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-colors"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

function SectionHeader({title, subtitle}: {title: string; subtitle?: string}) {
  return (
    <div className="border-b border-brand-border px-5 py-4">
      <h2 className="font-heading text-base font-semibold text-brand-secondary">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-brand-muted">{subtitle}</p>}
    </div>
  );
}

type Props = {
  initialData?: SiteSettings;
};

export function SiteSettingsForm({initialData}: Props) {
  const [settings, setSettings] = useState<SiteSettings>(() => ({
    ...getDefaultSiteSettings(),
    ...(initialData ?? {}),
  }));
  const [activeTab, setActiveTab] = useState<TabKey>('contact');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Contact ──

  const setContact = <K extends keyof ContactInfo>(key: K, value: ContactInfo[K]) =>
    setSettings((prev) => ({...prev, contact: {...prev.contact, [key]: value}}));

  const setPhone = (index: number, value: string) =>
    setContact(
      'phones',
      settings.contact.phones.map((p, i) => (i === index ? value : p))
    );

  const addPhone = () => setContact('phones', [...settings.contact.phones, '']);
  const removePhone = (index: number) =>
    setContact(
      'phones',
      settings.contact.phones.filter((_, i) => i !== index)
    );

  const setSocial = (key: keyof ContactInfo['social'], value: string) =>
    setSettings((prev) => ({
      ...prev,
      contact: {...prev.contact, social: {...prev.contact.social, [key]: value}},
    }));

  // ── Business hours ──

  const setHour = (day: BusinessDay, patch: {isClosed?: boolean; openTime?: string; closeTime?: string}) =>
    setSettings((prev) => ({
      ...prev,
      businessHours: prev.businessHours.map((h) => (h.day === day ? {...h, ...patch} : h)),
    }));

  // ── FAQ ──

  const addFaq = () =>
    setSettings((prev) => ({
      ...prev,
      faq: [...prev.faq, {id: uid('faq'), question: createEmptyText(), answer: createEmptyText()}],
    }));

  const updateFaqField = (id: string, lang: Locale, key: 'question' | 'answer', value: string) =>
    setSettings((prev) => ({
      ...prev,
      faq: prev.faq.map((e) => (e.id === id ? {...e, [key]: {...e[key], [lang]: value}} : e)),
    }));

  const removeFaq = (id: string) =>
    setSettings((prev) => ({...prev, faq: prev.faq.filter((e) => e.id !== id)}));

  const moveFaq = (id: string, dir: -1 | 1) =>
    setSettings((prev) => {
      const index = prev.faq.findIndex((e) => e.id === id);
      const target = index + dir;
      if (index < 0 || target < 0 || target >= prev.faq.length) return prev;
      const next = [...prev.faq];
      [next[index], next[target]] = [next[target], next[index]];
      return {...prev, faq: next};
    });

  const faqFields: LocalizedField[] = settings.faq.flatMap((entry, i) => [
    {
      id: `q-${entry.id}`,
      value: entry.question,
      heading: (
        <span className="flex w-full items-center justify-between gap-2">
          <span className="text-xs font-medium text-brand-muted">Question {i + 1}</span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => moveFaq(entry.id, -1)}
              disabled={i === 0}
              aria-label="Monter la question"
              className={iconBtnClass}
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => moveFaq(entry.id, 1)}
              disabled={i === settings.faq.length - 1}
              aria-label="Descendre la question"
              className={iconBtnClass}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => removeFaq(entry.id)}
              aria-label="Supprimer la question"
              className={iconBtnDangerClass}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </span>
        </span>
      ),
    },
    {
      id: `a-${entry.id}`,
      label: `Réponse ${i + 1}`,
      value: entry.answer,
      textarea: true,
    },
  ]);

  const handleFaqFieldChange = (fieldId: string, lang: Locale, value: string) => {
    const key = fieldId.startsWith('q-') ? 'question' : 'answer';
    const entryId = fieldId.slice(2);
    updateFaqField(entryId, lang, key, value);
  };

  // ── Homepage (hero + category cards) ──

  const updateHeroImage = (url: string) =>
    setSettings((prev) => ({
      ...prev,
      homepage: {...prev.homepage, hero: {...prev.homepage.hero, image: url}},
    }));

  const updateHeroField = (key: 'title' | 'subtitle', lang: Locale, value: string) =>
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        hero: {...prev.homepage.hero, [key]: {...prev.homepage.hero[key], [lang]: value}},
      },
    }));

  const setCardImage = (id: CategoryCardId, url: string) =>
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        categoryCards: prev.homepage.categoryCards.map((c) => (c.id === id ? {...c, image: url} : c)),
      },
    }));

  const updateCardField = (id: CategoryCardId, key: 'title' | 'description', lang: Locale, value: string) =>
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        categoryCards: prev.homepage.categoryCards.map((c) =>
          c.id === id ? {...c, [key]: {...c[key], [lang]: value}} : c
        ),
      },
    }));

  const heroFields: LocalizedField[] = [
    {id: 'hero-title', label: 'Titre', value: settings.homepage.hero.title},
    {id: 'hero-subtitle', label: 'Sous-titre', value: settings.homepage.hero.subtitle, textarea: true},
  ];

  const handleHeroChange = (fieldId: string, lang: Locale, value: string) =>
    updateHeroField(
      fieldId.replace('hero-', '') as 'title' | 'subtitle',
      lang,
      value
    );

  const cardFieldsFor = (card: CategoryCard): LocalizedField[] => [
    {id: `title-${card.id}`, label: 'Titre', value: card.title},
    {id: `desc-${card.id}`, label: 'Description', value: card.description, textarea: true},
  ];

  const handleCardChange = (card: CategoryCard, fieldId: string, lang: Locale, value: string) =>
    updateCardField(card.id, fieldId.startsWith('title-') ? 'title' : 'description', lang, value);

  // ── Save (mock, swap for a real GET/PUT /api/site-settings later) ──

  const validate = (): string[] => {
    const errors: string[] = [];
    for (const [key, url] of Object.entries(settings.contact.social)) {
      if (url && !isValidUrl(url)) {
        errors.push(`URL ${SOCIAL_LABELS[key as keyof typeof SOCIAL_LABELS]} invalide`);
      }
    }
    for (const hour of settings.businessHours) {
      if (!hour.isClosed && (!hour.openTime || !hour.closeTime)) {
        errors.push(`Horaires incomplets pour ${DAY_LABELS[hour.day]}`);
      }
    }
    return errors;
  };

  const saveSettings = async (payload: SiteSettings): Promise<boolean> => {
    const res = await fetch('/api/site-settings', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    return res.ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setSubmitError(errors.length > 0 ? errors.join('. ') : null);
    if (errors.length > 0) return;
    setSaving(true);
    try {
      const ok = await saveSettings(settings);
      if (ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const emptyState = (message: string) => (
    <div className="mb-4 rounded-md border border-dashed border-brand-border p-6 text-center text-sm text-brand-muted">
      {message}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Section tabs ── */}
      <div
        role="tablist"
        aria-label="Sections des paramètres du site"
        className="flex flex-wrap gap-1 rounded-md border border-brand-border bg-brand-surface p-1"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex flex-1 min-w-[130px] items-center justify-center gap-2 rounded px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:bg-brand-light/60 hover:text-brand-secondary'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 1. Contact ── */}
      {activeTab === 'contact' && (
        <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
          <SectionHeader
            title="Coordonnées"
            subtitle="Adresse, téléphones et réseaux sociaux"
          />
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Adresse</label>
                <textarea
                  rows={3}
                  value={settings.contact.address}
                  onChange={(e) => setContact('address', e.target.value)}
                  className={cn(inputClass, 'resize-none')}
                  placeholder="Rue, ville, pays"
                />
              </div>

              <div>
                <label className={labelClass}>Téléphones</label>
                <div className="space-y-2">
                  {settings.contact.phones.map((phone, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={phone}
                        onChange={(e) => setPhone(i, e.target.value)}
                        className={inputClass}
                        placeholder="+212 6 XX XX XX XX"
                      />
                      <button
                        type="button"
                        onClick={() => removePhone(i)}
                        disabled={settings.contact.phones.length === 1}
                        aria-label="Supprimer le numéro"
                        className={cn(iconBtnDangerClass, 'shrink-0')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <AddRowButton onClick={addPhone} label="Ajouter un numéro" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Numéro WhatsApp</label>
              <input
                value={settings.contact.whatsappNumber}
                onChange={(e) => setContact('whatsappNumber', e.target.value)}
                className={inputClass}
                placeholder="+212 6 XX XX XX XX"
              />
            </div>

            <div>
              <label className={labelClass}>Réseaux sociaux</label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(Object.keys(SOCIAL_LABELS) as (keyof ContactInfo['social'])[]).map((key) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-brand-muted">
                      {SOCIAL_LABELS[key]}
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={settings.contact.social[key] ?? ''}
                      onChange={(e) => setSocial(key, e.target.value)}
                      className={inputClass}
                      placeholder="https://…"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Business hours ── */}
      {activeTab === 'hours' && (
        <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
          <SectionHeader
            title="Horaires d'ouverture"
            subtitle="Définissez les heures d'ouverture par jour et marquez les jours de fermeture"
          />
          <div className="space-y-2 p-5">
            {settings.businessHours.map((hour) => (
              <div
                key={hour.day}
                className="flex flex-col gap-3 rounded-md border border-brand-border p-3 sm:flex-row sm:items-center"
              >
                <span className="w-32 shrink-0 text-sm font-medium text-brand-secondary">
                  {DAY_LABELS[hour.day]}
                </span>

                <button
                  type="button"
                  onClick={() => setHour(hour.day, {isClosed: !hour.isClosed})}
                  className={cn(
                    'inline-flex w-fit items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                    hour.isClosed
                      ? 'border-brand-error/40 bg-brand-error/5 text-brand-error'
                      : 'border-brand-border text-brand-muted hover:border-brand-primary/60 hover:text-brand-secondary'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-2 w-2 rounded-full',
                      hour.isClosed ? 'bg-brand-error' : 'bg-green-500'
                    )}
                  />
                  {hour.isClosed ? 'Fermé' : 'Ouvert'}
                </button>

                <div className="flex items-center gap-2 sm:ml-auto">
                  <input
                    type="time"
                    value={hour.openTime ?? ''}
                    disabled={hour.isClosed}
                    onChange={(e) => setHour(hour.day, {openTime: e.target.value})}
                    className={cn(inputClass, 'disabled:opacity-40')}
                    aria-label={`Heure d'ouverture ${DAY_LABELS[hour.day]}`}
                  />
                  <span className="text-brand-muted">→</span>
                  <input
                    type="time"
                    value={hour.closeTime ?? ''}
                    disabled={hour.isClosed}
                    onChange={(e) => setHour(hour.day, {closeTime: e.target.value})}
                    className={cn(inputClass, 'disabled:opacity-40')}
                    aria-label={`Heure de fermeture ${DAY_LABELS[hour.day]}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. FAQ ── */}
      {activeTab === 'faq' && (
        <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
          <SectionHeader
            title="FAQ — Questions fréquentes"
            subtitle="Ajoutez, réordonnez et traduisez les questions posées par vos clients"
          />
          <div className="p-5">
            {settings.faq.length === 0 ? (
              emptyState('Aucune question pour le moment. Ajoutez la première ci-dessous.')
            ) : (
              <TranslatableTextFields fields={faqFields} onChange={handleFaqFieldChange} ariaLabel="Langues de la FAQ" />
            )}
            <AddRowButton onClick={addFaq} label="Ajouter une question" />
          </div>
        </section>
      )}

      {/* ── 4. Homepage (hero + category cards) ── */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
            <SectionHeader
              title="Section Hero (page d'accueil)"
              subtitle="Image de bannière, titre et sous-titre. Les boutons restent fixes (catalogue et WhatsApp)."
            />
            <div className="space-y-5 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ImagePreview src={settings.homepage.hero.image || undefined} alt="Image du hero" />
                <div className="flex flex-col gap-1">
                  <FileUploadButton
                    onUpload={updateHeroImage}
                    label={settings.homepage.hero.image ? 'Changer l’image' : 'Ajouter une image'}
                  />
                  <p className="text-xs text-brand-muted">
                    Bannière pleine largeur — format 16:9 recommandé (ex. 1920×1080)
                  </p>
                </div>
              </div>
              <TranslatableTextFields
                fields={heroFields}
                onChange={handleHeroChange}
                ariaLabel="Langues de la section hero"
              />
            </div>
          </section>

          <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
            <SectionHeader
              title="Cartes de catégories — Caftan, Djellaba, Takchita"
              subtitle="Trois cartes fixes correspondant aux catégories du site : image, titre et description de chacune"
            />
            <div className="space-y-6 p-5">
              {settings.homepage.categoryCards.map((card) => {
                const cardLabel = CATEGORY_CARDS.find((c) => c.id === card.id)?.label ?? card.id;
                return (
                  <div key={card.id} className="space-y-4 rounded-md border border-brand-border p-4">
                    <h3 className="font-heading text-sm font-semibold text-brand-secondary">
                      Carte {cardLabel}
                    </h3>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <ImagePreview src={card.image || undefined} alt={`Image de la carte ${cardLabel}`} />
                      <div className="flex flex-col gap-1">
                        <FileUploadButton
                          onUpload={(url) => setCardImage(card.id, url)}
                          label={card.image ? 'Changer l’image' : 'Ajouter une image'}
                        />
                        <p className="text-xs text-brand-muted">
                          Format portrait — ratio 4:5 recommandé (ex. 800×1000)
                        </p>
                      </div>
                    </div>
                    <TranslatableTextFields
                      fields={cardFieldsFor(card)}
                      onChange={(fieldId, lang, value) => handleCardChange(card, fieldId, lang, value)}
                      ariaLabel={`Langues de la carte ${cardLabel}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ── Save ── */}
      {submitError && (
        <div className="rounded-md border border-brand-error/40 bg-brand-error/5 px-4 py-3 text-sm text-brand-error">
          {submitError}
        </div>
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
            <Check className="h-4 w-4" />
          ) : null}
          {saving ? 'Enregistrement…' : saved ? 'Enregistré !' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </form>
  );
}