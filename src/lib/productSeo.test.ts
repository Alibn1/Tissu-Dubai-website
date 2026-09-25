import {describe, expect, it} from 'vitest';
import {
  createEmptySeo,
  generateSeoTitle,
  normalizeSeo,
  resolveSeoValue,
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

  it('falls back to the generated text when there is no override', () => {
    const name = 'Caftan Soie';
    const auto = normalizeSeo(undefined);

    expect(seoOverride(auto, 'fr', 'title')).toBe('');
    expect(resolveSeoValue(auto, 'fr', 'title', name)).toBe(generateSeoTitle('fr', name));
    expect(resolveSeoValue(auto, 'ar', 'title', name)).toBe(generateSeoTitle('ar', name));
    expect(resolveSeoValue(auto, 'en', 'metaDescription', name)).toContain(name);
    expect(resolveSeoValue(auto, 'en', 'altImage', name)).toBe(name);
  });

  it('prefers the stored override over the generated text', () => {
    const seo = normalizeSeo({
      ar: {title: 'عنوان مخصص', metaDescription: 'وصف مخصص', altImage: 'نص بديل', enabled: true},
    });

    expect(resolveSeoValue(seo, 'ar', 'title', 'قفطان')).toBe('عنوان مخصص');
    expect(resolveSeoValue(seo, 'ar', 'metaDescription', 'قفطان')).toBe('وصف مخصص');
    expect(resolveSeoValue(seo, 'ar', 'altImage', 'قفطان')).toBe('نص بديل');
  });
});
