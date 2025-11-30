// src/db/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '../config/env'; // tu máš zod-env s DATABASE_URL

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});

export default prisma;

// voliteľné, ale fajn:
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});

