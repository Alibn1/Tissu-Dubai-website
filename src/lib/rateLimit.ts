type Bucket = {count: number; resetAt: number};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/**
 * Best-effort per-IP throttle for credential endpoints.
 *
 * CAVEAT: Workers isolates are short-lived and share no memory, so this map
 * is per-isolate and resets on every cold start. It blunts a naive password
 * spray; it is NOT a real rate limit and must not be treated as one. The
 * actual control is a Cloudflare Rate Limiting Rule on the auth path, which
 * is enforced at the edge before the Worker is ever invoked.
 */

function evictIfFull(): void {
  if (buckets.size < MAX_BUCKETS) return;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size >= MAX_BUCKETS) buckets.clear();
}

export type Throttle = {limited: boolean; retryAfterSeconds: number};

export function isThrottled(key: string, limit: number): Throttle {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= Date.now()) return {limited: false, retryAfterSeconds: 0};
  if (bucket.count < limit) return {limited: false, retryAfterSeconds: 0};
  return {
    limited: true,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000)),
  };
}

export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    evictIfFull();
    buckets.set(key, {count: 1, resetAt: now + windowMs});
    return;
  }
  bucket.count += 1;
}

export function clearFailures(key: string): void {
  buckets.delete(key);
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}
