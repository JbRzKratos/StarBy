import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Module-level singletons: instantiated once per serverless warm instance
// (Upstash uses HTTP so there's no persistent TCP socket to leak)
let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || url.includes('YOUR_UPSTASH')) return null;

  if (!_ratelimit) {
    const redis = new Redis({ url, token });
    _ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
    });
  }

  return _ratelimit;
}

// Memory fallback store for when Upstash Redis is not yet configured
const inMemoryStore = new Map<string, { count: number; expires: number }>();

export async function rateLimit(identifier: string, limit = 10, windowMs = 60 * 1000) {
  const ratelimitInstance = getRatelimit();

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

