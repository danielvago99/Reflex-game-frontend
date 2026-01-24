import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import prisma from '../db/prisma';
import { env } from '../config/env';
import { redisClient } from '../db/redis';
import { matchmakingService } from '../services/matchmaking';
import { matchmakingEvents } from '../utils/events';

type Shape = 'circle' | 'square' | 'triangle';

interface Target {
  shape: Shape;
  color: string;
  colorName: string;
}

interface RoundTimers {
  showTimeout?: NodeJS.Timeout;
  botTimeout?: NodeJS.Timeout;
  roundTimeout?: NodeJS.Timeout;
}

interface SessionState extends RoundTimers {
  round: number;
  scores: { p1: number; p2: number };
  stakeAmount?: number;
  matchType?: 'ranked' | 'friend' | 'bot';
  isBotOpponent?: boolean;
  p1Staked: boolean;
  p2Staked: boolean;
  p1Ready: boolean;
  p2Ready: boolean;
  target?: Target;
  targetShownAt?: number;
  botReactionTime?: number;
  roundResolved: boolean;
  isFinished?: boolean;
  reactions: { p1?: number; p2?: number };
  history: Array<{
    round: number;
    p1Time: number;
    p2Time: number;
    winner: 'p1' | 'p2' | 'none';
    target: Target;
  }>;
  userId?: string;
  username?: string;
  sessionId: string;
}

interface RedisSessionState {
  round: number;
  scores: { p1: number; p2: number };
  stakeAmount?: number;
  matchType?: 'ranked' | 'friend' | 'bot';
  isBotOpponent?: boolean;
  p1Staked: boolean;
  p2Staked: boolean;
  p1Ready: boolean;
  p2Ready: boolean;
  target?: Target;
  targetShownAt?: number;
  botReactionTime?: number;
  roundResolved: boolean;
  reactions: { p1?: number; p2?: number };
  history: Array<{
    round: number;
    p1Time: number;
    p2Time: number;
    winner: 'p1' | 'p2' | 'none';
    target: Target;
  }>;
  userId?: string;
  username?: string;
}

interface SocketSessionRef {
  sessionId: string;
  userId?: string;
}

const SHAPES: Shape[] = ['circle', 'square', 'triangle'];
const COLORS = [
  { name: 'Green', value: '#00FF00' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Purple', value: '#9333EA' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Orange', value: '#FF6B00' },
  { name: 'Pink', value: '#FF0099' },
];

const DEFAULT_TARGET: Target = {
  shape: SHAPES[0],
  color: COLORS[0].value,
  colorName: COLORS[0].name,
};

const ROUNDS_TO_WIN = 3;
const MAX_ROUNDS = 5;
const BOT_GRACE_MS = 600;
const HUMAN_GRACE_MS = 2000;
const MAX_TIME = 999_999;
const BOT_REACTION_MIN = 400;
const BOT_REACTION_RANGE = 500; // results in 400-900ms reaction time
const GAME_STATE_TTL_SECONDS = 60 * 60;

const getSessionKey = (sessionId: string) => `game:session:${sessionId}`;

const serializeSessionState = (state: SessionState): RedisSessionState => ({
  round: state.round,
  scores: state.scores,
  stakeAmount: state.stakeAmount,
  matchType: state.matchType,
  isBotOpponent: state.isBotOpponent,
  p1Staked: state.p1Staked,
  p2Staked: state.p2Staked,
  p1Ready: state.p1Ready,
  p2Ready: state.p2Ready,
  target: state.target,
  targetShownAt: state.targetShownAt,
  botReactionTime: state.botReactionTime,
  roundResolved: state.roundResolved,
  reactions: state.reactions,
  history: state.history,
  userId: state.userId,
  username: state.username,
});

const persistSessionState = async (state: SessionState) => {
  // OPTIMIZATION: Do not use Redis for bot matches. RAM is sufficient.
  if (state.matchType === 'bot') return;

  try {
    const key = getSessionKey(state.sessionId);
    const payload = serializeSessionState(state);
    await redisClient.set(key, JSON.stringify(payload), { ex: GAME_STATE_TTL_SECONDS });
    logger.info({ sessionId: state.sessionId }, 'Session saved to Redis');
  } catch (error) {
    logger.error({ error }, 'Failed to persist session state');
  }
};

const isBotOpponent = (state: SessionState) => state.isBotOpponent ?? state.matchType === 'bot';

const createInstruction = (target: Target) => {
  const shapeName = target.shape === 'circle' ? 'Kruh' : target.shape === 'square' ? 'Štvorec' : 'Trojuholník';
  return `Hľadaj ${target.colorName} ${shapeName}`;
};

const pickTarget = (): Target => {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)] ?? DEFAULT_TARGET.shape;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)] ?? DEFAULT_TARGET;

  return {
    shape,
    color: color.value,
    colorName: color.name,
  };
};

const sendMessage = (socket: WebSocket, type: string, payload: unknown) => {
  socket.send(
    JSON.stringify({
      type,
      payload,
      timestamp: Date.now(),
    })
  );
};

const broadcastToSession = (sessionId: string, type: string, payload: unknown) => {
  const sockets = sessionSockets.get(sessionId);
  if (!sockets || sockets.size === 0) {
    logger.error({ sessionId, type }, 'No sockets found to broadcast');
    return 0;
  }

  for (const sessionSocket of sockets) {
    sendMessage(sessionSocket, type, payload);
  }

  return sockets.size;
};

const clearTimers = (state: SessionState) => {
  if (state.showTimeout) {
    clearTimeout(state.showTimeout);
    state.showTimeout = undefined;
  }

  if (state.botTimeout) {
    clearTimeout(state.botTimeout);
    state.botTimeout = undefined;
  }

  if (state.roundTimeout) {
    clearTimeout(state.roundTimeout);
    state.roundTimeout = undefined;
  }
};

