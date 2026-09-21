import type {Locale} from '@/types';

export type TranslatableFieldKey =
  | 'name'
  | 'materials'
  | 'description'
  | 'composition'
  | 'width'
  | 'origin';

export type ProductTranslations = Record<Locale, Record<TranslatableFieldKey, string>>;

export const TRANSLATION_LANGUAGES: {key: Locale; label: string; dir: 'ltr' | 'rtl'}[] = [
  {key: 'fr', label: 'Français', dir: 'ltr'},
  {key: 'en', label: 'English', dir: 'ltr'},
  {key: 'ar', label: 'العربية', dir: 'rtl'},
];

export const FIELD_LABELS: Record<TranslatableFieldKey, string> = {
  name: 'Nom du produit',
  materials: 'Modèle',
  description: 'Description',
  composition: 'Composition',
  width: 'Longueur / Largeur',
  origin: 'Origine',
};

export const FIELD_PLACEHOLDERS: Record<TranslatableFieldKey, string> = {
  name: 'Ex. Soie Royale Dubai',
  materials: 'Ex. Soie naturelle',
  description: 'Description du produit',
  composition: 'Ex. 100% soie naturelle',
  width: 'Ex. 3 m × 140 cm',
  origin: 'Ex. Maroc',
};

export const DEEPL_TARGET_CODE: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  ar: 'AR',
};

const BADGE: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
};

export function langLabel(lang: Locale): string {
  return BADGE[lang];
}

export function createEmptyTranslations(): ProductTranslations {
  return {
    en: {name: '', materials: '', description: '', composition: '', width: '', origin: ''},
    fr: {name: '', materials: '', description: '', composition: '', width: '', origin: ''},
    ar: {name: '', materials: '', description: '', composition: '', width: '', origin: ''},
  };
}

/**
 * Client-side wrapper for POST /api/translate. The DeepL key never leaves the
 * server — this only talks to our own route, which reads process.env.
 */
export async function clientTranslate(text: string, targetLang: string, sourceLang?: string): Promise<string> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      text,
      targetLang,
      ...(sourceLang ? {sourceLang} : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Échec de la traduction');
  }
  if (typeof data.translatedText !== 'string') {
    throw new Error('Réponse invalide du serveur de traduction');
  }
  return data.translatedText;
}