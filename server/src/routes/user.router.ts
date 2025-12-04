import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { attachUser, requireAuth } from '../middleware/auth';

const router = Router();

const profileSchema = z.object({
  username: z.string().min(3).max(32).optional(),
  avatar: z.string().min(1).optional(),
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

  const response = {
    profile: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      walletAddress: user.walletAddress,
    },
    stats: user.stats
      ? {
          totalWins: user.stats.totalWins,
          totalMatches: user.stats.totalMatches,
          totalReflexPoints: user.stats.totalReflexPoints,
          winRate: user.stats.winRate,
          freeStakes: {
            stake005: user.stats.freeStakes005,
            stake010: user.stats.freeStakes010,
            stake020: user.stats.freeStakes020,
          },
        }
      : null,
    ambassador: user.ambassadorProfile
      ? {
          code: user.ambassadorProfile.code,
          tier: user.ambassadorProfile.tier,
          totalReferrals: user.ambassadorProfile.totalReferrals,
          activeReferrals: user.ambassadorProfile.activeReferrals,
          totalReflexEarned: user.ambassadorProfile.totalReflexEarned,
          totalSolBonus: user.ambassadorProfile.totalSolBonus,
        }
      : null,
    dailyChallenge: user.dailyChallenge
      ? {
          date: user.dailyChallenge.date,
          matchesPlayed: user.dailyChallenge.matchesPlayed,
          completed: user.dailyChallenge.completed,
          rewardClaimed: user.dailyChallenge.rewardClaimed,
        }
      : null,
  };

  return res.json(response);
});

router.patch('/profile', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = profileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid profile data' });
  }

  const { username, avatar } = parsed.data;
  const updates: { username?: string | null; avatar?: string | null } = {};

  if (username !== undefined) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: authUser.id },
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    updates.username = username;
  }

  if (avatar !== undefined) {
    updates.avatar = avatar;
  }

  if (!updates.username && !updates.avatar) {
    return res.status(400).json({ error: 'No changes provided' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: authUser.id },
    data: updates,
    select: {
      id: true,
      username: true,
      avatar: true,
      walletAddress: true,
    },
  });

  return res.json({ profile: updatedUser });
});

export { router as userRouter };
