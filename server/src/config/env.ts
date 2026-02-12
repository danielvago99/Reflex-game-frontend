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
  SOLANA_PROGRAM_ID: z.string().min(32).optional(),
  SOLANA_SERVER_AUTHORITY_SECRET_KEY: z.string().optional(),
  SOLANA_CONFIG_SEED: z.string().default('config'),
  FREE_STAKE_SIGNING_SECRET: z.string().min(16).default('change-me-free-stake-secret'),
  FREE_STAKE_CLAIM_TTL_MS: z.coerce.number().default(120000),
  FREE_STAKE_DAILY_BUDGET_LAMPORTS: z.coerce.bigint().default(2000000000n),
  FREE_STAKE_MAX_PER_MATCH_LAMPORTS: z.coerce.bigint().default(200000000n),
  FREE_STAKE_MAX_MATCHES_PER_USER_PER_DAY: z.coerce.number().int().default(3),
  FREE_STAKE_MAX_LAMPORTS_PER_USER_PER_DAY: z.coerce.bigint().default(500000000n),
  BOT_PRIVATE_KEYS: z.string().optional(),
  BOT_USERNAMES: z.string().optional(),
  GAME_TREASURY_WALLET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
