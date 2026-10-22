import {NextRequest} from 'next/server';
import {getR2Bucket, safeKey} from '@/lib/storage/r2';

export const runtime = 'nodejs';

type Params = Promise<{path: string[]}>;

/**
 * Serves an image out of the R2 bucket.
 *
 * The bucket is private, so this is the only way in. The route sits under
 * /api, which the i18n middleware ignores, and the URLs it produces are
 * origin-relative, so they survive a change of hostname.
 */
export async function GET(_request: NextRequest, {params}: {params: Params}) {
  const {path} = await params;
  const key = safeKey(path);
  if (!key) return new Response('Not found', {status: 404});

  const bucket = await getR2Bucket();
  if (!bucket) return new Response('Not found', {status: 404});

  const object = await bucket.get(key);
  if (!object?.body) return new Response('Not found', {status: 404});

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType ?? 'application/octet-stream');
  headers.set('Cache-Control', object.httpMetadata?.cacheControl ?? 'public, max-age=31536000, immutable');
  // The stored type is written by the upload route, which only accepts raster
  // images. Sniffing is disabled so a mislabelled object can never be
  // reinterpreted by the browser as something executable.
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(object.body, {headers});
}
