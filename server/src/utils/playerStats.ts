import { prisma } from '../db/prisma';

export async function ensurePlayerStats(userId: string) {
  return prisma.playerStats.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}
