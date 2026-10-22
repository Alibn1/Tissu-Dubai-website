/**
 * R2 object storage for images.
 *
 * Images used to live inline in D1 as base64 data URLs. That put a hard ceiling
 * on file size: a single D1 row is capped at 2 MB, and base64 inflates the
 * bytes by a third, so a modern phone photo could not be saved at all. R2
 * removes that ceiling, and the Worker serves the bytes back out of here.
 *
 * The bucket stays private. Images are read through the /api/media route
 * rather than a public r2.dev hostname, so the URLs stored in the database
 * stay origin-relative and keep working when a real domain replaces
 * *.workers.dev. It also means no CORS configuration and no third-party host
 * to add to the content security policy.
 */

/** The shape of the R2 binding this project relies on. */
export type R2Object = {
  body: ReadableStream | null;
  size: number;
  httpMetadata?: {contentType?: string; cacheControl?: string};
};

export type R2BucketLike = {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: {httpMetadata?: {contentType?: string; cacheControl?: string}}
  ): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
};

/**
 * The binding name in wrangler.jsonc. "IMAGES" is already taken by the
 * Cloudflare Images service, which is a different product, so the R2 bucket
 * gets its own name to keep the two apart.
 */
export const R2_BINDING = 'R2_IMAGES';

/** Where the media route is mounted. Excluded from the i18n middleware. */
export const MEDIA_ROUTE = '/api/media';

/**
 * Images are capped at 10 MB. That is well above a phone photo and far below
 * the Worker's request body limit.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Raster formats only. SVG is deliberately excluded: it is a scriptable
 * document, and serving one from the same origin as the admin panel would
 * hand anyone who can upload an image a stored cross-site scripting hole.
 */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif'
};

/** Images are immutable once uploaded, so they can be cached hard. */
export const IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Returns the R2 binding, or null when there is none.
 *
 * In production the binding always exists. During `next dev` the
 * miniflare bridge started by initOpenNextCloudflareForDev() provides one
 * too, pointing at a local emulator rather than the real bucket. Null means
 * the code is running somewhere without Cloudflare bindings at all.
 */
export async function getR2Bucket(): Promise<R2BucketLike | null> {
  try {
    const {getCloudflareContext} = await import('@opennextjs/cloudflare');
    const {env} = await getCloudflareContext({async: true});
    const binding = (env as Record<string, unknown>)[R2_BINDING];
    return (binding as R2BucketLike) ?? null;
  } catch {
    return null;
  }
}

/**
 * Rejects anything that is not a plain file name, so a crafted key cannot walk
 * out of the bucket or address an object the upload route never created.
 */
export function sanitizeFolder(folder: string): string {
  const cleaned = folder.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned.slice(0, 40) || 'misc';
}

/** Builds the key an image is stored under, e.g. "products/1f2c....webp". */
export function buildImageKey(folder: string, contentType: string): string {
  const extension = ALLOWED_IMAGE_TYPES[contentType] ?? '.bin';
  const id = crypto.randomUUID();
  return `${sanitizeFolder(folder)}/${id}${extension}`;
}

/** The URL an image is served from once it is in the bucket. */
export function mediaUrlFor(key: string): string {
  return `${MEDIA_ROUTE}/${key}`;
}

/**
 * Validates the key coming out of a media request. Path segments arrive
 * already decoded, so a ".." segment would otherwise escape the bucket.
 */
export function safeKey(segments: string[]): string | null {
  if (segments.length === 0) return null;
  for (const segment of segments) {
    if (!segment || segment === '.' || segment === '..') return null;
    if (segment.includes('\0') || segment.includes('/') || segment.includes('\\')) return null;
  }
  return segments.join('/');
}
