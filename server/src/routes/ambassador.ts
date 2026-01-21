import { Router } from 'express';
import { prisma } from '../db/prisma';
import { attachUser, requireAuth } from '../middleware/auth';

const router = Router();

const generateReferralCode = () => `REFLEX-${Math.floor(1000 + Math.random() * 9000)}`;

const getOrCreateReferralCode = async (userId: string) => {
  const existingProfile = await prisma.ambassadorProfile.findUnique({
    where: { userId },
    select: { code: true },
  });

  if (existingProfile?.code) {
    return existingProfile.code;
  }

  while (true) {
    const candidate = generateReferralCode();

    try {
      const profile = await prisma.ambassadorProfile.create({
        data: {
          userId,
          code: candidate,
          tier: 'bronze',
        },
        select: { code: true },
      });

      return profile.code;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
        continue;
      }
      throw error;
    }
  }
};

router.get('/profile', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const referralCode = await getOrCreateReferralCode(authUser.id);

  return res.json({ referralCode });
});

router.get('/stats', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ambassadorProfile = await prisma.ambassadorProfile.findUnique({
    where: { userId: authUser.id },
    select: { userId: true },
  });

  if (!ambassadorProfile) {
    return res.json({
      totalReferrals: 0,
      activeReferrals: 0,
      totalRewards: 0,
    });
  }

  const [totalReferrals, activeReferrals, rewardAggregate] = await Promise.all([
    prisma.referral.count({ where: { ambassadorId: ambassadorProfile.userId } }),
    prisma.referral.count({
      where: { ambassadorId: ambassadorProfile.userId, totalMatches: { gte: 10 } },
    }),
    prisma.transaction.aggregate({
      where: { userId: authUser.id, type: 'referral_bonus' },
      _sum: { amount: true },
    }),
  ]);

  const totalRewards = rewardAggregate._sum.amount ? Number(rewardAggregate._sum.amount) : 0;

  return res.json({ totalReferrals, activeReferrals, totalRewards });
});

export { router as ambassadorRouter };
