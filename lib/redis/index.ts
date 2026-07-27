import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

/**
 * Get data from cache, if not present, execute fallback function and cache result.
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData) as T;
    }
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    // Proceed to fetchFn gracefully on Redis failure
  }

  const freshData = await fetchFn();

  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(freshData));
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
  }

  return freshData;
}

export async function invalidateCache(keyPattern: string): Promise<void> {
  try {
    const stream = redisClient.scanStream({
      match: keyPattern,
      count: 100,
    });

    for await (const keys of stream) {
      if (keys.length > 0) {
        const pipeline = redisClient.pipeline();
        keys.forEach((key: string) => pipeline.del(key));
        await pipeline.exec();
      }
    }
  } catch (error) {
    console.error(`Redis invalidateCache error for pattern ${keyPattern}:`, error);
  }
}

export default redisClient;
