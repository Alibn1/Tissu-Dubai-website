'use client';

import {useTranslations, useLocale} from 'next-intl';
import {useState, useMemo, useCallback} from 'react';
import {Search, SlidersHorizontal, X, ChevronDown, ArrowUpDown} from 'lucide-react';
import {cn} from '@/lib/utils';
import {ProductCard} from '@/components/product/ProductCard';
import {Checkbox} from '@/components/ui/Checkbox';
import {type Product, type Collection, type Locale, type FilterState, type Model} from '@/types';

type CatalogContentProps = {
  initialProducts: Product[];
  collections: Collection[];
  models: Model[];
  locale: string;
  activeCollection?: string;
  hideCollectionsFilter?: boolean;
  collectionFilterSlugs?: readonly string[];
};

const SORT_OPTIONS = [
  {value: 'featured', labelKey: 'catalog.filters.featured'},
  {value: 'newest', labelKey: 'catalog.filters.newest'},
  {value: 'price_asc', labelKey: 'catalog.filters.priceLowToHigh'},
  {value: 'price_desc', labelKey: 'catalog.filters.priceHighToLow'},
  {value: 'name', labelKey: 'catalog.filters.name'}
];

export function CatalogContent({
  initialProducts,
  collections,
  models,
  locale,
  activeCollection,
  hideCollectionsFilter = false,
  collectionFilterSlugs
}: CatalogContentProps) {
  const t = useTranslations();
  const loc = locale as Locale;

  const [filters, setFilters] = useState<FilterState>({
    collections: activeCollection ? [activeCollection] : [],
    materials: [],
    inStockOnly: false,
    search: '',
    sort: 'featured'
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<string>(hideCollectionsFilter ? 'materials' : 'collections');

  const modelById = useMemo(() => {
    const map = new Map<string, Model>();
    for (const model of models) map.set(model.id, model);
    return map;
  }, [models]);

  // Only models linked to a selected collection are offered.
  const modelOptions = useMemo(
    () =>
      filters.collections.length > 0
        ? models.filter((m) => m.collectionSlugs.some((slug) => filters.collections.includes(slug)))
        : models,
    [models, filters.collections]
  );

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    if (filters.collections.length > 0) {
      result = result.filter((p) =>
        filters.collections.some((slug) => p.collections.some((c) => c.slug === slug))
      );
    }
    if (filters.materials.length > 0) {
      result = result.filter((p) =>
        filters.materials.some((id) => {
          const model = modelById.get(id);
          return (
            model &&
            model.slug === p.materialSlug &&
            model.collectionSlugs.some((slug) => p.collections.some((c) => c.slug === slug))
          );
        })
      );
    }
    if (filters.inStockOnly) {
      result = result.filter((p) => p.inStock);
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter((p) =>
        Object.values(p.name).some((n) => n.toLowerCase().includes(term)) ||
        Object.values(p.material).some((m) => m.toLowerCase().includes(term)) ||
        p.reference.toLowerCase().includes(term)
      );
    }

    switch (filters.sort) {
      case 'price_asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'featured':
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'name':
        result.sort((a, b) => (a.name[loc] || a.name.fr).localeCompare(b.name[loc] || b.name.fr));
        break;
    }

    return result;
  }, [initialProducts, filters, loc, modelById]);

  const toggleFilter = useCallback((type: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[type] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return {...prev, [type]: next};
    });
  }, []);

  const activeFilterCount =
    (hideCollectionsFilter ? 0 : filters.collections.length) +
    filters.materials.length +
    (filters.inStockOnly ? 1 : 0);

  const selectedCollections = useMemo(
    () => collections.filter((c) => filters.collections.includes(c.slug)),
    [collections, filters.collections]
  );

  const itemSeparator = loc === 'ar' ? '، ' : ', ';
  const conjunction = t('catalog.and');
  const titleParts = selectedCollections.map((c) => c.name[loc] || c.name.fr);
  const titleText =
    titleParts.length > 1
      ? `${titleParts.slice(0, -1).join(itemSeparator)} ${conjunction} ${titleParts[titleParts.length - 1]}`
      : titleParts[0] ?? t('catalog.title');
  const descriptionText =
    selectedCollections.length === 1
      ? selectedCollections[0].description[loc] || selectedCollections[0].description.fr
      : null;

  const clearAllFilters = () => {
    setFilters({
      collections: hideCollectionsFilter && activeCollection ? [activeCollection] : [],
      materials: [],
      inStockOnly: false,
      search: '',
      sort: 'featured'
    });
  };

  return (
    <>
      {/* Dynamic title */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-secondary sm:text-3xl md:text-4xl">
          {titleText}
        </h1>
        {descriptionText && (
          <p className="mt-2 text-base text-brand-muted sm:text-lg">
            {descriptionText}
          </p>
        )}
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({...prev, search: e.target.value}))}
            placeholder={t('common.search')}
            className={cn(
              'w-full rounded-md border border-brand-border bg-brand-surface',
              'py-2.5 ps-10 pe-4 text-sm text-brand-secondary',
              'placeholder:text-brand-muted',
              'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary',
              'transition-colors'
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className={cn(
              'lg:hidden flex items-center gap-2',
              'rounded-md border border-brand-border px-4 py-2.5',
              'text-sm font-medium text-brand-secondary',
              'hover:bg-brand-light transition-colors'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('catalog.mobileFilters')}
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({...prev, sort: e.target.value}))}
              className={cn(
                'appearance-none rounded-md border border-brand-border bg-brand-surface',
                'py-2.5 ps-4 pe-9 text-sm text-brand-secondary',
                'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary',
                'cursor-pointer'
              )}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
            <ArrowUpDown className="absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-brand-muted">
        {filteredProducts.length === 1
          ? t('catalog.resultsCount', {count: 1}).split('|')[0]
          : t('catalog.resultsCount', {count: filteredProducts.length}).split('|')[1] || `${filteredProducts.length} fabrics found`}
      </p>

      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar
            filters={filters}
            toggleFilter={toggleFilter}
            setFilters={setFilters}
            collections={collections}
            models={modelOptions}
            locale={loc}
            onClear={clearAllFilters}
            activeFilterCount={activeFilterCount}
            hideCollectionsFilter={hideCollectionsFilter}
            collectionFilterSlugs={collectionFilterSlugs}
          />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6 xl:gap-7">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg text-brand-muted">
                {t('catalog.noResults')}
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 text-sm font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
              >
                {t('catalog.clearFilters')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            className={cn(
              'absolute inset-y-0 end-0 w-full max-w-sm',
              'bg-brand-surface shadow-xl',
              'flex flex-col'
            )}
          >
            <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
              <h2 className="font-heading text-lg font-semibold text-brand-secondary">
                {t('catalog.mobileFilters')}
              </h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-brand-light transition-colors"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5 text-brand-secondary" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent
                filters={filters}
                toggleFilter={toggleFilter}
                setFilters={setFilters}
                collections={collections}
                models={modelOptions}
                locale={loc}
                activeTab={activeFilterTab}
                setActiveTab={setActiveFilterTab}
                hideCollectionsFilter={hideCollectionsFilter}
                collectionFilterSlugs={collectionFilterSlugs}
              />
            </div>

            <div className="border-t border-brand-border p-4 flex gap-3">
              <button
                onClick={clearAllFilters}
                className={cn(
                  'flex-1 rounded-md border border-brand-border px-4 py-2.5',
                  'text-sm font-medium text-brand-secondary hover:bg-brand-light transition-colors'
                )}
              >
                {t('catalog.clearFilters')}
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className={cn(
                  'flex-1 rounded-md bg-brand-primary px-4 py-2.5',
                  'text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors'
                )}
              >
                {filteredProducts.length} {t('common.fabrics').toLowerCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────── Filter Sidebar (Desktop) ───────── */

function FilterSidebar({
  filters,
  toggleFilter,
  setFilters,
  collections,
  models,
  locale,
  onClear,
  activeFilterCount,
  hideCollectionsFilter,
  collectionFilterSlugs
}: {
  filters: FilterState;
  toggleFilter: (type: keyof FilterState, value: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  collections: Collection[];
  models: Model[];
  locale: Locale;
  onClear: () => void;
  activeFilterCount: number;
  hideCollectionsFilter?: boolean;
  collectionFilterSlugs?: readonly string[];
}) {
  const t = useTranslations('catalog.filters');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    collections: true,
    materials: true,
    availability: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({...prev, [section]: !prev[section]}));
  };

  const visibleCollections = collectionFilterSlugs
    ? collections.filter((c) => collectionFilterSlugs.includes(c.slug))
    : collections;

  return (
    <div className="space-y-1">
      {activeFilterCount > 0 && (
        <button
          onClick={onClear}
          className="mb-4 text-sm font-medium text-brand-primary hover:text-brand-secondary transition-colors"
        >
          {t('collections').replace(/s$/, '')} × {activeFilterCount} — Clear all
        </button>
      )}

      {/* Collections */}
      {!hideCollectionsFilter && visibleCollections.length > 0 && (
        <FilterSection title={t('collections')} expanded={expandedSections.collections} onToggle={() => toggleSection('collections')}>
          {visibleCollections.map((cat) => (
            <Checkbox
              key={cat.id}
              checked={filters.collections.includes(cat.slug)}
              onChange={() => toggleFilter('collections', cat.slug)}
            >
              {cat.name[locale] || cat.name.fr}
            </Checkbox>
          ))}
        </FilterSection>
      )}

      {/* Materials */}
      {models.length > 0 && (
        <FilterSection title={t('materials')} expanded={expandedSections.materials} onToggle={() => toggleSection('materials')}>
          {models.map((model) => (
            <Checkbox
              key={model.id}
              checked={filters.materials.includes(model.id)}
              onChange={() => toggleFilter('materials', model.id)}
            >
              {model.name[locale] || model.name.fr}
            </Checkbox>
          ))}
        </FilterSection>
      )}

      {/* Availability */}
      <FilterSection title={t('availability')} expanded={expandedSections.availability} onToggle={() => toggleSection('availability')}>
        <Checkbox
          checked={filters.inStockOnly}
          onChange={(checked) => setFilters((prev) => ({...prev, inStockOnly: checked}))}
        >
          {t('inStock')}
        </Checkbox>
      </FilterSection>
    </div>
  );
}

/* ───────── Filter Section Accordion ───────── */

function FilterSection({
  title,
  expanded,
  onToggle,
  children
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-brand-border py-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-2 text-sm font-semibold text-brand-secondary hover:text-brand-primary transition-colors"
      >
        {title}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>
      {expanded && <div className="pb-2">{children}</div>}
    </div>
  );
}

/* ───────── Mobile Filter Content ───────── */

function FilterContent({
  filters,
  toggleFilter,
  setFilters,
  collections,
  models,
  locale,
  activeTab,
  setActiveTab,
  hideCollectionsFilter,
  collectionFilterSlugs
}: {
  filters: FilterState;
  toggleFilter: (type: keyof FilterState, value: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  collections: Collection[];
  models: Model[];
  locale: Locale;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hideCollectionsFilter?: boolean;
  collectionFilterSlugs?: readonly string[];
}) {
  const t = useTranslations('catalog.filters');

  const visibleCollections = collectionFilterSlugs
    ? collections.filter((c) => collectionFilterSlugs.includes(c.slug))
    : collections;

  const tabs = [
    ...(hideCollectionsFilter || visibleCollections.length === 0
      ? []
      : [{id: 'collections', label: t('collections')}]),
    ...(models.length > 0 ? [{id: 'materials', label: t('materials')}] : []),
    {id: 'availability', label: t('availability')}
  ];

  const currentTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : (tabs[0]?.id ?? '');

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex border-b border-brand-border mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              currentTab === tab.id
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-muted hover:text-brand-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {currentTab === 'collections' && (
          <div className="space-y-1">
            {visibleCollections.map((cat) => (
              <Checkbox
                key={cat.id}
                checked={filters.collections.includes(cat.slug)}
                onChange={() => toggleFilter('collections', cat.slug)}
                className="py-2"
              >
                {cat.name[locale] || cat.name.fr}
              </Checkbox>
            ))}
          </div>
        )}

        {currentTab === 'materials' && (
          <div className="space-y-1">
            {models.map((model) => (
              <Checkbox
                key={model.id}
                checked={filters.materials.includes(model.id)}
                onChange={() => toggleFilter('materials', model.id)}
                className="py-2"
              >
                {model.name[locale] || model.name.fr}
              </Checkbox>
            ))}
          </div>
        )}

        {currentTab === 'availability' && (
          <div className="py-2">
            <Checkbox
              checked={filters.inStockOnly}
              onChange={(checked) => setFilters((prev) => ({...prev, inStockOnly: checked}))}
            >
              {t('inStock')}
            </Checkbox>
          </div>
        )}
      </div>
    </div>
  );
}
