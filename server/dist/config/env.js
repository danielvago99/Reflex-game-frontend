"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().min(1).optional(),
    JWT_SECRET: zod_1.z.string().min(16),
    FRONTEND_ORIGIN: zod_1.z.string().url().default('http://localhost:5173'),
    SOLANA_RPC_URL: zod_1.z.string().url().default('https://api.devnet.solana.com'),
    SENTRY_DSN: zod_1.z.string().optional(),
});
exports.env = envSchema.parse(process.env);
