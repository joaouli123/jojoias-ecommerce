import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type UpstashWindow = `${number} s` | `${number} m` | `${number} h`;

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = upstashUrl && upstashToken ? new Redis({ url: upstashUrl, token: upstashToken }) : null;
const ratelimiters = new Map<string, Ratelimit>();

function toWindowDuration(windowMs: number): UpstashWindow {
  const seconds = Math.max(1, Math.ceil(windowMs / 1000));

  if (seconds % 3600 === 0) {
    return `${seconds / 3600} h`;
  }

  if (seconds % 60 === 0) {
    return `${seconds / 60} m`;
  }

  return `${seconds} s`;
}

export function isUpstashConfigured() {
  return Boolean(redis);
}

export async function consumeRateLimit(namespace: string, identifier: string, limit: number, windowMs: number) {
  if (!redis) {
    return null;
  }

  const limiterKey = `${namespace}:${limit}:${windowMs}`;
  let ratelimiter = ratelimiters.get(limiterKey);

  if (!ratelimiter) {
    ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, toWindowDuration(windowMs)),
      prefix: `ecommerce:${namespace}`,
      analytics: true,
    });

    ratelimiters.set(limiterKey, ratelimiter);
  }

  return ratelimiter.limit(identifier);
}

export async function getCacheValue<T>(key: string) {
  if (!redis) {
    return null;
  }

  return redis.get<T>(key);
}

export async function setCacheValue(key: string, value: unknown, ttlSeconds: number) {
  if (!redis) {
    return false;
  }

  await redis.set(key, value, { ex: ttlSeconds });
  return true;
}