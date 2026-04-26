import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Upstash Redis layer (stale-while-revalidate).
 * Falls back to no-op when not configured — app still works without Redis.
 */
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
if (url && token) {
  redis = new Redis({ url, token });
}

/**
 * Cache wrapper: try Redis first; on miss, run loader, write back.
 * If Redis isn't configured, just runs the loader (transparent fallback).
 *
 * @param key cache key
 * @param ttlSec time-to-live in seconds
 * @param loader async function that produces the value on cache miss
 */
export async function cached<T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T>
): Promise<T> {
  if (!redis) return loader();

  try {
    const hit = (await redis.get<T>(key)) as T | null;
    if (hit !== null && hit !== undefined) return hit;
  } catch (err) {
    console.warn("[redis] read failed, falling back:", err);
  }

  const value = await loader();
  try {
    await redis.set(key, value, { ex: ttlSec });
  } catch (err) {
    console.warn("[redis] write failed:", err);
  }
  return value;
}

/**
 * Invalidate one or many keys (call after price-update batches).
 */
export async function invalidate(...keys: string[]): Promise<void> {
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.warn("[redis] invalidate failed:", err);
  }
}

/**
 * Build a stable cache key from parts.
 */
export function cacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts.filter((p) => p !== undefined && p !== null).join(":");
}