const sessionAssignments = new Map<string, { p1?: string; p2?: string }>();
const sessionStates = new Map<string, SessionState>();
const userNames = new Map<string, string>();
const sessions = new WeakMap<WebSocket, SocketSessionRef>();
const activeUsers = new Map<string, WebSocket>();
const sessionSockets = new Map<string, Set<WebSocket>>();

const getOpponentSlot = (slot: 'p1' | 'p2') => (slot === 'p1' ? 'p2' : 'p1');

const getSlotForUser = (state: SessionState, userId?: string): 'p1' | 'p2' => {
  if (isBotOpponent(state)) {
    return 'p1';
  }

  const assignments = sessionAssignments.get(state.sessionId);
  if (userId && assignments?.p1 === userId) {
    return 'p1';
  }
  if (userId && assignments?.p2 === userId) {
    return 'p2';
  }
  if (assignments?.p1 && assignments.p1.startsWith('guest')) {
    return 'p1';
  }
  if (assignments?.p2 && assignments.p2.startsWith('guest')) {
    return 'p2';
  }

  return 'p1';
};

const getRelativeScores = (state: SessionState, slot: 'p1' | 'p2') => ({
  player: state.scores[slot],
  bot: state.scores[getOpponentSlot(slot)],
});

const broadcastRoundResult = (
  state: SessionState,
  payload: {
    round: number;
    p1Time: number;
    p2Time: number;
    winnerSlot: 'p1' | 'p2' | 'none';
    reason?: 'early-click' | 'no-reaction' | 'slower';
    rawBotTime: number;
    target: Target;
  }
) => {
  const sockets = sessionSockets.get(state.sessionId);
  if (!sockets || sockets.size === 0) return;

  for (const sessionSocket of sockets) {
    const sessionRef = sessions.get(sessionSocket);
    const slot = getSlotForUser(state, sessionRef?.userId);
    const scores = getRelativeScores(state, slot);
    const playerTime = slot === 'p1' ? payload.p1Time : payload.p2Time;
    const opponentTime = slot === 'p1' ? payload.p2Time : payload.p1Time;
    const winner =
      payload.winnerSlot === 'none' ? 'none' : payload.winnerSlot === slot ? 'player' : 'bot';

    sendMessage(sessionSocket, 'round:result', {
      round: payload.round,
      playerTime,
      opponentTime,
      p1Time: payload.p1Time,
      p2Time: payload.p2Time,
      playerSlot: slot,
      winnerSlot: payload.winnerSlot,
      target: payload.target,
      winner,
      reason: payload.reason ?? (winner === 'bot' ? 'slower' : undefined),
      scores,
      rawBotTime: payload.rawBotTime,
    });
  }
};

const handleMatchReset = async (state: SessionState, payload: any) => {
  clearTimers(state);

  state.round = 1;
  state.scores = { p1: 0, p2: 0 };
  state.p1Staked = false;
  state.p2Staked = false;
  state.p1Ready = false;
  state.p2Ready = false;
  state.history = [];
  state.roundResolved = false;
  state.target = undefined;
  state.targetShownAt = undefined;
  state.botReactionTime = undefined;
  state.reactions = {};

  state.stakeAmount = typeof payload?.stake === 'number' ? payload.stake : state.stakeAmount;
  const validTypes = ['ranked', 'friend', 'bot'];
  const requestedMatchType = payload?.matchType && validTypes.includes(payload.matchType) ? payload.matchType : 'friend';
  const assignments = sessionAssignments.get(state.sessionId);
  const hasHumanOpponent =
    assignments?.p1 && assignments?.p2 && assignments.p1 !== 'bot_opponent' && assignments.p2 !== 'bot_opponent';
  const matchType = hasHumanOpponent && requestedMatchType === 'bot' ? 'ranked' : requestedMatchType;

  state.matchType = matchType;
  if (matchType === 'bot') {
    state.isBotOpponent = true;
  } else if (matchType === 'friend') {
    state.isBotOpponent = false;
  } else if (matchType === 'ranked' && state.isBotOpponent === undefined) {
    state.isBotOpponent = false;
  }

  await persistSessionState(state);
};

const finalizedSessions = new Set<string>();
const userActiveSessions = new Map<string, string>();

