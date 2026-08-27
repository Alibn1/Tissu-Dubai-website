import {NextResponse} from 'next/server';
import {products} from '@/mock/products';

export async function GET() {
  const summary = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    reference: p.reference,
    category: p.category.slug,
    price: p.price,
    inStock: p.inStock,
    featured: p.featured,
    isNew: p.isNew,
    variantsCount: p.variants.length,
  }));

  return NextResponse.json(summary);
}
