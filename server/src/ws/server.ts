import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import prisma from '../db/prisma';
import { env } from '../config/env';

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

const handleMatchReset = (state: SessionState, payload: any) => {
  clearTimers(state);

  state.round = 1;
  state.scores = { player: 0, bot: 0 };
  state.history = [];
  state.roundResolved = false;
  state.target = undefined;
  state.targetShownAt = undefined;
  state.botReactionTime = undefined;

  state.stakeAmount = typeof payload?.stake === 'number' ? payload.stake : state.stakeAmount;
  state.matchType = payload?.matchType === 'ranked' || payload?.matchType === 'friend' ? payload.matchType : 'bot';
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

    if (state.userId && state.matchType === 'ranked') {
      try {
        const playerWon = state.scores.player > state.scores.bot;
        const pointsEarned = state.scores.player * 10;

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
          const previousAverage = existingStats?.averageReactionMs ?? undefined;
          const previousBest = existingStats?.bestReactionMs ?? undefined;
          const previousStreak = existingStats?.currentStreak ?? 0;
          const previousBestStreak = existingStats?.bestStreak ?? 0;

          const newTotalMatches = previousMatches + 1;
          const newTotalWins = previousWins + (playerWon ? 1 : 0);
          const newTotalLosses = previousLosses + (playerWon ? 0 : 1);
          const newWinRate = newTotalMatches > 0 ? newTotalWins / newTotalMatches : 0;

          const newBestReaction =
            matchBestReaction !== undefined
              ? previousBest !== undefined
                ? Math.min(previousBest, matchBestReaction)
                : matchBestReaction
              : previousBest;

          const newAverageReaction =
            matchAverageReaction !== undefined
              ? previousAverage !== undefined
                ? (previousAverage * previousMatches + matchAverageReaction) / newTotalMatches
                : matchAverageReaction
              : previousAverage;

          const newCurrentStreak = playerWon ? previousStreak + 1 : 0;
          const newBestStreak = Math.max(previousBestStreak, newCurrentStreak);

          if (!existingStats) {
            await tx.playerStats.create({
              data: {
                userId: state.userId!,
                totalMatches: newTotalMatches,
                totalWins: newTotalWins,
                totalLosses: newTotalLosses,
                winRate: newWinRate,
                bestReactionMs: newBestReaction,
                averageReactionMs: newAverageReaction,
                currentStreak: newCurrentStreak,
                bestStreak: newBestStreak,
                totalReflexPoints: pointsEarned,
                totalSolWagered: stakeAmount,
                totalSolWon: playerWon ? stakeAmount : 0,
              },
            });
          } else {
            await tx.playerStats.update({
              where: { userId: state.userId! },
              data: {
                totalMatches: { increment: 1 },
                totalWins: playerWon ? { increment: 1 } : undefined,
                totalLosses: playerWon ? undefined : { increment: 1 },
                totalReflexPoints: { increment: pointsEarned },
                winRate: newWinRate,
                bestReactionMs: newBestReaction,
                averageReactionMs: newAverageReaction,
                currentStreak: newCurrentStreak,
                bestStreak: newBestStreak,
                totalSolWagered: stakeAmount ? { increment: stakeAmount } : undefined,
                totalSolWon: playerWon && stakeAmount ? { increment: stakeAmount } : undefined,
              },
            });
          }

          const lobby = await tx.gameLobby.create({
            data: {
              creatorId: state.userId!,
              mode: 'bot',
              status: 'completed',
              bestOf: MAX_ROUNDS,
            },
          });

          const sessionStartedAt = new Date();
          const sessionEndedAt = new Date();

          const session = await tx.gameSession.create({
            data: {
              lobbyId: lobby.id,
              roundNumber: state.round,
              status: 'completed',
              startedAt: sessionStartedAt,
              endedAt: sessionEndedAt,
              winnerId: playerWon ? state.userId! : null,
            },
          });

          for (const round of state.history) {
            const match = await tx.gameMatch.create({
              data: {
                sessionId: session.id,
                mode: 'bot',
                targetShape: round.target.shape,
                targetColor: round.target.color,
                startedAt: sessionStartedAt,
                targetShownAt: sessionStartedAt,
                completedAt: sessionEndedAt,
              },
            });

            const playerEntry = await tx.gamePlayer.create({
              data: {
                matchId: match.id,
                userId: state.userId!,
                isBot: false,
                reactionMs: round.playerTime,
                result: round.winner === 'player' ? 'win' : round.winner === 'bot' ? 'lose' : undefined,
              },
            });

            const botEntry = await tx.gamePlayer.create({
              data: {
                matchId: match.id,
                isBot: true,
                reactionMs: round.botTime,
                result: round.winner === 'bot' ? 'win' : round.winner === 'player' ? 'lose' : undefined,
              },
            });

            const winningPlayerId = round.winner === 'player' ? playerEntry.id : round.winner === 'bot' ? botEntry.id : null;

            if (winningPlayerId) {
              await tx.gameMatch.update({
                where: { id: match.id },
                data: { winningPlayerId },
              });
            }

            await tx.gameResult.create({
              data: {
                matchId: match.id,
                winnerId: round.winner === 'player' ? state.userId! : null,
                loserId: round.winner === 'bot' ? state.userId! : null,
                winnerReactionMs:
                  round.winner === 'player' ? round.playerTime : round.winner === 'bot' ? round.botTime : undefined,
                loserReactionMs:
                  round.winner === 'player' ? round.botTime : round.winner === 'bot' ? round.playerTime : undefined,
              },
            });
          }
        });
      } catch (error) {
        logger.error({ error }, 'Failed to persist match results');
      }
    } else {
      logger.info({ userId: state.userId, matchType: state.matchType }, 'Skipping stats sync; not a ranked match or unauthenticated');
    }
  }
};

