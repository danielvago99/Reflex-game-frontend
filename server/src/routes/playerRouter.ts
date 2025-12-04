import { Router } from 'express';
import { Prisma, type PlayerStats } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { attachUser, requireAuth } from '../middleware/auth';
import { ensurePlayerStats } from '../utils/playerStats';

const playerRouter = Router();

playerRouter.use(attachUser);

const usernameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .min(3, 'Username must be at least 3 characters long')
  .max(24, 'Username cannot exceed 24 characters');

const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    avatar: z.string().trim().url().nullable().optional(),
  })
  .refine((value) => value.username !== undefined || value.avatar !== undefined, {
    message: 'At least one field (username or avatar) must be provided',
    path: ['username'],
  });

const serializeStats = (stats: PlayerStats) => ({
  id: stats.id,
  userId: stats.userId,
  totalMatches: stats.totalMatches,
  totalWins: stats.totalWins,
  totalLosses: stats.totalLosses,
  winRate: stats.winRate,
  bestReactionMs: stats.bestReactionMs,
  averageReactionMs: stats.averageReactionMs,
  currentStreak: stats.currentStreak,
  bestStreak: stats.bestStreak,
  totalReflexPoints: stats.totalReflexPoints,
  totalSolWagered: Number(stats.totalSolWagered),
  totalSolWon: Number(stats.totalSolWon),
  freeStakes005: stats.freeStakes005,
  freeStakes010: stats.freeStakes010,
  freeStakes020: stats.freeStakes020,
  createdAt: stats.createdAt,
  updatedAt: stats.updatedAt,
});

const matchResultSchema = z.object({
  result: z.enum(['win', 'loss']),
  reactionMs: z.number().int().positive().nullable().optional(),
  stakeAmount: z.number().nonnegative().default(0),
  profit: z.number().default(0),
});

playerRouter.get('/me/profile', requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await ensurePlayerStats(userId);

    return res.json({ profile: user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

playerRouter.patch('/me/profile', requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return res.status(400).json({ error: firstIssue.message });
  }

  const { username, avatar } = parsed.data;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username ? { username } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        avatar: true,
      },
    });

    return res.json({ profile: updatedUser });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

playerRouter.get('/me/stats', requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const stats = await ensurePlayerStats(userId);
    return res.json({ stats: serializeStats(stats) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load player stats' });
  }
});

playerRouter.post('/me/stats/match', requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = matchResultSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return res.status(400).json({ error: firstIssue.message });
  }

  const { result, reactionMs, stakeAmount, profit } = parsed.data;

  try {
    const stats = await ensurePlayerStats(userId);

    const totalMatches = stats.totalMatches + 1;
    const totalWins = stats.totalWins + (result === 'win' ? 1 : 0);
    const totalLosses = stats.totalLosses + (result === 'loss' ? 1 : 0);
    const winRate = totalMatches > 0 ? totalWins / totalMatches : 0;

    let bestReactionMs = stats.bestReactionMs ?? undefined;
    if (reactionMs) {
      bestReactionMs = bestReactionMs ? Math.min(bestReactionMs, reactionMs) : reactionMs;
    }

    const averageReactionMs = reactionMs
      ? Math.round(
          ((stats.averageReactionMs ?? 0) * stats.totalMatches + reactionMs) /
            (stats.totalMatches + 1),
        )
      : stats.averageReactionMs ?? null;

    const currentStreak = result === 'win' ? stats.currentStreak + 1 : 0;
    const bestStreak = Math.max(stats.bestStreak, currentStreak);

    const updatedStats = await prisma.playerStats.update({
      where: { id: stats.id },
      data: {
        totalMatches,
        totalWins,
        totalLosses,
        winRate,
        bestReactionMs,
        averageReactionMs,
        currentStreak,
        bestStreak,
        totalSolWagered: new Prisma.Decimal(stats.totalSolWagered).plus(stakeAmount),
        totalSolWon: new Prisma.Decimal(stats.totalSolWon).plus(profit),
      },
    });

    return res.json({ stats: serializeStats(updatedStats) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record match result' });
  }
});

export { playerRouter };