const finalizeGame = async (state: SessionState, forfeit: boolean) => {
  const assignments = sessionAssignments.get(state.sessionId);
  if (assignments?.p1) {
    userActiveSessions.delete(assignments.p1);
  }
  if (assignments?.p2) {
    userActiveSessions.delete(assignments.p2);
  }
  if (state.userId) {
    userActiveSessions.delete(state.userId);
  }

  const sharedState = sessionStates.get(state.sessionId) ?? state;
  if (!sessionStates.has(state.sessionId)) {
    sessionStates.set(state.sessionId, sharedState);
  }

  if (sharedState.matchType === 'bot') {
    logger.info({ sessionId: sharedState.sessionId }, 'Bot match finished. No persistence needed.');
    // No Redis cleanup needed because we didn't persist it.
    finalizedSessions.delete(sharedState.sessionId);
    return;
  }

  if (sharedState.isFinished) {
    return;
  }

  sharedState.isFinished = true;
  if (sharedState !== state) {
    state.isFinished = true;
  }
  if (finalizedSessions.has(sharedState.sessionId)) {
    return;
  }

  finalizedSessions.add(sharedState.sessionId);
  logger.info(
    { scores: sharedState.scores, history: sharedState.history, forfeit },
    'Match completed. Persist final result with Prisma.'
  );

  const player1Id = assignments?.p1;
  const player2Id = assignments?.p2;

  if (!player1Id || !player2Id) {
    logger.error(
      { sessionId: sharedState.sessionId, player1Id, player2Id, matchType: sharedState.matchType },
      'Cannot persist match: Missing player IDs in session'
    );
    try {
      await redisClient.del(getSessionKey(sharedState.sessionId));
    } catch (error) {
      logger.warn({ error, sessionId: sharedState.sessionId }, 'Failed to cleanup Redis session state');
    } finally {
      finalizedSessions.delete(sharedState.sessionId);
    }
    return;
  }

  try {
    const winnerSlot =
      sharedState.scores.p1 >= sharedState.scores.p2 ? 'p1' : 'p2';
    const loserSlot = getOpponentSlot(winnerSlot);
    const stakeAmount =
      typeof sharedState.stakeAmount === 'number' && Number.isFinite(sharedState.stakeAmount)
        ? sharedState.stakeAmount
        : 0;
    const persistedMatchType: 'friend' | 'ranked' = sharedState.matchType === 'ranked' ? 'ranked' : 'friend';
    const winnerScore = sharedState.scores[winnerSlot];
    const loserScore = sharedState.scores[loserSlot];

    const playerTimes = sharedState.history
      .map((round) => round.p1Time)
      .filter((time) => Number.isFinite(time) && time < 999_000);

    const opponentTimes = sharedState.history
      .map((round) => round.p2Time)
      .filter((time) => Number.isFinite(time) && time < 999_000);

    const playerBestReaction = playerTimes.length ? Math.min(...playerTimes) : undefined;
    const playerAverageReaction = playerTimes.length
      ? playerTimes.reduce((sum, time) => sum + time, 0) / playerTimes.length
      : undefined;

    const opponentBestReaction = opponentTimes.length ? Math.min(...opponentTimes) : undefined;
    const opponentAverageReaction = opponentTimes.length
      ? opponentTimes.reduce((sum, time) => sum + time, 0) / opponentTimes.length
      : undefined;

    const winnerId = winnerSlot === 'p1' ? player1Id : player2Id;
    const loserId = winnerSlot === 'p1' ? player2Id : player1Id;

    const avgWinnerReaction = winnerSlot === 'p1' ? playerAverageReaction : opponentAverageReaction;
    const avgLoserReaction = winnerSlot === 'p1' ? opponentAverageReaction : playerAverageReaction;

    await prisma.$transaction(async (tx) => {
      const updatePlayerStats = async (
        userId: string,
        outcome: 'win' | 'loss',
        {
          bestReaction,
          averageReaction,
        }: { bestReaction?: number; averageReaction?: number }
      ) => {
        const existingStats = await tx.playerStats.findUnique({ where: { userId } });

        const previousMatches = existingStats?.totalMatches ?? 0;
        const previousWins = existingStats?.totalWins ?? 0;
        const previousLosses = existingStats?.totalLosses ?? 0;
        const previousAverage = existingStats?.avgReaction ?? undefined;
        const previousBest = existingStats?.bestReaction ?? undefined;

        const newTotalMatches = previousMatches + 1;
        const newTotalWins = previousWins + (outcome === 'win' ? 1 : 0);
        const newTotalLosses = previousLosses + (outcome === 'loss' ? 1 : 0);
        const newWinRate = newTotalMatches > 0 ? newTotalWins / newTotalMatches : 0;

        const newBestReaction =
          bestReaction !== undefined
            ? previousBest !== undefined
              ? Math.min(Number(previousBest), bestReaction)
              : bestReaction
            : previousBest !== undefined
              ? Number(previousBest)
              : undefined;

        const newAverageReaction =
          averageReaction !== undefined
            ? previousAverage !== undefined
              ? (Number(previousAverage) * previousMatches + averageReaction) / newTotalMatches
              : averageReaction
            : previousAverage !== undefined
              ? Number(previousAverage)
              : undefined;

        if (!existingStats) {
          await tx.playerStats.create({
            data: {
              userId,
              totalMatches: newTotalMatches,
              totalWins: newTotalWins,
              totalLosses: newTotalLosses,
              winRate: newWinRate,
              bestReaction: newBestReaction ?? 9999,
              avgReaction: newAverageReaction ?? 0,
              totalVolumeSolPlayed: stakeAmount,
              totalSolWon: outcome === 'win' ? stakeAmount : 0,
              totalSolLost: outcome === 'loss' ? stakeAmount : 0,
            },
          });
        } else {
          await tx.playerStats.update({
            where: { userId },
            data: {
              totalMatches: { increment: 1 },
              totalWins: outcome === 'win' ? { increment: 1 } : undefined,
              totalLosses: outcome === 'loss' ? { increment: 1 } : undefined,
              winRate: newWinRate,
              bestReaction: newBestReaction ?? undefined,
              avgReaction: newAverageReaction ?? undefined,
              totalVolumeSolPlayed: stakeAmount ? { increment: stakeAmount } : undefined,
              totalSolWon: outcome === 'win' && stakeAmount ? { increment: stakeAmount } : undefined,
              totalSolLost: outcome === 'loss' && stakeAmount ? { increment: stakeAmount } : undefined,
            },
          });
        }
      };

      const session = await tx.gameSession.create({
        data: {
          id: sharedState.sessionId,
          totalRounds: sharedState.history.length,
          status: 'completed',
          matchType: persistedMatchType,
          winnerId,
          loserId,
          avgWinnerReaction,
          avgLoserReaction,
          stakeWinner: winnerSlot === 'p1' ? stakeAmount : 0,
          stakeLoser: winnerSlot === 'p1' ? 0 : stakeAmount,
          payout: winnerSlot === 'p1' ? stakeAmount : 0,
          winnerScore,
          loserScore,
          snapshotDate: new Date(),
        },
      });

      for (const round of sharedState.history) {
        const roundPlayerTime = round.p1Time;
        const roundOpponentTime = round.p2Time;
        const roundWinnerId = round.winner === 'p1' ? player1Id : round.winner === 'p2' ? player2Id : null;
        const roundLoserId =
          round.winner === 'p1' ? player2Id : round.winner === 'p2' ? player1Id : null;

        await tx.gameRound.create({
          data: {
            gameSessionId: session.id,
            roundNumber: round.round,
            winnerId: roundWinnerId,
            loserId: roundLoserId,
            winnerReaction:
              round.winner === 'p1' ? roundPlayerTime : round.winner === 'p2' ? roundOpponentTime : null,
            loserReaction:
              round.winner === 'p1' ? roundOpponentTime : round.winner === 'p2' ? roundPlayerTime : null,
          },
        });
      }

      if (winnerId) {
        const winnerStats =
          winnerSlot === 'p1'
            ? { bestReaction: playerBestReaction, averageReaction: playerAverageReaction }
            : { bestReaction: opponentBestReaction, averageReaction: opponentAverageReaction };
        await updatePlayerStats(winnerId, 'win', winnerStats);
      }

      if (loserId) {
        const loserStats =
          winnerSlot === 'p1'
            ? { bestReaction: opponentBestReaction, averageReaction: opponentAverageReaction }
            : { bestReaction: playerBestReaction, averageReaction: playerAverageReaction };
        await updatePlayerStats(loserId, 'loss', loserStats);
      }

      const persistableUserIds = Array.from(new Set([player1Id, player2Id])).filter(
        (userId): userId is string => !!userId && userId !== 'bot_opponent' && !userId.startsWith('guest')
      );

      for (const userId of persistableUserIds) {
        const referral = await tx.referral.findFirst({
          where: { referredId: userId },
          select: { status: true, ambassadorId: true },
        });

        if (referral) {
          const updatedReferral = await tx.referral.update({
            where: { referredId: userId },
            data: { totalMatches: { increment: 1 } },
            select: { totalMatches: true },
          });

          if (referral.status === 'pending' && updatedReferral.totalMatches >= 10) {
            await tx.referral.update({
              where: { referredId: userId },
              data: { status: 'active' },
            });

            const ambassador = await tx.ambassadorProfile.update({
              where: { userId: referral.ambassadorId },
              data: { activeReferrals: { increment: 1 } },
              select: { activeReferrals: true, tier: true },
            });

            let rewardPoints = 90;
            if (ambassador.tier === 'silver') rewardPoints = 100;
            if (ambassador.tier === 'gold') rewardPoints = 130;

            await tx.playerRewards.update({
              where: { userId: referral.ambassadorId },
              data: { reflexPoints: { increment: rewardPoints } },
            });

            const newTier =
              ambassador.activeReferrals >= 30 ? 'gold' : ambassador.activeReferrals >= 10 ? 'silver' : 'bronze';

            if (newTier !== ambassador.tier) {
              await tx.ambassadorProfile.update({
                where: { userId: referral.ambassadorId },
                data: { tier: newTier },
              });
            }
          }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daily = await tx.dailyChallengeProgress.upsert({
          where: { userId_date: { userId, date: today } },
          update: { matchesPlayed: { increment: 1 } },
          create: { userId, date: today, matchesPlayed: 1 },
        });

        if (!daily.completed && daily.matchesPlayed === 5) {
          await tx.dailyChallengeProgress.update({
            where: { userId_date: { userId, date: today } },
            data: { completed: true },
          });

          await tx.playerRewards.update({
            where: { userId },
            data: { reflexPoints: { increment: 10 } },
          });

          const streakRecord = await tx.weeklyStreak.findUnique({
            where: { userId },
          });

          const normalizeDate = (value: Date) => {
            const normalized = new Date(value);
            normalized.setHours(0, 0, 0, 0);
            return normalized;
          };

          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          let nextStreak = 1;
          let weekStartDate = today;
          let weekEndDate = new Date(today);
          weekEndDate.setDate(weekEndDate.getDate() + 7);

          if (streakRecord) {
            const lastUpdate = normalizeDate(streakRecord.updatedAt);
            const weekEnded = today > normalizeDate(streakRecord.weekEndDate);

            if (!weekEnded && lastUpdate.getTime() === yesterday.getTime()) {
              nextStreak = streakRecord.currentDailyStreak + 1;
              weekStartDate = streakRecord.weekStartDate;
              weekEndDate = streakRecord.weekEndDate;
            }
          }

          if (nextStreak >= 7) {
            const resetWeekStart = new Date(today);
            const resetWeekEnd = new Date(today);
            resetWeekEnd.setDate(resetWeekEnd.getDate() + 7);

            await tx.playerRewards.update({
              where: { userId },
              data: { reflexPoints: { increment: 50 } },
            });

            if (streakRecord) {
              await tx.weeklyStreak.update({
                where: { userId: streakRecord.userId },
                data: {
                  currentDailyStreak: 0,
                  completed: true,
                  weekStartDate: resetWeekStart,
                  weekEndDate: resetWeekEnd,
                },
              });
            } else {
              await tx.weeklyStreak.create({
                data: {
                  userId,
                  currentDailyStreak: 0,
                  completed: true,
                  weekStartDate: resetWeekStart,
                  weekEndDate: resetWeekEnd,
                },
              });
            }
          } else if (streakRecord) {
            await tx.weeklyStreak.update({
              where: { userId: streakRecord.userId },
              data: {
                currentDailyStreak: nextStreak,
                completed: false,
                weekStartDate,
                weekEndDate,
              },
            });
          } else {
            await tx.weeklyStreak.create({
              data: {
                userId,
                currentDailyStreak: nextStreak,
                weekStartDate,
                weekEndDate,
              },
            });
          }
        }
      }

      if (winnerId && stakeAmount > 0) {
        await tx.transaction.create({
          data: {
            userId: winnerId,
            gameSessionId: session.id,
            amount: stakeAmount,
            type: 'game_payout',
            status: 'confirmed',
          },
        });
      }

      await redisClient.del(getSessionKey(sharedState.sessionId));
      finalizedSessions.delete(sharedState.sessionId);
    });
  } catch (error) {
    finalizedSessions.delete(sharedState.sessionId);
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
      logger.warn({ error }, 'Game already saved');
      return;
    }
    logger.error({ error }, 'Failed to persist match results');
  }
};

