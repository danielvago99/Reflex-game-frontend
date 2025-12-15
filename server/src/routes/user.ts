import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { attachUser, requireAuth } from '../middleware/auth';

const router = Router();

const profileUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  avatar: z.string().url().optional(),
});

const gameEndSchema = z.object({
  result: z.enum(['win', 'loss']),
  score: z.number().int().nonnegative(),
});

router.get('/dashboard', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      stats: true,
      ambassadorProfile: true,
      dailyChallenge: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ user });
});

router.patch('/profile', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = profileUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { username, avatar } = parsed.data;

  if (!username && !avatar) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  if (username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: authUser.id },
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: authUser.id },
    data: {
      username: username ?? undefined,
      avatar: avatar ?? undefined,
    },
    select: {
      id: true,
      username: true,
      avatar: true,
      walletAddress: true,
    },
  });

  return res.json({ user: updatedUser });
});

router.post('/game/end', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = gameEndSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { result, score } = parsed.data;

  const updatedStats = await prisma.$transaction(async (tx) => {
    const stats = await tx.playerStats.upsert({
      where: { userId: authUser.id },
      create: {
        userId: authUser.id,
        totalMatches: 1,
        totalWins: result === 'win' ? 1 : 0,
        totalLosses: result === 'loss' ? 1 : 0,
        totalReflexPoints: score,
      },
      update: {
        totalMatches: { increment: 1 },
        totalWins: { increment: result === 'win' ? 1 : 0 },
        totalLosses: { increment: result === 'loss' ? 1 : 0 },
        totalReflexPoints: { increment: score },
      },
    });

    const winRate =
      stats.totalMatches > 0 ? stats.totalWins / stats.totalMatches : 0;

    return tx.playerStats.update({
      where: { id: stats.id },
      data: { winRate },
    });
  });

  return res.json({ stats: updatedStats });
});

router.get('/game/history', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const take = Number.isFinite(limitParam) ? Math.max(1, Math.min(Number(limitParam), 20)) : 5;

  const matches = await prisma.gameMatch.findMany({
    where: {
      players: {
        some: { userId: authUser.id },
      },
    },
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      result: true,
      players: { include: { user: true } },
      session: true,
    },
  });

  const history = matches.map((match) => {
    const userPlayer = match.players.find((player) => player.userId === authUser.id);
    const opponent = match.players.find((player) => player.userId !== authUser.id);

    const playerWon = match.result?.winnerId === authUser.id;

    const opponentName = opponent?.isBot
      ? 'CryptoNinja Bot'
      : opponent?.user?.username ?? opponent?.user?.walletAddress ?? 'Unknown';

    const scoreTime = playerWon ? match.result?.winnerReactionMs : match.result?.loserReactionMs;

    return {
      id: match.id,
      result: playerWon ? 'win' : 'loss',
      opponent: opponentName,
      profit: playerWon ? 0 : 0,
      score: `${scoreTime ?? userPlayer?.reactionMs ?? 0}ms`,
    };
  });

  return res.json({ history });
});

export { router as userRouter };
