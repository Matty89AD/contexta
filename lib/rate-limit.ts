/**
 * In-memory sliding-window rate limiter.
 *
 * ⚠️  IMPORTANT — Vercel multi-instance limitation:
 * This store is process-local. On Vercel, each serverless function instance has
 * its own memory, so a single IP can hit the limit N times per instance.
 * For true distributed rate limiting across all instances you need an external
 * store: use @upstash/ratelimit + @upstash/redis (free tier available) or Vercel KV.
 *
 * For a low-traffic MVP this provides meaningful protection against simple abuse.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Prune stale entries periodically to prevent memory leaks.
let pruneCounter = 0;
const PRUNE_EVERY = 500;
const PRUNE_AGE_MS = 60 * 60 * 1000; // 1 hour

function maybePrune() {
  if (++pruneCounter % PRUNE_EVERY !== 0) return;
  const cutoff = Date.now() - PRUNE_AGE_MS;
  for (const [key, entry] of store.entries()) {
    if (entry.timestamps.every((t) => t < cutoff)) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Epoch ms when the oldest in-window request falls out and a slot opens. */
  resetMs: number;
}

/**
 * Check and record a rate-limit hit for a given key.
 *
 * @param key      Identifier, e.g. IP address
 * @param limit    Max allowed requests in the window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  maybePrune();
  const now = Date.now();
  const cutoff = now - windowMs;

  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t >= cutoff);

  if (entry.timestamps.length >= limit) {
    const resetMs = entry.timestamps[0] + windowMs;
    return { allowed: false, remaining: 0, resetMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetMs: now + windowMs,
  };
}

/** Extract the client IP from standard proxy headers. */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Build a 429 response with a Retry-After header. */
export function rateLimitedResponse(resetMs: number): Response {
  const retryAfterSecs = Math.ceil((resetMs - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSecs),
      },
    }
  );
}