const finalizeRound = async (
  state: SessionState,
  options: {
    reason?: 'early-click' | 'no-reaction' | 'slower';
    clickingUserId?: string;
  }
): Promise<boolean> => {
  if (state.roundResolved) return false;

  state.roundResolved = true;
  clearTimers(state);

  const rawOpponentTime = state.botReactionTime ?? MAX_TIME;
  const p1Reaction = state.reactions.p1;
  const p2Reaction = state.reactions.p2;

  const clickingSlot = getSlotForUser(state, options.clickingUserId);
  const opponentSlot = getOpponentSlot(clickingSlot);

  let p1Time = Number.isFinite(p1Reaction) ? Math.round(p1Reaction ?? 0) : MAX_TIME;
  let p2Time = Number.isFinite(p2Reaction) ? Math.round(p2Reaction ?? 0) : MAX_TIME;

  if (state.isBotOpponent) {
    const botTime = Math.round(rawOpponentTime);
    p2Time = botTime;
    if (!Number.isFinite(p1Reaction)) {
      p1Time = MAX_TIME;
    }
  } else {
    if (!Number.isFinite(p1Reaction)) {
      p1Time = MAX_TIME;
    }
    if (!Number.isFinite(p2Reaction)) {
      p2Time = MAX_TIME;
    }
  }

  let winnerSlot: 'p1' | 'p2' | 'none' = 'none';
  if (options.reason === 'early-click') {
    winnerSlot = opponentSlot;
  } else if (p1Time < p2Time) {
    winnerSlot = 'p1';
  } else if (p2Time < p1Time) {
    winnerSlot = 'p2';
  }

  if (winnerSlot !== 'none') {
    state.scores[winnerSlot] += 1;
  }

  state.history.push({
    round: state.round,
    p1Time,
    p2Time,
    winner: winnerSlot,
    target: state.target ?? DEFAULT_TARGET,
  });
  logger.debug({ round: state.round, p1Time, p2Time }, 'Round history recorded with both reaction times');

  setTimeout(() => {
    broadcastRoundResult(state, {
      round: state.round,
      p1Time,
      p2Time,
      winnerSlot,
      reason: options.reason,
      rawBotTime: state.isBotOpponent ? rawOpponentTime : MAX_TIME,
      target: state.target ?? DEFAULT_TARGET,
    });
  }, 1000);

  const isMatchOver =
    state.scores.p1 >= ROUNDS_TO_WIN ||
    state.scores.p2 >= ROUNDS_TO_WIN ||
    state.round >= MAX_ROUNDS;

  if (isMatchOver) {
    return true;
  }

  await persistSessionState(state);
  return false;
};

