import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export const updateLeaderboards = async () => {
  logger.info('Starting leaderboard update...');
  const snapshotDate = new Date();

  try {
    const topPlayers = await prisma.playerStats.findMany({
      where: { totalMatches: { gt: 0 } },
      take: 100,
      orderBy: [{ avgReaction: 'asc' }, { totalWins: 'desc' }],
    });

    const playerEntries = topPlayers.map((stats, index) => ({
      userId: stats.userId,
      position: index + 1,
      avgReaction: stats.avgReaction,
      matchesPlayed: stats.totalMatches,
      wins: stats.totalWins,
      totalSolWon: stats.totalSolWon,
      totalVolumeSolPlayed: stats.totalVolumeSolPlayed,
      snapshotDate,
    }));

    const topAmbassadors = await prisma.ambassadorProfile.findMany({
      take: 100,
      orderBy: { activeReferrals: 'desc' },
    });

    const ambassadorEntries = topAmbassadors.map((profile, index) => ({
      userId: profile.userId,
      position: index + 1,
      tier: profile.tier,
      activeReferrals: profile.activeReferrals,
      snapshotDate,
    }));

    await prisma.$transaction([
      prisma.leaderboardPlayer.deleteMany({}),
      prisma.leaderboardAmbassador.deleteMany({}),
      prisma.leaderboardPlayer.createMany({ data: playerEntries }),
      prisma.leaderboardAmbassador.createMany({ data: ambassadorEntries }),
    ]);

    logger.info(
      {
        playersUpdated: playerEntries.length,
        ambassadorsUpdated: ambassadorEntries.length,
      },
      'Leaderboards refreshed successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Failed to update leaderboards');
  }
};
