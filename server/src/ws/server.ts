import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import prisma from '../db/prisma';
import { env } from '../config/env';
import { redisClient } from '../db/redis';

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
  matchType?: 'ranked' | 'friend';
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
  sessionId: string;
}

interface RedisSessionState {
  round: number;
  scores: { player: number; bot: number };
  stakeAmount?: number;
  matchType?: 'ranked' | 'friend';
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
}

const targets: Target[] = [
  { shape: 'circle', color: '#00FF00', colorName: 'Green' },
  { shape: 'square', color: '#FF0000', colorName: 'Red' },
  { shape: 'triangle', color: '#0000FF', colorName: 'Blue' },
  { shape: 'circle', color: '#FFFF00', colorName: 'Yellow' },
  { shape: 'square', color: '#9333EA', colorName: 'Purple' },
  { shape: 'triangle', color: '#06B6D4', colorName: 'Cyan' },
];

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
  target: state.target,
  targetShownAt: state.targetShownAt,
  botReactionTime: state.botReactionTime,
  roundResolved: state.roundResolved,
  history: state.history,
  userId: state.userId,
});

const persistSessionState = async (state: SessionState) => {
  const key = getSessionKey(state.sessionId);
  const payload = serializeSessionState(state);
  await redisClient.set(key, JSON.stringify(payload), { ex: GAME_STATE_TTL_SECONDS });
};

const createInstruction = (target: Target) => {
  const shapeName = target.shape === 'circle' ? 'Kruh' : target.shape === 'square' ? 'Štvorec' : 'Trojuholník';
  return `Hľadaj ${target.colorName} ${shapeName}`;
};

const pickTarget = (): Target => targets[Math.floor(Math.random() * targets.length)];

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

const handleMatchReset = async (state: SessionState, payload: any) => {
  clearTimers(state);

  state.round = 1;
  state.scores = { player: 0, bot: 0 };
  state.history = [];
  state.roundResolved = false;
  state.target = undefined;
  state.targetShownAt = undefined;
  state.botReactionTime = undefined;

  state.stakeAmount = typeof payload?.stake === 'number' ? payload.stake : state.stakeAmount;
  state.matchType = payload?.matchType === 'ranked' || payload?.matchType === 'friend' ? payload.matchType : 'friend';

  await persistSessionState(state);
};

const finalizeRound = async (
  socket: WebSocket,
  state: SessionState,
  options: {
    playerTime?: number;
    reason?: 'early-click' | 'no-reaction' | 'slower';
  }
) => {
  if (state.roundResolved) return;

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
    target: state.target ?? targets[0],
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
    logger.info({ scores: state.scores, history: state.history }, 'Match completed. Persist final result with Prisma.');

    if (state.userId) {
      try {
        const playerWon = state.scores.player > state.scores.bot;
        const validPlayerTimes = state.history
          .map((round) => round.playerTime)
          .filter((time) => Number.isFinite(time) && time < 999_000);

        const matchBestReaction = validPlayerTimes.length ? Math.min(...validPlayerTimes) : undefined;
        const matchAverageReaction = validPlayerTimes.length
          ? validPlayerTimes.reduce((sum, time) => sum + time, 0) / validPlayerTimes.length
          : undefined;

        const stakeAmount = typeof state.stakeAmount === 'number' && Number.isFinite(state.stakeAmount)
          ? state.stakeAmount
          : 0;

        await prisma.$transaction(async (tx) => {
          const existingStats = await tx.playerStats.findUnique({ where: { userId: state.userId! } });

          const previousMatches = existingStats?.totalMatches ?? 0;
          const previousWins = existingStats?.totalWins ?? 0;
          const previousLosses = existingStats?.totalLosses ?? 0;
          const previousAverage = existingStats?.avgReaction ?? undefined;
          const previousBest = existingStats?.bestReaction ?? undefined;

          const newTotalMatches = previousMatches + 1;
          const newTotalWins = previousWins + (playerWon ? 1 : 0);
          const newTotalLosses = previousLosses + (playerWon ? 0 : 1);
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
                userId: state.userId!,
                totalMatches: newTotalMatches,
                totalWins: newTotalWins,
                totalLosses: newTotalLosses,
                winRate: newWinRate,
                bestReaction: newBestReaction ?? 9999,
                avgReaction: newAverageReaction ?? 0,
                totalVolumeSolPlayed: stakeAmount,
                totalSolWon: playerWon ? stakeAmount : 0,
                totalSolLost: playerWon ? 0 : stakeAmount,
              },
            });
          } else {
            await tx.playerStats.update({
              where: { userId: state.userId! },
              data: {
                totalMatches: { increment: 1 },
                totalWins: playerWon ? { increment: 1 } : undefined,
                totalLosses: playerWon ? undefined : { increment: 1 },
                winRate: newWinRate,
                bestReaction: newBestReaction ?? undefined,
                avgReaction: newAverageReaction ?? undefined,
                totalVolumeSolPlayed: stakeAmount ? { increment: stakeAmount } : undefined,
                totalSolWon: playerWon && stakeAmount ? { increment: stakeAmount } : undefined,
                totalSolLost: !playerWon && stakeAmount ? { increment: stakeAmount } : undefined,
              },
            });
          }

          const winnerId = playerWon ? state.userId! : null;
          const loserId = playerWon ? null : state.userId!;

          const winningTimes = state.history
            .filter((round) => (playerWon ? round.winner === 'player' : round.winner === 'bot'))
            .map((round) => (playerWon ? round.playerTime : round.botTime))
            .filter((time) => Number.isFinite(time));

          const losingTimes = state.history
            .filter((round) => (playerWon ? round.winner === 'bot' : round.winner === 'player'))
            .map((round) => (playerWon ? round.botTime : round.playerTime))
            .filter((time) => Number.isFinite(time));

          const avgWinnerReaction =
            winningTimes.length > 0
              ? winningTimes.reduce((sum, time) => sum + time, 0) / winningTimes.length
              : undefined;

          const avgLoserReaction =
            losingTimes.length > 0 ? losingTimes.reduce((sum, time) => sum + time, 0) / losingTimes.length : undefined;

          const session = await tx.gameSession.create({
            data: {
              status: 'completed',
              matchType: state.matchType ?? 'friend',
              winnerId,
              loserId,
              avgWinnerReaction,
              avgLoserReaction,
              stakeWinner: playerWon ? stakeAmount : 0,
              stakeLoser: playerWon ? 0 : stakeAmount,
              payout: playerWon ? stakeAmount : 0,
              finishedAt: new Date(),
            },
          });

          for (const round of state.history) {
            const roundWinnerId = round.winner === 'player' ? state.userId! : null;
            const roundResult = round.winner === 'player' ? 'win' : round.winner === 'bot' ? 'lose' : 'draw';

            await tx.gameRound.create({
              data: {
                gameSessionId: session.id,
                roundNumber: round.round,
                winnerId: roundWinnerId,
                winnerReaction: round.winner === 'player' ? round.playerTime : round.winner === 'bot' ? round.botTime : null,
                loserReaction: round.winner === 'player' ? round.botTime : round.winner === 'bot' ? round.playerTime : null,
                result: roundResult,
              },
            });
          }

          if (stakeAmount > 0) {
            await tx.transaction.create({
              data: {
                userId: state.userId!,
                gameSessionId: session.id,
                amount: stakeAmount,
                type: 'game_stake',
                status: 'confirmed',
              },
            });

            if (playerWon) {
              await tx.transaction.create({
                data: {
                  userId: state.userId!,
                  gameSessionId: session.id,
                  amount: stakeAmount,
                  type: 'game_payout',
                  status: 'confirmed',
                },
              });
            }
          }
        });
      } catch (error) {
        logger.error({ error }, 'Failed to persist match results');
      }
    } else {
      logger.info({ userId: state.userId, matchType: state.matchType }, 'Skipping match persistence because user is unauthenticated');
    }

    try {
      await redisClient.del(getSessionKey(state.sessionId));
    } catch (error) {
      logger.warn({ error, sessionId: state.sessionId }, 'Failed to cleanup Redis session state');
    }

    return;
  }

  await persistSessionState(state);
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

    state.botTimeout = setTimeout(() => {
      void finalizeRound(socket, state, { reason: 'no-reaction' });
    }, state.botReactionTime + BOT_GRACE_MS);
  }, delay);
};