const scheduleTargetShow = (sessionId: string, state: SessionState) => {
  const delay = 3000 + Math.random() * 5000;

  state.showTimeout = setTimeout(() => {
    state.targetShownAt = Date.now();
    state.botReactionTime = BOT_REACTION_MIN + Math.random() * BOT_REACTION_RANGE;
    void persistSessionState(state);

    const socketsCount = broadcastToSession(sessionId, 'round:show_target', {
      round: state.round,
      timestampStart: state.targetShownAt,
    });
    logger.info(
      { sessionId, round: state.round, target: state.target, socketsCount },
      'Broadcasting round:show_target',
    );

    if (state.isBotOpponent) {
      state.botTimeout = setTimeout(() => {
        void (async () => {
          const matchOver = await finalizeRound(state, { reason: 'no-reaction' });
          if (matchOver) {
            await finalizeGame(state, false);
          }
        })();
      }, state.botReactionTime + BOT_GRACE_MS);
    }
  }, delay);
};

const handleRoundReady = async (socket: WebSocket, sessionRef: SocketSessionRef, payload: any) => {
  const sessionId = sessionRef.sessionId;
  const sessionState = sessionStates.get(sessionId);
  if (!sessionState) {
    logger.error({ sessionId }, 'Session not found for round ready');
    return;
  }

  const requestedRound = typeof payload?.round === 'number' ? payload.round : sessionState.round;
  const isAdvancingRound = requestedRound > sessionState.round;
  if (isAdvancingRound) {
    sessionState.round = requestedRound;
    sessionState.roundResolved = false;
    sessionState.targetShownAt = undefined;
    sessionState.botReactionTime = undefined;
    sessionState.target = undefined;
    sessionState.reactions = {};
    clearTimers(sessionState);
  }

  sessionState.stakeAmount = typeof payload?.stake === 'number' ? payload.stake : sessionState.stakeAmount;
  if (sessionState.matchType === 'ranked') {
    logger.info({ sessionId }, 'Ignoring client matchType payload because session is already Ranked');
  } else {
    const validTypes = ['ranked', 'friend', 'bot'];
    const matchType = payload?.matchType && validTypes.includes(payload.matchType) ? payload.matchType : 'friend';
    sessionState.matchType = matchType;
    if (matchType === 'bot') {
      sessionState.isBotOpponent = true;
    } else if (matchType === 'friend') {
      sessionState.isBotOpponent = false;
    } else if (matchType === 'ranked' && sessionState.isBotOpponent === undefined) {
      sessionState.isBotOpponent = false;
    }
  }
  if (sessionState.showTimeout || sessionState.targetShownAt) {
    logger.info({ sessionId, round: sessionState.round }, 'Round already prepared; skipping duplicate ready');
    return;
  }

  if (!sessionState.target) {
    sessionState.target = pickTarget() ?? DEFAULT_TARGET;
  }
  const nextTarget = sessionState.target;

  const socketsCount = broadcastToSession(sessionId, 'round:prepare', {
    round: sessionState.round,
    target: nextTarget,
    instruction: createInstruction(nextTarget),
  });
  logger.info(
    { sessionId, round: sessionState.round, target: nextTarget, socketsCount },
    'Broadcasting round:prepare',
  );

  await persistSessionState(sessionState);
  scheduleTargetShow(sessionId, sessionState);
};

