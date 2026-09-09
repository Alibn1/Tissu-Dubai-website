import {NextRequest, NextResponse} from 'next/server';
import {products} from '@/mock/products';

type Params = Promise<{id: string}>;

export async function GET(_request: NextRequest, {params}: {params: Params}) {
  const {id} = await params;
  const product = products.find((p) => p.id === id);
  if (!product) {
    return NextResponse.json({error: 'Product not found'}, {status: 404});
  }
  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, {params}: {params: Params}) {
  const {id} = await params;
  const body = await request.json();

  const productIndex = products.findIndex((p) => p.id === id);
  if (productIndex === -1) {
    return NextResponse.json({error: 'Product not found'}, {status: 404});
  }

  // Update fields on the in-memory product (persisted only in mock data for now)
  const product = products[productIndex];
  if (body.name !== undefined) product.name = body.name;
  if (body.description !== undefined) product.description = body.description;
  if (body.material !== undefined) product.material = body.material;
  if (body.characteristics !== undefined) product.characteristics = body.characteristics;
  if (body.price !== undefined) product.price = body.price;
  if (body.inStock !== undefined) product.inStock = body.inStock;
  if (body.featured !== undefined) product.featured = body.featured;
  if (body.isNew !== undefined) product.isNew = body.isNew;

  return NextResponse.json({success: true, product});
}

export async function DELETE(_request: NextRequest, {params}: {params: Params}) {
  const {id} = await params;
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return NextResponse.json({error: 'Product not found'}, {status: 404});
  }

  products.splice(index, 1);
  return NextResponse.json({success: true});
}
