/**
 * Small in-memory limiter. Each server instance keeps its own counts, so this
 * slows down guessing and spam rather than stopping a large distributed attack;
 * the long passcode is what makes guessing hopeless.
 */
type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Map<string, Entry>>();

function bucket(name: string) {
  let b = buckets.get(name);
  if (!b) buckets.set(name, (b = new Map()));
  if (b.size > 5000) {
    const now = Date.now();
    for (const [k, e] of b) if (e.resetAt < now) b.delete(k);
  }
  return b;
}

/** The caller's IP as Vercel reports it. */
export function clientIp(request: Request) {
  return request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Seconds until `key` may try again, or 0 when it is under the limit. */
export function blockedFor(name: string, key: string, limit: number) {
  const e = bucket(name).get(key);
  if (!e || e.resetAt < Date.now()) return 0;
  return e.count >= limit ? Math.ceil((e.resetAt - Date.now()) / 1000) : 0;
}

/** Counts one hit against `key` within a rolling window. */
export function hit(name: string, key: string, windowMs: number) {
  const b = bucket(name);
  const now = Date.now();
  const e = b.get(key);
  if (!e || e.resetAt < now) b.set(key, { count: 1, resetAt: now + windowMs });
  else e.count++;
}

export function clear(name: string, key: string) {
  bucket(name).delete(key);
}