const handlePlayerClick = async (socket: WebSocket, sessionRef: SocketSessionRef, payload: any) => {
  const sessionId = sessionRef.sessionId;
  const sessionState = sessionStates.get(sessionId);
  if (!sessionState) {
    logger.error({ sessionId }, 'Session not found for player click');
    return;
  }

  if (sessionState.roundResolved) return;
  const slot = getSlotForUser(sessionState, sessionRef.userId);
  if (sessionState.reactions[slot] !== undefined) {
    return;
  }

  const now = Date.now();
  const clientClaimedDuration =
    typeof payload?.clientDuration === 'number' && Number.isFinite(payload.clientDuration)
      ? payload.clientDuration
      : undefined;

  if (!sessionState.targetShownAt) {
    sessionState.reactions[slot] = MAX_TIME;
    const matchOver = await finalizeRound(sessionState, {
      reason: 'early-click',
      clickingUserId: sessionRef.userId,
    });
    if (matchOver) {
      await finalizeGame(sessionState, false);
    }
    return;
  }

  const serverMeasuredTotal = now - sessionState.targetShownAt;
  const claimedDuration = clientClaimedDuration ?? serverMeasuredTotal;

  let validatedTime = Math.max(claimedDuration, 100);
  validatedTime = Math.min(validatedTime, serverMeasuredTotal);
  validatedTime = Math.max(validatedTime, serverMeasuredTotal - 1000);

  const playerTime = Math.round(validatedTime);
  sessionState.reactions[slot] = playerTime;

  if (sessionState.botTimeout && playerTime < (sessionState.botReactionTime ?? Infinity) + BOT_GRACE_MS) {
    clearTimeout(sessionState.botTimeout);
    sessionState.botTimeout = undefined;
  }

  if (sessionState.isBotOpponent) {
    const matchOver = await finalizeRound(sessionState, { clickingUserId: sessionRef.userId });
    if (matchOver) {
      await finalizeGame(sessionState, false);
    }
    return;
  }

  if (sessionState.reactions.p1 !== undefined && sessionState.reactions.p2 !== undefined) {
    const matchOver = await finalizeRound(sessionState, { clickingUserId: sessionRef.userId });
    if (matchOver) {
      await finalizeGame(sessionState, false);
    }
    return;
  }

  if (!sessionState.roundTimeout) {
    sessionState.roundTimeout = setTimeout(() => {
      void (async () => {
        const matchOver = await finalizeRound(sessionState, {
          reason: 'no-reaction',
          clickingUserId: sessionRef.userId,
        });
        if (matchOver) {
          await finalizeGame(sessionState, false);
        }
      })();
    }, HUMAN_GRACE_MS);
  }
};

