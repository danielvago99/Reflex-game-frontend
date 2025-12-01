import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

if (!env.REDIS_URL) {
  throw new Error('REDIS_URL must be set to use Redis-backed features');
}

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis client error');
});

redisClient.connect().catch((err) => {
  logger.error({ err }, 'Failed to connect to Redis');
});
