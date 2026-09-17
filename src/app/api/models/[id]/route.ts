import {NextRequest, NextResponse} from 'next/server';
import {removeModel, upsertModel} from '@/lib/data/store';
import type {Locale} from '@/types';
import {isAdminRequest, unauthorizedResponse} from '@/lib/adminAuth';

type Params = Promise<{id: string}>;

export async function PUT(request: NextRequest, {params}: {params: Params}) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const {id} = await params;
  const body = await request.json();
  if (typeof body.slug !== 'string' || typeof body.collectionSlug !== 'string') {
    return NextResponse.json(
      {error: 'Les champs "slug" et "collectionSlug" sont obligatoires.'},
      {status: 400}
    );
  }

  const name: Record<Locale, string> = {
    fr: typeof body.name?.fr === 'string' ? body.name.fr : '',
    ar: typeof body.name?.ar === 'string' ? body.name.ar : '',
    en: typeof body.name?.en === 'string' ? body.name.en : '',
  };

  upsertModel({id, slug: body.slug, collectionSlug: body.collectionSlug, name});
  return NextResponse.json({success: true});
}

export async function DELETE(_request: NextRequest, {params}: {params: Params}) {
  if (!isAdminRequest(_request)) return unauthorizedResponse();

  const {id} = await params;
  const removed = removeModel(id);
  if (!removed) {
    return NextResponse.json({error: 'Model not found'}, {status: 404});
  }
  return NextResponse.json({success: true});
}