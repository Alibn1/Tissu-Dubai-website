import {NextRequest, NextResponse} from 'next/server';
import {getProductById, updateProduct, deleteProduct, type ProductInput} from '@/lib/data/store';
import {isAdminRequest, unauthorizedResponse} from '@/lib/adminAuth';
import {missingVariantImageMessage, variantsMissingImage} from '@/lib/variantValidation';

type Params = Promise<{id: string}>;

export async function GET(_request: NextRequest, {params}: {params: Params}) {
  const {id} = await params;
  const product = getProductById(id);
  if (!product) {
    return NextResponse.json({error: 'Product not found'}, {status: 404});
  }
  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, {params}: {params: Params}) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const {id} = await params;
  const body = await request.json();
  const product = getProductById(id);
  if (!product) {
    return NextResponse.json({error: 'Product not found'}, {status: 404});
  }

  const input: Partial<ProductInput> = {
    name: body.name ?? product.name,
    description: body.description ?? product.description,
    material: body.material ?? product.material,
    materialSlug: body.materialSlug ?? product.materialSlug,
    collectionSlugs: Array.isArray(body.collectionSlugs)
      ? body.collectionSlugs.map((slug: unknown) => String(slug)).filter((slug: string) => slug !== '')
      : typeof body.collection === 'string' && body.collection !== ''
        ? [body.collection]
        : undefined,
    characteristics: body.characteristics ?? product.characteristics,
    width: body.width !== undefined ? body.width : product.width,
    price: body.price !== undefined ? body.price : product.price,
    inStock: body.inStock ?? product.inStock,
    featured: body.featured ?? product.featured,
    isNew: body.isNew ?? product.isNew,
    images: Array.isArray(body.images) ? body.images : undefined,
    variants: Array.isArray(body.variants)
      ? body.variants.map((v: Record<string, unknown>) => ({
          id: typeof v.id === 'string' ? v.id : undefined,
          color: v.color ?? {fr: '', ar: '', en: ''},
          colorHex: typeof v.colorHex === 'string' ? v.colorHex : '#000000',
          sku: typeof v.sku === 'string' ? v.sku : '',
          price: v.price == null ? null : Number(v.price),
          inStock: v.inStock !== false,
          images: Array.isArray(v.images) ? v.images : [],
        }))
      : undefined,
  };

  const missingImages = variantsMissingImage(input.variants ?? []);
  if (missingImages.length > 0) {
    return NextResponse.json(
      {error: missingVariantImageMessage(missingImages.map((v) => v.color))},
      {status: 400}
    );
  }

  try {
    const updated = updateProduct(id, input);
    return NextResponse.json({success: true, product: updated});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json({error: message}, {status: 400});
  }
}

export async function DELETE(_request: NextRequest, {params}: {params: Params}) {
  if (!isAdminRequest(_request)) return unauthorizedResponse();

  const {id} = await params;
  const deleted = deleteProduct(id);
  if (!deleted) {
    return NextResponse.json({error: 'Product not found'}, {status: 404});
  }
  return NextResponse.json({success: true});
}