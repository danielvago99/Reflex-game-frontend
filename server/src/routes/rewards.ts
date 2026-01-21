import { Router } from 'express';
import { prisma } from '../db/prisma';
import { attachUser, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [rewards, dailyProgress, weeklyStreak] = await Promise.all([
    prisma.playerRewards.findUnique({
      where: { userId: authUser.id },
      select: { reflexPoints: true },
    }),
    prisma.dailyChallengeProgress.findUnique({
      where: { userId_date: { userId: authUser.id, date: today } },
      select: { matchesPlayed: true, completed: true },
    }),
    prisma.weeklyStreak.findUnique({
      where: { userId: authUser.id },
      select: { currentDailyStreak: true },
    }),
  ]);

  return res.json({
    reflexPoints: rewards?.reflexPoints ?? 0,
    dailyProgress: {
      matchesPlayed: dailyProgress?.matchesPlayed ?? 0,
      goal: 5,
      completed: dailyProgress?.completed ?? false,
    },
    currentStreak: weeklyStreak?.currentDailyStreak ?? 0,
  });
});

export { router as rewardsRouter };
