import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(10),
  JWT_SECRET: z.string().min(16),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  SOLANA_RPC_URL: z.string().url().default('https://api.devnet.solana.com'),
  BOT_PRIVATE_KEYS: z.string().optional(),
  BOT_USERNAMES: z.string().optional(),
  GAME_TREASURY_WALLET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
