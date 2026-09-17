import {describe, expect, it} from 'vitest';
import {
  hasImage,
  localizedColorName,
  missingVariantImageMessage,
  variantsMissingImage,
} from '@/lib/variantValidation';

describe('variant image validation', () => {
  it('flags variants whose image is missing or blank', () => {
    const variants = [
      {color: {fr: 'Rouge'}, images: ['/images/products/product-1.svg']},
      {color: {fr: 'Bleu'}, images: []},
      {color: {fr: 'Vert'}, images: ['   ']},
      {color: {fr: 'Noir'}},
    ];

    expect(variantsMissingImage(variants).map((v) => v.color.fr)).toEqual(['Bleu', 'Vert', 'Noir']);
  });

  it('names the colors that still need an image', () => {
    expect(missingVariantImageMessage([{fr: 'Rouge'}])).toBe('Ajoutez une image pour « Rouge ».');
    expect(missingVariantImageMessage([{fr: 'Rouge'}, {en: 'Blue'}])).toBe(
      'Ajoutez une image pour : « Rouge », « Blue ».'
    );
    expect(missingVariantImageMessage([{}])).toBe('Ajoutez une image pour la couleur #1.');
  });

  it('checks image presence and falls back across languages', () => {
    expect(hasImage(['data:image/png;base64,AAA'])).toBe(true);
    expect(hasImage([' '])).toBe(false);
    expect(hasImage(undefined)).toBe(false);
    expect(localizedColorName({en: 'Blue'})).toBe('Blue');
    expect(localizedColorName(null)).toBe('');
  });
});
