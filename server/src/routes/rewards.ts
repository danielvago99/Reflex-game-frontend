import { Router } from 'express';
import { prisma } from '../db/prisma';
import { attachUser, requireAuth } from '../middleware/auth';

const router = Router();
const DAILY_TARGET = 5;

const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getRewardsPayload = async (userId: string) => {
  const today = getTodayDate();

  const [rewards, dailyProgress, weeklyStreak] = await Promise.all([
    prisma.playerRewards.findUnique({
      where: { userId },
      select: {
        reflexPoints: true,
        freeStakes05Sol: true,
        freeStakes01Sol: true,
        freeStakes02Sol: true,
      },
    }),
    prisma.dailyChallengeProgress.findUnique({
      where: { userId_date: { userId, date: today } },
      select: { matchesPlayed: true },
    }),
    prisma.weeklyStreak.findUnique({
      where: { userId },
      select: { currentDailyStreak: true },
    }),
  ]);

  return {
    reflexPoints: rewards?.reflexPoints ?? 0,
    dailyProgress: dailyProgress?.matchesPlayed ?? 0,
    dailyTarget: DAILY_TARGET,
    streak: weeklyStreak?.currentDailyStreak ?? 0,
    freeStakes005: rewards?.freeStakes05Sol ?? 0,
    freeStakes010: rewards?.freeStakes01Sol ?? 0,
    freeStakes020: rewards?.freeStakes02Sol ?? 0,
  };
};

router.get('/', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = await getRewardsPayload(authUser.id);
  return res.json(payload);
});

router.post('/redeem', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { amount } = req.body as { amount?: number };

  if (typeof amount !== 'number') {
    return res.status(400).json({ error: 'Invalid redeem request.' });
  }

  let cost = 0;
  let stakeField: 'freeStakes05Sol' | 'freeStakes01Sol' | 'freeStakes02Sol' | null = null;

  if (amount === 0.05) {
    cost = 90;
    stakeField = 'freeStakes05Sol';
  } else if (amount === 0.1) {
    cost = 170;
    stakeField = 'freeStakes01Sol';
  } else if (amount === 0.2) {
    cost = 320;
    stakeField = 'freeStakes02Sol';
  }

  if (!stakeField) {
    return res.status(400).json({ error: 'Invalid stake amount.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const rewards = await tx.playerRewards.findUnique({
        where: { userId: authUser.id },
        select: { reflexPoints: true },
      });

      if (!rewards) {
        throw new Error('Rewards record not found');
      }

      if (rewards.reflexPoints < cost) {
        throw new Error('Insufficient points');
      }

      await tx.playerRewards.update({
        where: { userId: authUser.id },
        data: {
          reflexPoints: { decrement: cost },
          totalFreeStakes: { increment: 1 },
          [stakeField]: { increment: 1 },
        },
      });
    });

    const payload = await getRewardsPayload(authUser.id);
    return res.json(payload);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Insufficient points') {
        return res.status(400).json({ error: 'Insufficient Reflex Points.' });
      }

      if (error.message === 'Rewards record not found') {
        return res.status(404).json({ error: 'Rewards record not found.' });
      }
    }

    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/use-free-stake', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { amount } = req.body as { amount?: number };

  if (typeof amount !== 'number') {
    return res.status(400).json({ error: 'Invalid free stake request.' });
  }

  let stakeField: 'freeStakes05Sol' | 'freeStakes01Sol' | 'freeStakes02Sol' | null = null;

  if (amount === 0.05) {
    stakeField = 'freeStakes05Sol';
  } else if (amount === 0.1) {
    stakeField = 'freeStakes01Sol';
  } else if (amount === 0.2) {
    stakeField = 'freeStakes02Sol';
  }

  if (!stakeField) {
    return res.status(400).json({ error: 'Invalid stake amount.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const rewards = await tx.playerRewards.findUnique({
        where: { userId: authUser.id },
        select: {
          totalFreeStakes: true,
          freeStakes05Sol: true,
          freeStakes01Sol: true,
          freeStakes02Sol: true,
        },
      });

      if (!rewards) {
        throw new Error('Rewards record not found');
      }

      if (rewards[stakeField] <= 0) {
        throw new Error('No free stakes available');
      }

      await tx.playerRewards.update({
        where: { userId: authUser.id },
        data: {
          totalFreeStakes: rewards.totalFreeStakes > 0 ? { decrement: 1 } : undefined,
          [stakeField]: { decrement: 1 },
        },
      });
    });

    const payload = await getRewardsPayload(authUser.id);
    return res.json(payload);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No free stakes available') {
        return res.status(400).json({ error: 'No free stakes available.' });
      }

      if (error.message === 'Rewards record not found') {
        return res.status(404).json({ error: 'Rewards record not found.' });
      }
    }

    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export { router as rewardsRouter };
