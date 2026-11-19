import { redis } from '@/lib/redis/client';

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const redisKey = `rl:${key}`;
  const current = await redis.incr(redisKey);
  if (current === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  return current <= limit;
}
