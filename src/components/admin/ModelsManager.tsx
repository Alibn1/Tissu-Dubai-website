'use client';

import {useState} from 'react';
import {cn} from '@/lib/utils';
import {Shirt, Plus, Trash2, Check, Languages, Loader2} from 'lucide-react';
import type {Collection, Locale, Model} from '@/types';
import {clientTranslate, DEEPL_TARGET_CODE} from '@/lib/translation';
import {toggleCollectionSlugs, EXCLUSIVE_COLLECTION_SLUG} from '@/lib/collections';

const NAME_LANGUAGES: {key: Locale; label: string; dir: 'ltr' | 'rtl'}[] = [
  {key: 'fr', label: 'Français', dir: 'ltr'},
  {key: 'en', label: 'English', dir: 'ltr'},
  {key: 'ar', label: 'العربية', dir: 'rtl'},
];

const SOURCE_ORDER: Locale[] = ['fr', 'en', 'ar'];

const inputClass = cn(
  'w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-secondary',
  'placeholder:text-brand-muted/70',
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
);

const labelClass = 'block text-sm font-medium text-brand-secondary mb-1';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function TranslateButton({
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

export function ModelsManager({
  collections,
  initialModels,
}: {
  collections: Collection[];
  initialModels: Model[];
}) {
  const [models, setModels] = useState<Model[]>(initialModels);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [names, setNames] = useState<{fr: string; en: string; ar: string}>({
    fr: '',
    en: '',
    ar: '',
  });
  const [added, setAdded] = useState(false);

  const refresh = async () => {
    const res = await fetch('/api/models');
    if (res.ok) setModels(await res.json());
  };

  // Slug is generated automatically from the model name (no admin input needed).
  const sourceName = names.fr.trim() || names.en.trim() || names.ar.trim();
  const autoSlug = slugify(sourceName);

  const canAdd = selectedCollections.length > 0 && autoSlug !== '';

  const flatList = models
    .filter((m) => !m.collectionSlugs.includes(EXCLUSIVE_COLLECTION_SLUG))
    .sort((a, b) => a.name.fr.localeCompare(b.name.fr));

  const toggleCollection = (value: string) =>
    setSelectedCollections((prev) => toggleCollectionSlugs(prev, value));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    // One row per model; its collections are stored in the junction table so
    // the same model can exist in several collections without duplication.
    const name = {fr: names.fr.trim(), en: names.en.trim(), ar: names.ar.trim()};
    const res = await fetch('/api/models', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: autoSlug, slug: autoSlug, collectionSlugs: selectedCollections, name}),
    });
    if (res.ok) await refresh();
    setNames({fr: '', en: '', ar: ''});
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/models/${encodeURIComponent(id)}`, {method: 'DELETE'});
    await refresh();
  };

  // One-click translate: pick the first non-empty language (FR → EN → AR) and
  // fill the other two languages, like in the product form.
  const translateNames = async () => {
    const source = SOURCE_ORDER.find((lang) => names[lang].trim() !== '');
    if (!source) return;
    const tasks: Promise<void>[] = [];
    for (const target of SOURCE_ORDER) {
      if (target === source) continue;
      tasks.push(
        (async () => {
          const translated = await clientTranslate(names[source].trim(), DEEPL_TARGET_CODE[target], source);
          setNames((prev) => ({...prev, [target]: translated}));
        })()
      );
    }
    await Promise.all(tasks);
  };

  return (
    <div className="space-y-8">
      {/* Add form */}
      <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
        <div className="flex items-start gap-3 border-b border-brand-border px-5 py-4">
          <Shirt className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
          <div>
            <h2 className="font-heading text-base font-semibold text-brand-secondary">
              Ajouter un modèle
            </h2>
            <p className="mt-0.5 text-sm text-brand-muted">
              Un modèle peut appartenir à une ou plusieurs collections
            </p>
          </div>
        </div>
        <form onSubmit={handleAdd} className="p-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClass}>Collections</label>
              <div className="flex flex-wrap gap-2">
                {collections.map((col) => {
                  const active = selectedCollections.includes(col.slug);
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
              <label className={labelClass}>Nom du modèle (traduit dans les 3 langues)</label>
              <p className="mb-3 text-sm text-brand-muted">
                Saisissez le nom dans une langue, puis cliquez sur « Traduire » pour le traduire dans les autres langues.
              </p>
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {NAME_LANGUAGES.map((lang) => (
                  <div key={lang.key}>
                    <label className={labelClass}>{lang.label}</label>
                    <input
                      dir={lang.dir}
                      value={names[lang.key]}
                      onChange={(e) => setNames({...names, [lang.key]: e.target.value})}
                      className={inputClass}
                      placeholder={
                        lang.key === 'fr'
                          ? 'Ex. Soie naturelle'
                          : lang.key === 'en'
                            ? 'Ex. Natural silk'
                            : 'مثال: حرير طبيعي'
                      }
                    />
                  </div>
                ))}
              </div>
              <TranslateButton
                onClick={translateNames}
                disabled={!SOURCE_ORDER.some((lang) => names[lang].trim() !== '')}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={!canAdd}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white transition-colors',
                  added
                    ? 'bg-green-600'
                    : 'bg-brand-primary hover:bg-brand-primary/90',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {added ? 'Ajouté !' : 'Ajouter le modèle'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* All models in one list, collections inline on a single line */}
      <section className="rounded-md border border-brand-border bg-brand-surface shadow-sm">
        <div className="border-b border-brand-border px-5 py-3">
          <h3 className="font-heading text-sm font-semibold text-brand-secondary">
            Modèles
            <span className="ml-2 text-xs font-normal text-brand-muted">
              ({flatList.length})
            </span>
          </h3>
        </div>
        <div className="p-3">
          {flatList.length === 0 ? (
            <p className="px-2 py-3 text-sm text-brand-muted">
              Aucun modèle ajouté.
            </p>
          ) : (
            <ul className="space-y-1">
              {flatList.map((model) => (
                <li
                  key={model.id}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-brand-light/60"
                >
                  <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-hidden">
                    <p className="shrink-0 truncate text-sm font-medium text-brand-secondary">
                      {model.name.fr}
                    </p>
                    <p className="shrink-0 truncate text-xs text-brand-muted">{model.slug}</p>
                    <div className="flex flex-nowrap items-center gap-1 overflow-hidden">
                      {model.collectionSlugs
                        .filter((slug) => slug !== EXCLUSIVE_COLLECTION_SLUG)
                        .map((slug) => {
                          const col = collections.find((c) => c.slug === slug);
                          if (!col) return null;
                          return (
                            <span
                              key={slug}
                              className="shrink-0 whitespace-nowrap rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-medium text-brand-primary"
                            >
                              {col.name.fr}
                            </span>
                          );
                        })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(model.id)}
                    className="shrink-0 rounded-md p-2 text-brand-muted hover:bg-brand-light hover:text-brand-error transition-colors"
                    aria-label="Supprimer le modèle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}