import { Router } from 'express';
import { prisma } from '../db/prisma';
import { attachUser, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/history', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const take = Number.isFinite(limitParam) ? Math.max(1, Math.min(Number(limitParam), 20)) : 5;

  const sessions = await prisma.gameSession.findMany({
    where: {
      status: 'completed',
      matchType: { in: ['friend', 'ranked'] },
      OR: [{ winnerId: authUser.id }, { loserId: authUser.id }],
    },
    orderBy: { snapshotDate: 'desc' },
    take,
    include: {
      winner: {
        select: {
          id: true,
          username: true,
          walletAddress: true,
        },
      },
      loser: {
        select: {
          id: true,
          username: true,
          walletAddress: true,
        },
      },
    },
  });

  const history = sessions.map((session) => {
    const playerWon = session.winnerId === authUser.id;
    const opponentUser = playerWon ? session.loser : session.winner;
    const opponentName = opponentUser?.username ?? opponentUser?.walletAddress ?? 'Unknown opponent';

    const payout = session.payout !== null && session.payout !== undefined ? Number(session.payout) : 0;
    const stakeLoss =
      session.stakeLoser !== null && session.stakeLoser !== undefined ? Number(session.stakeLoser) : 0;
    const stakeWin =
      session.stakeWinner !== null && session.stakeWinner !== undefined ? Number(session.stakeWinner) : 0;
    const stakeAmount = stakeLoss || stakeWin || 0;

    const winnerScore = session.winnerScore ?? 0;
    const loserScore = session.loserScore ?? 0;

    const playerScore = playerWon ? winnerScore : loserScore;
    const opponentScore = playerWon ? loserScore : winnerScore;

    const reactionSource = playerWon ? session.avgWinnerReaction : session.avgLoserReaction;
    const reactionTimeMs =
      reactionSource !== null && reactionSource !== undefined ? Math.round(Number(reactionSource)) : undefined;

    return {
      id: session.id,
      result: playerWon ? 'win' : 'loss',
      opponent: opponentName,
      stakeAmount,
      profit: playerWon ? payout : undefined,
      reactionTimeMs,
      playerScore,
      opponentScore,
      createdAt: session.snapshotDate?.toISOString(),
    };
  });

  return res.json({ history });
});

router.post('/report', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  if (!reason) {
    return res.status(400).json({ error: 'reason is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'email is invalid' });
  }

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      winnerId: true,
      loserId: true,
    },
  });

  if (!session) {
    return res.status(404).json({ error: 'Game session not found' });
  }

  if (session.winnerId !== authUser.id && session.loserId !== authUser.id) {
    return res.status(403).json({ error: 'You can only report players from your own matches' });
  }

  const report = await prisma.report.create({
    data: {
      userId: authUser.id,
      sessionId,
      email,
      reason,
    },
  });

  return res.status(201).json({
    report: {
      id: report.id,
      userId: report.userId,
      sessionId: report.sessionId,
      email: report.email,
      reason: report.reason,
      createdAt: report.createdAt,
    },
  });
});

export { router as gameRouter };
