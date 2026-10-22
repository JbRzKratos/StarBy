import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Module-level singletons: instantiated once per serverless warm instance
// (Upstash uses HTTP so there's no persistent TCP socket to leak)
let _redis: Redis | null = null;
const _ratelimiters = new Map<string, Ratelimit>();

function getRatelimit(limit: number, windowSeconds: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || url.includes('YOUR_UPSTASH')) return null;

  const cacheKey = `${limit}:${windowSeconds}`;
  const existing = _ratelimiters.get(cacheKey);
  if (existing) return existing;

  if (!_redis) {
    _redis = new Redis({ url, token });
  }

  // The limiter must be built for the requested budget. A single hard-coded
  // 10/minute limiter made every caller (including previews at 300/minute)
  // silently share the same tiny budget.
  const limiter = new Ratelimit({
    redis: _redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
  });
  _ratelimiters.set(cacheKey, limiter);
  return limiter;
}

// Memory fallback store for when Upstash Redis is not yet configured
const inMemoryStore = new Map<string, { count: number; expires: number }>();

export async function rateLimit(identifier: string, limit = 10, windowMs = 60 * 1000) {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const ratelimitInstance = getRatelimit(limit, windowSeconds);

  if (ratelimitInstance) {
    try {
      const result = await ratelimitInstance.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (e) {
      console.warn('Upstash Rate Limit warning, falling back to in-memory store:', e);
    }
  }

  if (ratelimitInstance) {
    try {
      const result = await ratelimitInstance.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (e) {
      console.warn('Upstash Rate Limit warning, falling back to in-memory store:', e);
    }
  }

  // Memory Fallback (development or Upstash not configured)
  const now = Date.now();
  const record = inMemoryStore.get(identifier);

  if (!record || now > record.expires) {
    inMemoryStore.set(identifier, { count: 1, expires: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.expires };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count, reset: record.expires };
}

