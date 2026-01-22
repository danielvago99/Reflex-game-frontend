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
}

interface SessionState extends RoundTimers {
  round: number;
  scores: { player: number; bot: number };
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
  history: Array<{
    round: number;
    playerTime: number;
    botTime: number;
    winner: 'player' | 'bot' | 'none';
    target: Target;
  }>;
  userId?: string;
  username?: string;
  sessionId: string;
}

interface RedisSessionState {
  round: number;
  scores: { player: number; bot: number };
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
  history: Array<{
    round: number;
    playerTime: number;
    botTime: number;
    winner: 'player' | 'bot' | 'none';
    target: Target;
  }>;
  userId?: string;
  username?: string;
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

const clearTimers = (state: SessionState) => {
  if (state.showTimeout) {
    clearTimeout(state.showTimeout);
    state.showTimeout = undefined;
  }

  if (state.botTimeout) {
    clearTimeout(state.botTimeout);
    state.botTimeout = undefined;
  }
};

const sessionAssignments = new Map<string, { p1?: string; p2?: string }>();
const sessionStates = new Map<string, SessionState>();

const handleMatchReset = async (state: SessionState, payload: any) => {
  clearTimers(state);

  state.round = 1;
  state.scores = { player: 0, bot: 0 };
  state.p1Staked = false;
  state.p2Staked = false;
  state.p1Ready = false;
  state.p2Ready = false;
  state.history = [];
  state.roundResolved = false;
  state.target = undefined;
  state.targetShownAt = undefined;
  state.botReactionTime = undefined;

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

  if (!sharedState.userId) {
    logger.info(
      { userId: sharedState.userId, matchType: sharedState.matchType },
      'Skipping match persistence because user is unauthenticated'
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
    const playerWon = !forfeit && sharedState.scores.player > sharedState.scores.bot;
    const stakeAmount =
      typeof sharedState.stakeAmount === 'number' && Number.isFinite(sharedState.stakeAmount)
        ? sharedState.stakeAmount
        : 0;
    const persistedMatchType: 'friend' | 'ranked' = sharedState.matchType === 'ranked' ? 'ranked' : 'friend';
    const winnerScore = playerWon ? sharedState.scores.player : sharedState.scores.bot;
    const loserScore = playerWon ? sharedState.scores.bot : sharedState.scores.player;

    const playerTimes = sharedState.history
      .map((round) => round.playerTime)
      .filter((time) => Number.isFinite(time) && time < 999_000);

    const botTimes = sharedState.history
      .map((round) => round.botTime)
      .filter((time) => Number.isFinite(time) && time < 999_000);

    const matchBestReaction = playerTimes.length ? Math.min(...playerTimes) : undefined;
    const matchAverageReaction = playerTimes.length
      ? playerTimes.reduce((sum, time) => sum + time, 0) / playerTimes.length
      : undefined;

    const winnerId = playerWon ? sharedState.userId : null;
    const loserId = playerWon ? null : sharedState.userId;

    const avgWinnerReaction = playerWon
      ? playerTimes.length > 0
        ? playerTimes.reduce((sum, time) => sum + time, 0) / playerTimes.length
        : undefined
      : botTimes.length > 0
        ? botTimes.reduce((sum, time) => sum + time, 0) / botTimes.length
        : undefined;

    const avgLoserReaction = playerWon
      ? botTimes.length > 0
        ? botTimes.reduce((sum, time) => sum + time, 0) / botTimes.length
        : undefined
      : playerTimes.length > 0
        ? playerTimes.reduce((sum, time) => sum + time, 0) / playerTimes.length
        : undefined;

    await prisma.$transaction(async (tx) => {
      const updatePlayerStats = async (userId: string, outcome: 'win' | 'loss') => {
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
          matchBestReaction !== undefined
            ? previousBest !== undefined
              ? Math.min(Number(previousBest), matchBestReaction)
              : matchBestReaction
            : previousBest !== undefined
              ? Number(previousBest)
              : undefined;

        const newAverageReaction =
          matchAverageReaction !== undefined
            ? previousAverage !== undefined
              ? (Number(previousAverage) * previousMatches + matchAverageReaction) / newTotalMatches
              : matchAverageReaction
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
          stakeWinner: playerWon ? stakeAmount : 0,
          stakeLoser: playerWon ? 0 : stakeAmount,
          payout: playerWon ? stakeAmount : 0,
          winnerScore,
          loserScore,
          snapshotDate: new Date(),
        },
      });

      for (const round of sharedState.history) {
        const roundWinnerId = round.winner === 'player' ? sharedState.userId : null;
        const roundLoserId = round.winner === 'player' ? null : (round.winner === 'bot' ? sharedState.userId : null);  // null pre bota

        await tx.gameRound.create({
          data: {
            gameSessionId: session.id,
            roundNumber: round.round,
            winnerId: roundWinnerId,
            loserId: roundLoserId,
            winnerReaction: round.winner === 'player' ? round.playerTime : round.winner === 'bot' ? round.botTime : null,
            loserReaction: round.winner === 'player' ? round.botTime : round.winner === 'bot' ? round.playerTime : null,
          },
        });
      }

      if (winnerId) {
        await updatePlayerStats(winnerId, 'win');
      }

      if (loserId) {
        await updatePlayerStats(loserId, 'loss');
      }

      if (sharedState.userId) {
        const referral = await tx.referral.findFirst({
          where: { referredId: sharedState.userId },
          select: { status: true, ambassadorId: true },
        });

        if (referral) {
          const updatedReferral = await tx.referral.update({
            where: { referredId: sharedState.userId },
            data: { totalMatches: { increment: 1 } },
            select: { totalMatches: true },
          });

          if (referral.status === 'pending' && updatedReferral.totalMatches >= 10) {
            await tx.referral.update({
              where: { referredId: sharedState.userId },
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
          where: { userId_date: { userId: sharedState.userId, date: today } },
          update: { matchesPlayed: { increment: 1 } },
          create: { userId: sharedState.userId, date: today, matchesPlayed: 1 },
        });

        if (!daily.completed && daily.matchesPlayed === 5) {
          await tx.dailyChallengeProgress.update({
            where: { userId_date: { userId: sharedState.userId, date: today } },
            data: { completed: true },
          });

          await tx.playerRewards.update({
            where: { userId: sharedState.userId },
            data: { reflexPoints: { increment: 10 } },
          });

          const streakRecord = await tx.weeklyStreak.findUnique({
            where: { userId: sharedState.userId },
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
              where: { userId: sharedState.userId },
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
                userId: sharedState.userId,
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
                userId: sharedState.userId,
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
  socket: WebSocket,
  state: SessionState,
  options: {
    playerTime?: number;
    reason?: 'early-click' | 'no-reaction' | 'slower';
  }
): Promise<boolean> => {
  if (state.roundResolved) return false;

  state.roundResolved = true;
  clearTimers(state);

  const rawBotTime = state.botReactionTime ?? 999_999;
  const botTime = rawBotTime;
  const playerTime = options.playerTime ?? 999_999;

  const roundedBotTime = Math.round(botTime);
  const roundedPlayerTime = Math.round(playerTime);

  let winner: 'player' | 'bot' | 'none' = 'none';
  if (playerTime < botTime) {
    winner = 'player';
    state.scores.player += 1;
  } else if (playerTime > botTime || options.reason === 'early-click') {
    winner = 'bot';
    state.scores.bot += 1;
  }

  state.history.push({
    round: state.round,
    playerTime: roundedPlayerTime,
    botTime: roundedBotTime,
    winner,
    target: state.target ?? DEFAULT_TARGET,
  });

  setTimeout(() => {
    sendMessage(socket, 'round:result', {
      round: state.round,
      playerTime: roundedPlayerTime,
      botTime: roundedBotTime,
      winner,
      reason: options.reason ?? (winner === 'bot' ? 'slower' : undefined),
      scores: state.scores,
      rawBotTime,
    });
  }, 1000);

  const isMatchOver =
    state.scores.player >= ROUNDS_TO_WIN ||
    state.scores.bot >= ROUNDS_TO_WIN ||
    state.round >= MAX_ROUNDS;

  if (isMatchOver) {
    return true;
  }

  await persistSessionState(state);
  return false;
};

const scheduleTargetShow = (socket: WebSocket, state: SessionState) => {
  const delay = 3000 + Math.random() * 5000;

  state.showTimeout = setTimeout(() => {
    state.targetShownAt = Date.now();
    state.botReactionTime = BOT_REACTION_MIN + Math.random() * BOT_REACTION_RANGE;
    void persistSessionState(state);

    sendMessage(socket, 'round:show_target', {
      round: state.round,
      timestampStart: state.targetShownAt,
    });

    if (state.isBotOpponent) {
      state.botTimeout = setTimeout(() => {
        void (async () => {
          const matchOver = await finalizeRound(socket, state, { reason: 'no-reaction' });
          if (matchOver) {
            await finalizeGame(state, false);
          }
        })();
      }, state.botReactionTime + BOT_GRACE_MS);
    }
  }, delay);
};

const syncSocketState = (socketState: SessionState, sharedState: SessionState) => {
  socketState.round = sharedState.round;
  socketState.scores = sharedState.scores;
  socketState.stakeAmount = sharedState.stakeAmount;
  socketState.matchType = sharedState.matchType;
  socketState.isBotOpponent = sharedState.isBotOpponent;
  socketState.roundResolved = sharedState.roundResolved;
  socketState.target = sharedState.target;
  socketState.targetShownAt = sharedState.targetShownAt;
  socketState.botReactionTime = sharedState.botReactionTime;
  socketState.history = sharedState.history;
  socketState.showTimeout = sharedState.showTimeout;
  socketState.botTimeout = sharedState.botTimeout;
  socketState.isFinished = sharedState.isFinished;
  socketState.p1Staked = sharedState.p1Staked;
  socketState.p2Staked = sharedState.p2Staked;
  socketState.p1Ready = sharedState.p1Ready;
  socketState.p2Ready = sharedState.p2Ready;
};

const handleRoundReady = async (socket: WebSocket, state: SessionState, payload: any) => {
  const sessionId = state.sessionId;
  const sessionState = sessionStates.get(sessionId) ?? { ...state };
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, sessionState);
  }

  sessionState.round = typeof payload?.round === 'number' ? payload.round : sessionState.round;
  sessionState.stakeAmount = typeof payload?.stake === 'number' ? payload.stake : sessionState.stakeAmount;
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
  sessionState.roundResolved = false;
  sessionState.targetShownAt = undefined;
  sessionState.botReactionTime = undefined;
  clearTimers(sessionState);

  const nextTarget = pickTarget() ?? DEFAULT_TARGET;
  sessionState.target = nextTarget;

  sendMessage(socket, 'round:prepare', {
    round: sessionState.round,
    target: nextTarget,
    instruction: createInstruction(nextTarget),
    username: state.username,
  });

  await persistSessionState(sessionState);
  scheduleTargetShow(socket, sessionState);
  syncSocketState(state, sessionState);
};

const handlePlayerClick = async (socket: WebSocket, state: SessionState, payload: any) => {
  const sessionId = state.sessionId;
  const sessionState = sessionStates.get(sessionId) ?? { ...state };
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, sessionState);
  }

  if (sessionState.roundResolved) return;

  const now = Date.now();
  const clientClaimedDuration =
    typeof payload?.clientDuration === 'number' && Number.isFinite(payload.clientDuration)
      ? payload.clientDuration
      : undefined;

  if (!sessionState.targetShownAt) {
    const matchOver = await finalizeRound(socket, sessionState, { playerTime: 999_999, reason: 'early-click' });
    if (matchOver) {
      await finalizeGame(sessionState, false);
    }
    syncSocketState(state, sessionState);
    return;
  }

  const serverMeasuredTotal = now - sessionState.targetShownAt;
  const claimedDuration = clientClaimedDuration ?? serverMeasuredTotal;

  let validatedTime = Math.max(claimedDuration, 100);
  validatedTime = Math.min(validatedTime, serverMeasuredTotal);
  validatedTime = Math.max(validatedTime, serverMeasuredTotal - 1000);

  const playerTime = validatedTime;

  if (sessionState.botTimeout && playerTime < (sessionState.botReactionTime ?? Infinity) + BOT_GRACE_MS) {
    clearTimeout(sessionState.botTimeout);
    sessionState.botTimeout = undefined;
  }

  const matchOver = await finalizeRound(socket, sessionState, { playerTime });
  if (matchOver) {
    await finalizeGame(sessionState, false);
  }
  syncSocketState(state, sessionState);
};

export function createWsServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  const sessions = new WeakMap<WebSocket, SessionState>();
  const activeUsers = new Map<string, WebSocket>();
  const sessionSockets = new Map<string, Set<WebSocket>>();

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

    const sessionId = crypto.randomUUID();
    const s1Data = socket1 ? sessions.get(socket1) : undefined;
    const s2Data = socket2 ? sessions.get(socket2) : undefined;
    const name1 = s1Data?.username ?? 'Player 1';
    const name2 = s2Data?.username ?? 'Player 2';
    const baseState: SessionState = {
      sessionId,
      round: 1,
      scores: { player: 0, bot: 0 },
      matchType: 'ranked',
      isBotOpponent: false,
      stakeAmount: stake,
      roundResolved: false,
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

    if (socket1) {
      sessions.set(socket1, { ...baseState, userId: player1Id, username: name1 });
      sockets?.add(socket1);
      sendMessage(socket1, 'match_found', {
        sessionId,
        opponentId: player2Id,
        opponentName: name2,
        stake,
        isBot: false,
      });
    }

    if (socket2) {
      sessions.set(socket2, { ...baseState, userId: player2Id, username: name2 });
      sockets?.add(socket2);
      sendMessage(socket2, 'match_found', {
        sessionId,
        opponentId: player1Id,
        opponentName: name1,
        stake,
        isBot: false,
      });
    }
  });

  matchmakingEvents.on('bot_match', (data) => {
    const { userId, stake } = data as { userId: string; stake: number };
    const socket = activeUsers.get(userId);

    const sessionId = crypto.randomUUID();
    const existingState = socket ? sessions.get(socket) : undefined;
    const sessionState: SessionState = {
      sessionId,
      round: 1,
      scores: { player: 0, bot: 0 },
      matchType: 'ranked',
      isBotOpponent: true,
      stakeAmount: stake,
      roundResolved: false,
      history: [],
      userId,
      username: existingState?.username,
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
      sessions.set(socket, sessionState);
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
    }

    let sessionState: SessionState | undefined;
    if (userId) {
      const activeSessionId = userActiveSessions.get(userId);
      if (activeSessionId) {
        const existingState = sessionStates.get(activeSessionId);
        if (existingState && !existingState.isFinished) {
          const restoredState = { ...existingState, userId, username };
          sessions.set(socket, restoredState);
          sessionState = restoredState;

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
        scores: { player: 0, bot: 0 },
        stakeAmount: 0,
        matchType: 'friend',
        isBotOpponent: false,
        p1Staked: false,
        p2Staked: false,
        p1Ready: false,
        p2Ready: false,
        roundResolved: false,
        history: [],
        userId,
        username,
        sessionId,
      };

      sessions.set(socket, sessionState);
      sessionStates.set(sessionId, sessionState);
    }

    socket.on('message', (data) => {
      const raw = data.toString();
      const state = sessions.get(socket);
      if (!state) return;

      try {
        const message = JSON.parse(raw);
        logger.debug({ message }, 'WS message');

        switch (message.type) {
          case 'round:ready':
            void handleRoundReady(socket, state, message.payload);
            break;
          case 'player:click':
            void handlePlayerClick(socket, state, message.payload);
            break;
          case 'match:reset':
            void handleMatchReset(state, message.payload);
            break;
          case 'match:find':
            const { userId } = state;
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
                  sessions.set(socket, existingState);
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
            const stakeAmount =
              typeof message.payload?.stake === 'number' ? message.payload.stake : state.stakeAmount ?? 0;

            const matchType =
              hasHumanOpponent && requestedMatchType === 'bot'
                ? 'ranked'
                : state.matchType && state.matchType !== 'bot'
                  ? state.matchType
                  : requestedMatchType;

            state.sessionId = sessionId;
            state.matchType = matchType;
            state.stakeAmount = stakeAmount;

            const sessionState = sessionStates.get(sessionId) ?? {
              ...state,
              showTimeout: undefined,
              botTimeout: undefined,
              p1Staked: false,
              p2Staked: false,
              p1Ready: false,
              p2Ready: false,
            };

            sessionState.sessionId = sessionId;
            sessionState.matchType = matchType;
            sessionState.stakeAmount = stakeAmount;
            const hasBotOpponent = matchType === 'bot' || sessionState.isBotOpponent === true;
            sessionState.isBotOpponent = hasBotOpponent;
            state.isBotOpponent = hasBotOpponent;
            sessionStates.set(sessionId, sessionState);

            const updatedAssignments = assignments ?? {};
            const resolvedUserId = state.userId ?? `guest-${sessionId}`;
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
              sessionState.p1Staked = true;
              state.p1Staked = true;
            } else {
              sessionState.p2Staked = true;
              state.p2Staked = true;
            }

            const sockets = sessionSockets.get(sessionId) ?? new Set<WebSocket>();
            sockets.add(socket);
            sessionSockets.set(sessionId, sockets);

            const bothStaked = hasBotOpponent
              ? sessionState.p1Staked
              : sessionState.p1Staked && sessionState.p2Staked;

            if (bothStaked) {
              void persistSessionState(sessionState);
              for (const sessionSocket of sockets) {
                sendMessage(sessionSocket, 'game:enter_arena', { sessionId });
              }
            }
            break;
          }
          case 'game:player_ready': {
            const targetSessionId =
              typeof message.payload?.sessionId === 'string' ? message.payload.sessionId : state.sessionId;

            if (!targetSessionId) return;

            const sessionState = sessionStates.get(targetSessionId);

            if (!sessionState) {
              logger.error({ targetSessionId }, 'Session not found in memory');
              return;
            }

            const assignments = sessionAssignments.get(targetSessionId);
            const userId = state.userId;

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
            syncSocketState(state, sessionState);
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
      const state = sessions.get(socket);
      if (state) {
        if (state.userId) {
          activeUsers.delete(state.userId);
        }
        const sockets = sessionSockets.get(state.sessionId);
        sockets?.delete(socket);

        if ((state.matchType === 'ranked' || state.matchType === 'bot') && !state.isFinished) {
          logger.info({ sessionId: state.sessionId }, 'Client disconnected - Holding session for reconnect');
          return;
        }

        if (state.isFinished) {
          return;
        }
        clearTimers(state);
        sessions.delete(socket);
        const isPaidMatch =
          typeof state.stakeAmount === 'number' && Number.isFinite(state.stakeAmount) && state.stakeAmount > 0;
        if (isPaidMatch) {
          void finalizeGame(state, true);
        } else {
          if (state.matchType !== 'bot') {
            void redisClient.del(getSessionKey(state.sessionId));
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