export function createWsServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  const startRoundSequence = (state: SessionState) => {
    const sockets = sessionSockets.get(state.sessionId);
    if (!sockets || sockets.size === 0) {
      logger.error({ sessionId: state.sessionId }, 'CRITICAL: No sockets found to broadcast countdown');
      return;
    }

    logger.info({ sessionId: state.sessionId, count: sockets.size }, 'Broadcasting game:countdown');

    for (const sessionSocket of sockets) {
      sendMessage(sessionSocket, 'game:countdown', { count: 3 });
    }
  };

  matchmakingEvents.on('match_found', (data) => {
    const { player1Id, player2Id, stake } = data as {
      player1Id: string;
      player2Id: string;
      stake: number;
    };
    logger.info(`SERVER: Match found ${player1Id} vs ${player2Id}`);
    const socket1 = activeUsers.get(player1Id);
    const socket2 = activeUsers.get(player2Id);
    if (!socket1 || !socket2) {
      logger.warn(
        { player1Id, player2Id, socket1Online: Boolean(socket1), socket2Online: Boolean(socket2) },
        'Match found but one or more players offline; aborting session creation',
      );
      return;
    }

    const sessionId = crypto.randomUUID();
    const name1 = userNames.get(player1Id) ?? 'Player 1';
    const name2 = userNames.get(player2Id) ?? 'Player 2';
    const baseState: SessionState = {
      sessionId,
      round: 1,
      scores: { p1: 0, p2: 0 },
      matchType: 'ranked',
      isBotOpponent: false,
      stakeAmount: stake,
      roundResolved: false,
      reactions: {},
      history: [],
      p1Staked: false,
      p2Staked: false,
      p1Ready: false,
      p2Ready: false,
    };

    sessionStates.set(sessionId, baseState);
    sessionAssignments.set(sessionId, { p1: player1Id, p2: player2Id });
    sessionSockets.set(sessionId, new Set());
    userActiveSessions.set(player1Id, sessionId);
    userActiveSessions.set(player2Id, sessionId);

    const sockets = sessionSockets.get(sessionId);

    sessions.set(socket1, { sessionId, userId: player1Id });
    sockets?.add(socket1);
    sendMessage(socket1, 'match_found', {
      sessionId,
      opponentId: player2Id,
      opponentName: name2,
      stake,
      isBot: false,
    });

    sessions.set(socket2, { sessionId, userId: player2Id });
    sockets?.add(socket2);
    sendMessage(socket2, 'match_found', {
      sessionId,
      opponentId: player1Id,
      opponentName: name1,
      stake,
      isBot: false,
    });

    logger.info(
      { sessionId, player1Id, player2Id, socketsCount: sockets?.size ?? 0 },
      'Created human match session',
    );
  });

  matchmakingEvents.on('bot_match', (data) => {
    const { userId, stake } = data as { userId: string; stake: number };
    const socket = activeUsers.get(userId);

    const sessionId = crypto.randomUUID();
    const sessionState: SessionState = {
      sessionId,
      round: 1,
      scores: { p1: 0, p2: 0 },
      matchType: 'ranked',
      isBotOpponent: true,
      stakeAmount: stake,
      roundResolved: false,
      reactions: {},
      history: [],
      userId,
      username: userNames.get(userId),
      botReactionTime: 600,
      p1Staked: false,
      p2Staked: true,
      p1Ready: false,
      p2Ready: true,
    };

    sessionStates.set(sessionId, sessionState);
    sessionAssignments.set(sessionId, { p1: userId, p2: 'bot_opponent' });
    sessionSockets.set(sessionId, new Set());
    userActiveSessions.set(userId, sessionId);

    const sockets = sessionSockets.get(sessionId);

    if (socket) {
      sessions.set(socket, { sessionId, userId });
      sockets?.add(socket);

      sendMessage(socket, 'match_found', {
        sessionId,
        opponentId: 'bot_opponent',
        opponentName: 'Training Bot',
        stake,
        isBot: true,
      });
    }

    logger.info({ userId, sessionId }, 'Started Ranked Bot Match due to timeout');
  });

  wss.on('connection', async (socket: WebSocket, request) => {
    logger.info('WS client connected');

    let userId: string | undefined;
    let username: string | undefined;

    try {
      const url = new URL(request.url ?? '/ws', 'http://localhost');
      const queryToken = url.searchParams.get('token') ?? undefined;
      const authHeader = request.headers['authorization'];
      const headerToken = typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : undefined;

      const token = queryToken ?? headerToken;

      if (token) {
        const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string };
        userId = payload.sub;
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to verify WS JWT token');
    }

    if (userId) {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          if (user.username) {
            username = user.username;
          } else {
            const newName = `Player_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const updatedUser = await prisma.user.update({
              where: { id: userId },
              data: { username: newName },
            });
            username = updatedUser.username ?? newName;
          }
        }
      } catch (error) {
        logger.warn({ error, userId }, 'Failed to load or update user username');
      }
    }

    if (userId) {
      activeUsers.set(userId, socket);
      if (username) {
        userNames.set(userId, username);
      }
    }

    let sessionState: SessionState | undefined;
    if (userId) {
          const activeSessionId = userActiveSessions.get(userId);
          if (activeSessionId) {
            const existingState = sessionStates.get(activeSessionId);
            if (existingState && !existingState.isFinished) {
              sessions.set(socket, { sessionId: activeSessionId, userId });
              sessionState = existingState;

              const sockets = sessionSockets.get(activeSessionId) ?? new Set<WebSocket>();
              sockets.add(socket);
              sessionSockets.set(activeSessionId, sockets);

          const assignments = sessionAssignments.get(activeSessionId);
          const hasBotOpponent = isBotOpponent(existingState);
          const opponentId = hasBotOpponent
            ? 'bot_opponent'
            : assignments?.p1 === userId
              ? assignments?.p2
              : assignments?.p1;
          const opponentName = hasBotOpponent ? 'Training Bot' : undefined;

          logger.info({ userId, activeSessionId }, 'RESTORING ACTIVE SESSION for user');
          sendMessage(socket, 'match_found', {
            sessionId: activeSessionId,
            opponentId,
            opponentName,
            stake: existingState.stakeAmount,
            isBot: hasBotOpponent,
          });
        } else {
          userActiveSessions.delete(userId);
        }
      }
    }

    if (!sessionState) {
      const sessionId = crypto.randomUUID();

      sessionState = {
        round: 1,
        scores: { p1: 0, p2: 0 },
        stakeAmount: 0,
        matchType: 'friend',
        isBotOpponent: false,
        p1Staked: false,
        p2Staked: false,
        p1Ready: false,
        p2Ready: false,
        roundResolved: false,
        reactions: {},
        history: [],
        userId,
        username,
        sessionId,
      };

      sessions.set(socket, { sessionId, userId });
      sessionStates.set(sessionId, sessionState);
    }

    socket.on('message', (data) => {
      const raw = data.toString();
      const sessionRef = sessions.get(socket);
      if (!sessionRef) return;

      try {
        const message = JSON.parse(raw);
        logger.debug({ message }, 'WS message');

        switch (message.type) {
          case 'round:ready':
            void handleRoundReady(socket, sessionRef, message.payload);
            break;
          case 'player:click':
            void handlePlayerClick(socket, sessionRef, message.payload);
            break;
          case 'match:reset':
            {
              const sessionState = sessionStates.get(sessionRef.sessionId);
              if (!sessionState) {
                logger.error({ sessionId: sessionRef.sessionId }, 'Session not found for match reset');
                break;
              }
              void handleMatchReset(sessionState, message.payload);
            }
            break;
          case 'match:find':
            const { userId } = sessionRef;
            if (userId) {
              // CRITICAL FIX: Check if user is already in an active session (Sticky Session)
              if (userActiveSessions.has(userId)) {
                const activeSessionId = userActiveSessions.get(userId)!;
                const existingState = sessionStates.get(activeSessionId);
                const hasBotOpponent = existingState ? isBotOpponent(existingState) : false;

                // If the session exists and isn't finished, put them back in it immediately
                if (existingState && !existingState.isFinished) {
                  logger.info(
                    { userId, sessionId: activeSessionId },
                    'User tried to search but has active session. Restoring...',
                  );

                  // Re-bind socket
                  sessions.set(socket, { sessionId: activeSessionId, userId });
                  const roomSockets = sessionSockets.get(activeSessionId);
                  if (roomSockets) roomSockets.add(socket);

                  // Resend match info
                  const opponentId = hasBotOpponent ? 'bot_opponent' : 'opponent';
                  // Need to define stake/isBot from state
                  const isBot = hasBotOpponent;
                  const stake = existingState.stakeAmount || 0;

                  socket.send(
                    JSON.stringify({
                      type: 'match_found',
                      payload: {
                        sessionId: activeSessionId,
                        opponentId,
                        stake,
                        isBot,
                      },
                    }),
                  );
                  return; // STOP HERE! Do not add to queue.
                } else {
                  // Stale session, clean it up
                  userActiveSessions.delete(userId);
                }
              }

              // Standard Matchmaking logic (Only if no active session)
              void (async () => {
                try {
                  const stats = await prisma.playerStats.findUnique({ where: { userId: userId! } });
                  const reaction = stats?.avgReaction ? Number(stats.avgReaction) : 600;

                  // Ensure stake is a number
                  const requestedStake = Number(message.payload?.stake) || 0;

                  await matchmakingService.addToQueue(userId!, requestedStake, reaction);
                  sendMessage(socket, 'match:searching', { stake: requestedStake });
                } catch (e) {
                  logger.error({ error: e }, 'Matchmaking queue error');
                }
              })();
            }
            break;
          case 'match:stake_confirmed': {
            const sessionId = typeof message.payload?.sessionId === 'string' ? message.payload.sessionId : undefined;
            if (!sessionId) return;

            const assignments = sessionAssignments.get(sessionId);
            const hasHumanOpponent =
              assignments?.p1 && assignments?.p2 && assignments.p1 !== 'bot_opponent' && assignments.p2 !== 'bot_opponent';
            const requestedMatchType = message.payload?.matchType === 'bot' ? 'bot' : 'ranked';
            const sessionState = sessionStates.get(sessionId);
            const stakeAmount =
              typeof message.payload?.stake === 'number'
                ? message.payload.stake
                : sessionState?.stakeAmount ?? 0;

            const matchType =
              hasHumanOpponent && requestedMatchType === 'bot'
                ? 'ranked'
                : sessionState?.matchType && sessionState.matchType !== 'bot'
                  ? sessionState.matchType
                  : requestedMatchType;

            sessionRef.sessionId = sessionId;

            const resolvedSessionState = sessionState ?? {
              sessionId,
              round: 1,
              scores: { p1: 0, p2: 0 },
              stakeAmount: 0,
              matchType: 'friend',
              isBotOpponent: false,
              p1Staked: false,
              p2Staked: false,
              p1Ready: false,
              p2Ready: false,
              roundResolved: false,
              reactions: {},
              history: [],
            };

            resolvedSessionState.sessionId = sessionId;
            resolvedSessionState.matchType = matchType;
            resolvedSessionState.stakeAmount = stakeAmount;
            const hasBotOpponent = matchType === 'bot' || resolvedSessionState.isBotOpponent === true;
            resolvedSessionState.isBotOpponent = hasBotOpponent;
            sessionStates.set(sessionId, resolvedSessionState);

            const updatedAssignments = assignments ?? {};
            const resolvedUserId = sessionRef.userId ?? `guest-${sessionId}`;
            let slot: 'p1' | 'p2' = 'p1';

            if (!updatedAssignments.p1 || updatedAssignments.p1 === resolvedUserId) {
              updatedAssignments.p1 = resolvedUserId;
              slot = 'p1';
            } else if (!updatedAssignments.p2 || updatedAssignments.p2 === resolvedUserId) {
              updatedAssignments.p2 = resolvedUserId;
              slot = 'p2';
            }

            sessionAssignments.set(sessionId, updatedAssignments);

            if (slot === 'p1') {
              resolvedSessionState.p1Staked = true;
            } else {
              resolvedSessionState.p2Staked = true;
            }

            const sockets = sessionSockets.get(sessionId) ?? new Set<WebSocket>();
            sockets.add(socket);
            sessionSockets.set(sessionId, sockets);

            const bothStaked = hasBotOpponent
              ? resolvedSessionState.p1Staked
              : resolvedSessionState.p1Staked && resolvedSessionState.p2Staked;

            if (bothStaked) {
              void persistSessionState(resolvedSessionState);
              for (const sessionSocket of sockets) {
                sendMessage(sessionSocket, 'game:enter_arena', { sessionId });
              }
            }
            break;
          }
          case 'game:player_ready': {
            const targetSessionId =
              typeof message.payload?.sessionId === 'string' ? message.payload.sessionId : sessionRef.sessionId;

            if (!targetSessionId) return;

            const sessionState = sessionStates.get(targetSessionId);

            if (!sessionState) {
              logger.error({ targetSessionId }, 'Session not found in memory');
              return;
            }

            const assignments = sessionAssignments.get(targetSessionId);
            const userId = sessionRef.userId;

            logger.info({ userId, matchType: sessionState.matchType }, 'PROCESSING PLAYER READY');

            let isP1 = false;

            if (isBotOpponent(sessionState)) {
              isP1 = true;
            } else if (assignments?.p1 === userId) {
              isP1 = true;
            } else if (!sessionState.p1Ready && assignments?.p1 && assignments.p1.startsWith('guest')) {
              isP1 = true;
            }

            if (isP1) {
              sessionState.p1Ready = true;
            } else {
              sessionState.p2Ready = true;
            }

            if (isBotOpponent(sessionState)) {
              sessionState.p2Ready = true;
            }

            if (sessionState.p1Ready && sessionState.p2Ready) {
              logger.info('>>> PLAYERS READY - STARTING COUNTDOWN <<<');
              startRoundSequence(sessionState);
            }

            void persistSessionState(sessionState);
            break;
          }
          default:
            logger.warn({ type: message.type }, 'Unhandled WS message type');
        }
      } catch (err) {
        logger.error({ err, raw }, 'WS message parse error');
      }
    });

    socket.on('close', () => {
      const sessionRef = sessions.get(socket);
      if (sessionRef) {
        if (sessionRef.userId) {
          activeUsers.delete(sessionRef.userId);
        }
        const sessionState = sessionStates.get(sessionRef.sessionId);
        const sockets = sessionSockets.get(sessionRef.sessionId);
        sockets?.delete(socket);

        if (
          sessionState &&
          (sessionState.matchType === 'ranked' || sessionState.matchType === 'bot') &&
          !sessionState.isFinished
        ) {
          logger.info(
            { sessionId: sessionRef.sessionId },
            'Client disconnected - Holding session for reconnect',
          );
          return;
        }

        if (sessionState?.isFinished) {
          return;
        }
        if (sessionState) {
          clearTimers(sessionState);
        }
        sessions.delete(socket);
        if (sessionState) {
          const isPaidMatch =
            typeof sessionState.stakeAmount === 'number' &&
            Number.isFinite(sessionState.stakeAmount) &&
            sessionState.stakeAmount > 0;
          if (isPaidMatch) {
            void finalizeGame(sessionState, true);
          } else {
            if (sessionState.matchType !== 'bot') {
              void redisClient.del(getSessionKey(sessionState.sessionId));
            }
          }
        }
      }
      logger.info('WS client disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ err }, 'WS error');
    });
  });

  return wss;
}