const handleRoundReady = async (socket: WebSocket, state: SessionState, payload: any) => {
  state.round = typeof payload?.round === 'number' ? payload.round : state.round;
  state.stakeAmount = typeof payload?.stake === 'number' ? payload.stake : state.stakeAmount;
  state.matchType = payload?.matchType === 'ranked' || payload?.matchType === 'friend' ? payload.matchType : 'friend';
  state.roundResolved = false;
  state.targetShownAt = undefined;
  state.botReactionTime = undefined;
  clearTimers(state);

  state.target = pickTarget();

  sendMessage(socket, 'round:prepare', {
    round: state.round,
    target: state.target,
    instruction: createInstruction(state.target),
  });

  await persistSessionState(state);
  scheduleTargetShow(socket, state);
};

const handlePlayerClick = async (socket: WebSocket, state: SessionState, payload: any) => {
  if (state.roundResolved) return;

  const now = Date.now();
  const clientClaimedDuration =
    typeof payload?.clientDuration === 'number' && Number.isFinite(payload.clientDuration)
      ? payload.clientDuration
      : undefined;

  if (!state.targetShownAt) {
    void finalizeRound(socket, state, { playerTime: 999_999, reason: 'early-click' });
    return;
  }

  const serverMeasuredTotal = now - state.targetShownAt;
  const claimedDuration = clientClaimedDuration ?? serverMeasuredTotal;

  let validatedTime = Math.max(claimedDuration, 100);
  validatedTime = Math.min(validatedTime, serverMeasuredTotal);
  validatedTime = Math.max(validatedTime, serverMeasuredTotal - 1000);

  const playerTime = validatedTime;

  if (state.botTimeout && playerTime < (state.botReactionTime ?? Infinity) + BOT_GRACE_MS) {
    clearTimeout(state.botTimeout);
    state.botTimeout = undefined;
  }

  await finalizeRound(socket, state, { playerTime });
};

export function createWsServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  const sessions = new WeakMap<WebSocket, SessionState>();

  wss.on('connection', (socket: WebSocket, request) => {
    logger.info('WS client connected');

    let userId: string | undefined;

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

    const sessionId = crypto.randomUUID();

    const sessionState: SessionState = {
      round: 1,
      scores: { player: 0, bot: 0 },
      stakeAmount: 0,
      matchType: 'friend',
      roundResolved: false,
      history: [],
      userId,
      sessionId,
    };

    sessions.set(socket, sessionState);
    void persistSessionState(sessionState);

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
        clearTimers(state);
        sessions.delete(socket);
        void redisClient.del(getSessionKey(state.sessionId));
      }
      logger.info('WS client disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ err }, 'WS error');
    });
  });

  return wss;
}
