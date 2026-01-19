import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { attachUser, requireAuth } from '../middleware/auth';

const router = Router();

const profileUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  avatar: z.string().url().optional(),
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
      dailyChallengeProgress: true,
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

router.get('/game/history', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const take = Number.isFinite(limitParam) ? Math.max(1, Math.min(Number(limitParam), 20)) : 5;

  const sessions = await prisma.gameSession.findMany({
    where: {
      status: 'completed',
      OR: [{ winnerId: authUser.id }, { loserId: authUser.id }],
    },
    orderBy: { snapshotDate: 'desc' },
    take,
    include: {
      rounds: true,
      winner: true,
      loser: true,
    },
  });

  const history = sessions.map((session) => {
    const playerWon = session.winnerId === authUser.id;
    const opponentUser = playerWon ? session.loser : session.winner;

    const opponentName = opponentUser?.username ?? opponentUser?.walletAddress ?? 'CryptoNinja Bot';

    const rawScore = playerWon ? session.avgWinnerReaction : session.avgLoserReaction;
    const scoreValue = rawScore !== null && rawScore !== undefined ? Number(rawScore) : undefined;
    const scoreTime = scoreValue !== undefined ? Math.round(scoreValue) : undefined;

    const payout = session.payout !== null && session.payout !== undefined ? Number(session.payout) : 0;
    const stakeLoss = session.stakeLoser !== null && session.stakeLoser !== undefined ? Number(session.stakeLoser) : 0;

    const profit = playerWon ? payout : -stakeLoss;

    return {
      id: session.id,
      result: playerWon ? 'win' : 'loss',
      opponent: opponentName,
      profit,
      score: `${scoreTime ?? 0}ms`,
    };
  });

  return res.json({ history });
});

export { router as userRouter };
