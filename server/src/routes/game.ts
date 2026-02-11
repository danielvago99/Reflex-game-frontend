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

  const { sessionId, email, reason } = req.body as {
    sessionId?: string;
    email?: string;
    reason?: string;
  };

  const trimmedSessionId = typeof sessionId === 'string' ? sessionId.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!uuidRegex.test(trimmedSessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId.' });
  }

  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (trimmedReason.length < 3) {
    return res.status(400).json({ error: 'Reason must be at least 3 characters.' });
  }

  try {
    await prisma.report.create({
      data: {
        userId: authUser.id,
        sessionId: trimmedSessionId,
        email: trimmedEmail,
        reason: trimmedReason,
      },
    });

    return res.status(201).json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
});

export { router as gameRouter };
