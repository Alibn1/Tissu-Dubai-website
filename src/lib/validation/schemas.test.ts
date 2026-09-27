import {describe, expect, it} from 'vitest';
import {
  checkImageBudget,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PAYLOAD_BYTES,
  modelInputSchema,
  parseOrThrow,
  productInputSchema,
  siteSettingsSchema,
  ValidationError
} from '@/lib/validation/schemas';

const validProduct = {
  name: {fr: 'Caftan en soie', ar: 'كفتان حرير', en: 'Silk caftan'},
  reference: 'TD-TEST-100',
  collectionSlugs: ['caftan'],
  price: 450,
  images: ['data:image/jpeg;base64,/9j/AAA'],
  variants: []
};

describe('product validation', () => {
  it('accepts a well-formed product', () => {
    expect(() => parseOrThrow(productInputSchema, validProduct, 'product')).not.toThrow();
  });

  it('refuses a product with a blank French name', () => {
    // The route defaulted name to {fr:'',ar:'',en:''}, so a nameless product was
    // the one thing that could be saved and still look like data.
    expect(() =>
      parseOrThrow(productInputSchema, {...validProduct, name: {fr: '', ar: '', en: ''}}, 'product')
    ).toThrow(ValidationError);
  });

  it('refuses a price that is not a number', () => {
    // Number('abc') is NaN, which SQLite stores as NULL: the price silently
    // vanished from the product instead of being rejected.
    expect(() => parseOrThrow(productInputSchema, {...validProduct, price: Number.NaN}, 'product')).toThrow(
      ValidationError
    );
  });

  it('refuses a missing reference or an empty collection', () => {
    expect(() => parseOrThrow(productInputSchema, {...validProduct, reference: '  '}, 'product')).toThrow(
      ValidationError
    );
    expect(() => parseOrThrow(productInputSchema, {...validProduct, collectionSlugs: []}, 'product')).toThrow(
      ValidationError
    );
  });

  it('refuses a variant whose colour hex is malformed', () => {
    expect(() =>
      parseOrThrow(
        productInputSchema,
        {...validProduct, variants: [{color: {fr: 'Rouge'}, colorHex: 'red'}]},
        'product'
      )
    ).toThrow(ValidationError);
  });

  it('refuses text longer than the column can hold', () => {
    expect(() =>
      parseOrThrow(
        productInputSchema,
        {...validProduct, description: {fr: 'x'.repeat(30_000)}},
        'product'
      )
    ).toThrow(ValidationError);
  });
});

describe('image budget', () => {
  const image = (bytes: number) => `data:image/jpeg;base64,${'A'.repeat(bytes)}`;

  it('rejects a single image above the per-image limit', () => {
    expect(() => checkImageBudget([{label: 'x', images: [image(MAX_IMAGE_BYTES + 1)]}])).toThrow(
      ValidationError
    );
  });

  it('rejects a group whose total exceeds the D1 row limit', () => {
    // This is the failure that used to be silent: D1 refuses a row over
    // 2,000,000 bytes and the save just did not happen.
    const many = Array.from({length: 5}, () => image(300_000));
    expect(() => checkImageBudget([{label: 'Images du produit', images: many}])).toThrow(
      /Reduisez le nombre d'images|R2/
    );
  });

  it('checks each group independently, because each is a separate D1 row', () => {
    // products.images and every product_variants.images live in different rows,
    // so the 2,000,000 byte ceiling applies to each one on its own. Summing
    // them would reject products that store perfectly well, and would not
    // prevent a single oversized row.
    const group = Array.from({length: 3}, () => image(240_000));

    expect(() =>
      checkImageBudget([
        {label: 'Images du produit', images: group},
        {label: 'Variante Rouge', images: group},
        {label: 'Variante Vert', images: group}
      ])
    ).not.toThrow();
  });

  it('still rejects one oversized group among several valid ones', () => {
    const small = Array.from({length: 2}, () => image(150_000));
    expect(() =>
      checkImageBudget([
        {label: 'Images du produit', images: small},
        {label: 'Variante Rouge', images: Array.from({length: 5}, () => image(300_000))}
      ])
    ).toThrow(/Variante Rouge/);
  });

  it('allows a normal amount of imagery', () => {
    expect(() =>
      checkImageBudget([{label: 'Images du produit', images: [image(120_000), image(90_000)]}])
    ).not.toThrow();
  });

  it('keeps the total below the documented D1 ceiling', () => {
    expect(MAX_IMAGES_PAYLOAD_BYTES).toBeLessThan(2_000_000);
  });
});

describe('model validation', () => {
  it('accepts a well-formed model', () => {
    expect(() =>
      parseOrThrow(
        modelInputSchema,
        {id: 'm1', slug: 'soie', name: {fr: 'Soie'}, collectionSlugs: ['caftan']},
        'model'
      )
    ).not.toThrow();
  });

  it('refuses a slug that is not url safe', () => {
    expect(() =>
      parseOrThrow(
        modelInputSchema,
        {slug: 'Soie Brodée!', name: {fr: 'Soie'}, collectionSlugs: ['caftan']},
        'model'
      )
    ).toThrow(ValidationError);
  });

  it('refuses a model with no name', () => {
    expect(() =>
      parseOrThrow(modelInputSchema, {slug: 'soie', name: {fr: ''}, collectionSlugs: ['caftan']}, 'model')
    ).toThrow(ValidationError);
  });
});

describe('site settings validation', () => {
  it('accepts the shape the admin form sends', () => {
    const settings = {
      contact: {
        address: '125, 1 Rue 10, Casablanca 20600, Maroc',
        phones: ['+212 6 12 34 56 78'],
        whatsappNumber: '+212 6 12 34 56 78',
        social: {instagram: 'https://instagram.com/tissudubai'}
      },
      businessHours: [
        {day: 'monday' as const, isClosed: false, openTime: '09:00', closeTime: '19:00'},
        {day: 'sunday' as const, isClosed: true}
      ],
      faq: [{id: 'faq-1', question: {fr: 'Question ?'}, answer: {fr: 'Reponse'}}],
      homepage: {
        hero: {image: '', title: {fr: 'Titre'}, subtitle: {fr: 'Sous-titre'}},
        collectionCards: [{id: 'caftan', image: '', title: {fr: 'Caftan'}}],
        genderCards: [{id: 'homme', image: '', title: {fr: 'Homme'}}]
      }
    };
    expect(() => parseOrThrow(siteSettingsSchema, settings, 'settings')).not.toThrow();
  });

  it('refuses an unknown opening day', () => {
    expect(() =>
      parseOrThrow(siteSettingsSchema, {businessHours: [{day: 'funday', isClosed: false}]}, 'settings')
    ).toThrow(ValidationError);
  });

  it('refuses a homepage image payload D1 could not store', () => {
    const settings = {
      homepage: {
        hero: {image: `data:image/jpeg;base64,${'A'.repeat(MAX_IMAGE_BYTES + 1)}`}
      }
    };
    expect(() => parseOrThrow(siteSettingsSchema, settings, 'settings')).not.toThrow();
    // The structural check passes; the size budget is what rejects it, and that
    // runs on the images that get written.
    expect(() =>
      checkImageBudget([{label: 'Image de la banniere', images: [settings.homepage.hero.image]}])
    ).toThrow(ValidationError);
  });
});
