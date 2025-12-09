"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("@upstash/redis");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// ==============================
// Validate environment variables
// ==============================
if (!env_1.env.UPSTASH_REDIS_REST_URL) {
    throw new Error("Missing UPSTASH_REDIS_REST_URL");
}
if (!env_1.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Missing UPSTASH_REDIS_REST_TOKEN");
}
// ==============================
// Create Upstash Redis client
// ==============================
exports.redisClient = new redis_1.Redis({
    url: env_1.env.UPSTASH_REDIS_REST_URL,
    token: env_1.env.UPSTASH_REDIS_REST_TOKEN,
});
// ==============================
// Test connection (REST ping)
// ==============================
exports.redisClient
    .ping()
    .then((res) => logger_1.logger.info({ res }, "Connected to Upstash Redis"))
    .catch((err) => logger_1.logger.error({ err }, "Upstash Redis connection failed"));
