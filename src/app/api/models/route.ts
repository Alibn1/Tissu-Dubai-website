import {NextRequest, NextResponse} from 'next/server';
import {getModels, upsertModel} from '@/lib/data/store';
import type {Locale, Model} from '@/types';
import {isAdminRequest, unauthorizedResponse} from '@/lib/adminAuth';

export async function GET() {
  return NextResponse.json(getModels());
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const body = await request.json().catch(() => null);
  if (!body || typeof body.slug !== 'string' || !Array.isArray(body.collectionSlugs)) {
    return NextResponse.json(
      {error: 'Les champs "slug" et "collectionSlugs" (tableau) sont obligatoires.'},
      {status: 400}
    );
  }

  const name: Record<Locale, string> = {
    fr: typeof body.name?.fr === 'string' ? body.name.fr : '',
    ar: typeof body.name?.ar === 'string' ? body.name.ar : '',
    en: typeof body.name?.en === 'string' ? body.name.en : '',
  };

  const collectionSlugs = body.collectionSlugs.filter(
    (collectionSlug: unknown) => typeof collectionSlug === 'string'
  );

  const model: Model = {
    id: typeof body.id === 'string' && body.id ? body.id : body.slug,
    slug: body.slug,
    collectionSlugs,
    name,
  };

  upsertModel(model);
  return NextResponse.json({success: true, model}, {status: 201});
}