import { Router } from 'express';
import { prisma } from '../db/prisma';
import { attachUser, requireAuth } from '../middleware/auth';

const router = Router();

const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

router.get('/progress', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = getTodayDate();
  const progress = await prisma.jackpotProgress.findUnique({
    where: { userId_date: { userId: authUser.id, date: today } },
    select: { currentWinStreak: true },
  });

  return res.json({
    currentWinStreak: progress?.currentWinStreak ?? 0,
  });
});

export { router as jackpotRouter };
