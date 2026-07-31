/**
 * Basic per-key rate limiting for the answer-checking API routes, per the
 * product brief's "basic" requirement. Fixed-window counter, in memory.
 * Intended to be called only from server-side route handlers — it holds no
 * secrets, so unlike ai-judge.ts this doesn't need the "server-only" import
 * guard, which would otherwise block unit testing this module directly.
 *
 * Known limitation: this state is per server process. On a serverless
 * deployment (Vercel) each cold-started instance has its own counters, so
 * the effective limit is "N requests per window, per warm instance" rather
 * than a hard global cap. That's an acceptable trade-off for v1's traffic —
 * the goal is to blunt accidental hammering (e.g. a buggy retry loop), not
 * to provide airtight abuse protection.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

const buckets = new Map<string, Bucket>();

/**
 * Records one request for `key` and returns true if it should be rejected
 * (over the limit for the current window). `now` is injectable for tests.
 */
export function isRateLimited(key: string, now: number = Date.now()): boolean {
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
}
