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

  const { amount, cost } = req.body as { amount?: number; cost?: number };

  if (typeof amount !== 'number' || typeof cost !== 'number') {
    return res.status(400).json({ error: 'Invalid redeem request.' });
  }

  const stakeField =
    amount === 0.05
      ? 'freeStakes05Sol'
      : amount === 0.1
        ? 'freeStakes01Sol'
        : amount === 0.2
          ? 'freeStakes02Sol'
          : null;

  if (!stakeField) {
    return res.status(400).json({ error: 'Unsupported stake amount.' });
  }

  const rewards = await prisma.playerRewards.findUnique({
    where: { userId: authUser.id },
    select: {
      reflexPoints: true,
    },
  });

  if (!rewards) {
    return res.status(404).json({ error: 'Rewards record not found.' });
  }

  if (rewards.reflexPoints < cost) {
    return res.status(400).json({ error: 'Insufficient Reflex Points.' });
  }

  await prisma.$transaction(async (tx) => {
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
});

export { router as rewardsRouter };
