import {describe, expect, it} from 'vitest';
import {
  createEmptySeo,
  generateSeoTitle,
  generateSeoValue,
  normalizeSeo,
  resolveSeoValue,
  seoFieldDisplayValue,
  seoOverride,
} from '@/lib/productSeo';

describe('product SEO helpers', () => {
  it('starts every language on auto with empty values', () => {
    expect(createEmptySeo()).toEqual({
      fr: {title: '', metaDescription: '', altImage: '', enabled: false},
      en: {title: '', metaDescription: '', altImage: '', enabled: false},
      ar: {title: '', metaDescription: '', altImage: '', enabled: false},
    });
  });

  it('keeps overrides for enabled languages only', () => {
    const normalized = normalizeSeo({
      fr: {title: 'Titre', metaDescription: 'Desc', altImage: 'Alt', enabled: true},
      en: {title: 'Ignored', metaDescription: 'Ignored', altImage: 'Ignored', enabled: false},
    });

    expect(normalized.fr.title).toBe('Titre');
    expect(normalized.en).toEqual({title: '', metaDescription: '', altImage: '', enabled: false});
  });

  it('survives junk input', () => {
    expect(normalizeSeo(undefined)).toEqual(createEmptySeo());
    expect(normalizeSeo('nope')).toEqual(createEmptySeo());
    expect(normalizeSeo({fr: 'nope'}).fr.enabled).toBe(false);
    expect(normalizeSeo({fr: {title: 42, enabled: true}}).fr.title).toBe('');
  });

  it('trims stored values', () => {
    expect(normalizeSeo({fr: {title: '  Titre  ', enabled: true}}).fr.title).toBe('Titre');
  });

  it('returns the override only while the language is enabled', () => {
    const seo = normalizeSeo({
      fr: {title: 'Titre FR', metaDescription: 'Desc FR', altImage: 'Alt FR', enabled: true},
    });

    expect(seoOverride(seo, 'fr', 'title')).toBe('Titre FR');
    expect(seoOverride(seo, 'en', 'title')).toBe('');
  });

  it('falls back to the product content when there is no override', () => {
    const name = 'Caftan Soie';
    const desc = 'Un caftan en soie double.';
    const auto = normalizeSeo(undefined);

    expect(seoOverride(auto, 'fr', 'title')).toBe('');
    expect(resolveSeoValue(auto, 'fr', 'title', name)).toBe(name);
    expect(resolveSeoValue(auto, 'fr', 'altImage', name)).toBe(name);
    // The product's own description is preferred over generated filler.
    expect(resolveSeoValue(auto, 'fr', 'metaDescription', name, desc)).toBe(desc);
  });

  it('generates a last-resort description only when the product has none', () => {
    const name = 'Caftan Soie';
    const auto = normalizeSeo(undefined);
    const generated = generateSeoValue('fr', 'metaDescription', name);

    expect(resolveSeoValue(auto, 'fr', 'metaDescription', name, '   ')).toBe(generated);
    expect(resolveSeoValue(auto, 'ar', 'metaDescription', name, '')).toBe(
      generateSeoValue('ar', 'metaDescription', name)
    );
  });

  it('keeps the layout brand out of generated titles', () => {
    // The locale layout appends "%s | Tissu Dubai" to every page title, so the
    // generated title must not repeat it.
    for (const lang of ['fr', 'en', 'ar'] as const) {
      expect(generateSeoTitle(lang, 'Caftan')).not.toMatch(/Tissu Dubai|تيسو دبي/);
    }
    expect(generateSeoTitle('fr', 'Caftan')).toBe('pour Caftan');
    expect(generateSeoTitle('en', 'Caftan')).toBe('for Caftan');
  });

  it('pre-fills the admin field with exactly what the page publishes', () => {
    const name = 'Caftan Soie';
    const desc = 'Un caftan en soie double.';
    const auto = normalizeSeo(undefined);

    expect(seoFieldDisplayValue(auto, 'fr', 'title', name, desc)).toBe(name);
    expect(seoFieldDisplayValue(auto, 'fr', 'metaDescription', name, desc)).toBe(desc);
    expect(seoFieldDisplayValue(auto, 'fr', 'altImage', name, desc)).toBe(name);
  });

  it('pre-fills with content that tracks the product name', () => {
    const auto = normalizeSeo(undefined);
    expect(seoFieldDisplayValue(auto, 'fr', 'title', 'Ancien nom')).toBe('Ancien nom');
    expect(seoFieldDisplayValue(auto, 'fr', 'title', 'Nouveau nom')).toBe('Nouveau nom');
  });

  it('shows the custom draft on Personnalisé, even while it is empty', () => {
    const custom = normalizeSeo({
      fr: {title: 'Mon titre', metaDescription: '', altImage: '', enabled: true},
    });

    expect(seoFieldDisplayValue(custom, 'fr', 'title', 'Caftan')).toBe('Mon titre');
    // An empty custom field stays empty in the form; the page still publishes
    // the product content because seoOverride() falls back.
    expect(seoFieldDisplayValue(custom, 'fr', 'metaDescription', 'Caftan', 'Desc')).toBe('');
    expect(resolveSeoValue(custom, 'fr', 'metaDescription', 'Caftan', 'Desc')).toBe('Desc');
  });

  it('shows the admin the same value the page will publish', () => {
    const name = 'Caftan Soie';
    const desc = 'Un caftan en soie double.';
    const cases: unknown[] = [
      undefined,
      {fr: {title: 'Perso', metaDescription: 'Perso desc', altImage: 'Perso alt', enabled: true}},
      {fr: {title: '', metaDescription: '', altImage: '', enabled: true}},
    ];

    for (const input of cases) {
      const seo = normalizeSeo(input);
      for (const field of ['title', 'metaDescription', 'altImage'] as const) {
        const shown = seoFieldDisplayValue(seo, 'fr', field, name, desc);
        const published = resolveSeoValue(seo, 'fr', field, name, desc);
        if (shown.trim()) {
          // What the admin reads in the form is what Google will read.
          expect(shown).toBe(published);
        }
      }
    }
  });
});
