import {NextRequest, NextResponse} from 'next/server';
import {isAdminRequest, unauthorizedResponse} from '@/lib/adminAuth';
import {
  ALLOWED_IMAGE_TYPES,
  buildImageKey,
  getR2Bucket,
  IMAGE_CACHE_CONTROL,
  MAX_UPLOAD_BYTES,
  mediaUrlFor
} from '@/lib/storage/r2';

export const runtime = 'nodejs';

/**
 * Stores an uploaded image and returns the URL to save in the database.
 *
 * The browser never receives R2 credentials: the file goes through the
 * Worker, which checks the admin session first and writes with the binding.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({error: 'Expected a multipart form'}, {status: 400});
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({error: 'No file was uploaded'}, {status: 400});
  }

  const contentType = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES[contentType]) {
    return NextResponse.json(
      {error: `Unsupported image type: ${contentType || 'unknown'}. Use PNG, JPEG, WebP, AVIF or GIF.`},
      {status: 415}
    );
  }

  if (file.size === 0) {
    return NextResponse.json({error: 'The file is empty'}, {status: 400});
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const limit = Math.round(MAX_UPLOAD_BYTES / 1_000_000);
    return NextResponse.json(
      {error: `The image is too large. The limit is ${limit} MB.`},
      {status: 413}
    );
  }

  const folder = String(form.get('folder') ?? 'misc');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const bucket = await getR2Bucket();

  if (!bucket) {
    // No Cloudflare binding at all, which happens outside `next dev` and the
    // Workers runtime. Fall back to the old inline behaviour so the admin
    // panel still works, and say so, because the difference matters: an inline
    // image counts against the D1 row limit that R2 exists to avoid.
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return NextResponse.json({
      url: `data:${contentType};base64,${btoa(binary)}`,
      storage: 'inline'
    });
  }

  const key = buildImageKey(folder, contentType);
  await bucket.put(key, bytes, {
    httpMetadata: {contentType, cacheControl: IMAGE_CACHE_CONTROL}
  });

  return NextResponse.json({url: mediaUrlFor(key), storage: 'r2'});
}
