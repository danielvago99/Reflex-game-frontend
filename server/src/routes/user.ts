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

  const updatedStats = await prisma.playerStats.upsert({
    where: { userId: authUser.id },
    create: {
      userId: authUser.id,
      wins: result === 'win' ? 1 : 0,
      losses: result === 'loss' ? 1 : 0,
      reflexPoints: score,
      freeStakes: -1,
    },
    update: {
      wins: { increment: result === 'win' ? 1 : 0 },
      losses: { increment: result === 'loss' ? 1 : 0 },
      reflexPoints: { increment: score },
      freeStakes: { decrement: 1 },
    },
  });

  return res.json({ stats: updatedStats });
});

export { router as userRouter };