const scheduleTargetShow = (socket: WebSocket, state: SessionState) => {
  const delay = 3000 + Math.random() * 5000;

  state.showTimeout = setTimeout(() => {
    state.targetShownAt = Date.now();
    state.botReactionTime = BOT_REACTION_MIN + Math.random() * BOT_REACTION_RANGE;

    sendMessage(socket, 'round:show_target', {
      round: state.round,
      timestampStart: state.targetShownAt,
    });

    state.botTimeout = setTimeout(() => {
      void finalizeRound(socket, state, { reason: 'no-reaction' });
    }, state.botReactionTime + BOT_GRACE_MS);
  }, delay);
};

const handleRoundReady = (socket: WebSocket, state: SessionState, payload: any) => {
  state.round = typeof payload?.round === 'number' ? payload.round : state.round;
  state.stakeAmount = typeof payload?.stake === 'number' ? payload.stake : state.stakeAmount;
  state.matchType = payload?.matchType === 'ranked' || payload?.matchType === 'friend' ? payload.matchType : 'bot';
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

  scheduleTargetShow(socket, state);
};

const handlePlayerClick = (socket: WebSocket, state: SessionState, payload: any) => {
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

  void finalizeRound(socket, state, { playerTime });
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

    sessions.set(socket, {
      round: 1,
      scores: { player: 0, bot: 0 },
      stakeAmount: 0,
      matchType: 'bot',
      roundResolved: false,
      history: [],
      userId,
    });

    socket.on('message', (data) => {
      const raw = data.toString();
      const state = sessions.get(socket);
      if (!state) return;

      try {
        const message = JSON.parse(raw);
        logger.debug({ message }, 'WS message');

        switch (message.type) {
          case 'round:ready':
            handleRoundReady(socket, state, message.payload);
            break;
          case 'player:click':
            handlePlayerClick(socket, state, message.payload);
            break;
          case 'match:reset':
            handleMatchReset(state, message.payload);
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
      }
      logger.info('WS client disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ err }, 'WS error');
    });
  });

  return wss;
}
