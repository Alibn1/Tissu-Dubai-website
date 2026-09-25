import {NextRequest, NextResponse} from 'next/server';
import {getAllProducts, createProduct, type ProductInput} from '@/lib/data/store';
import {isAdminRequest, unauthorizedResponse} from '@/lib/adminAuth';
import {hasImage, missingVariantImageMessage, variantsMissingImage} from '@/lib/variantValidation';
import {normalizeSeo} from '@/lib/productSeo';

export async function GET() {
  const summary = getAllProducts().map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    reference: p.reference,
    collections: p.collections.map((c) => c.slug),
    price: p.price,
    inStock: p.inStock,
    featured: p.featured,
    isNew: p.isNew,
    variantsCount: p.variants.length,
  }));

  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({error: 'Invalid JSON body'}, {status: 400});
  }

  const input: ProductInput = {
    name: body.name ?? {fr: '', ar: '', en: ''},
    reference: typeof body.reference === 'string' ? body.reference : '',
    description: body.description,
    material: body.material,
    materialSlug: typeof body.materialSlug === 'string' ? body.materialSlug : '',
    collectionSlugs:
      Array.isArray(body.collectionSlugs)
        ? body.collectionSlugs.map((slug: unknown) => String(slug)).filter((slug: string) => slug !== '')
        : typeof body.collection === 'string' && body.collection !== ''
          ? [body.collection]
          : [],
    width: typeof body.width === 'string' ? body.width : firstNonEmpty(body.width),
    price: body.price == null ? null : Number(body.price),
    inStock: body.inStock !== false,
    featured: Boolean(body.featured),
    isNew: Boolean(body.isNew),
    characteristics: body.characteristics,
    images: Array.isArray(body.baseImages) ? body.baseImages : [],
    seo: normalizeSeo(body.seo),
    variants: Array.isArray(body.colorVariants)
      ? body.colorVariants.map((v: Record<string, unknown>) => ({
          color: v.colorLabel,
          colorHex: '#000000',
          sku: '',
          price: null,
          inStock: (v as {inStock: boolean}).inStock !== false,
          images: typeof (v as {image?: string}).image === 'string' && (v as {image: string}).image
            ? [(v as {image: string}).image]
            : [],
        }))
      : [],
  };

  if (!input.reference || input.collectionSlugs.length === 0) {
    return NextResponse.json(
      {error: 'Les champs "reference" et "collection" sont obligatoires.'},
      {status: 400}
    );
  }

  if (!hasImage(input.images)) {
    return NextResponse.json({error: 'Ajoutez au moins une image du produit.'}, {status: 400});
  }

  const missingImages = variantsMissingImage(input.variants ?? []);
  if (missingImages.length > 0) {
    return NextResponse.json(
      {error: missingVariantImageMessage(missingImages.map((v) => v.color))},
      {status: 400}
    );
  }

  try {
    const product = createProduct(input);
    return NextResponse.json({success: true, product}, {status: 201});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json({error: message}, {status: 400});
  }
}

function firstNonEmpty(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const record = value as Record<string, unknown>;
  return [record.fr, record.en, record.ar].find((v) => typeof v === 'string' && v.trim() !== '') as
    | string
    | undefined;
}