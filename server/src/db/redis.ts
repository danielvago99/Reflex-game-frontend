import { Redis } from "@upstash/redis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

// ==============================
// Validate environment variables
// ==============================

if (!env.UPSTASH_REDIS_REST_URL) {
  throw new Error("Missing UPSTASH_REDIS_REST_URL");
}

if (!env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing UPSTASH_REDIS_REST_TOKEN");
}

// ==============================
// Create Upstash Redis client
// ==============================

export const redisClient = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// ==============================
// Test connection (REST ping)
// ==============================

redisClient
  .ping()
  .then((res) => logger.info({ res }, "Connected to Upstash Redis"))
  .catch((err) => logger.error({ err }, "Upstash Redis connection failed"));
