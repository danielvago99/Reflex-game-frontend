import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import { logger } from '../utils/logger';

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
  target?: Target;
  targetShownAt?: number;
  botReactionTime?: number;
  roundResolved: boolean;
  history: Array<{
    round: number;
    playerTime: number;
    botTime: number;
    winner: 'player' | 'bot' | 'none';
  }>;
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

const finalizeRound = (
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
      finalizeRound(socket, state, { reason: 'no-reaction' });
    }, state.botReactionTime + BOT_GRACE_MS);
  }, delay);
};

const handleRoundReady = (socket: WebSocket, state: SessionState, payload: any) => {
  state.round = typeof payload?.round === 'number' ? payload.round : state.round;
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
  const clientTimestamp = typeof payload?.clientTimestamp === 'number' ? payload.clientTimestamp : now;

  if (!state.targetShownAt) {
    finalizeRound(socket, state, { playerTime: 999_999, reason: 'early-click' });
    return;
  }

  const ping = Math.max(now - clientTimestamp, 0);
  const adjustedReaction = Math.max(now - state.targetShownAt - Math.floor(ping / 2), 0);

  if (state.botTimeout && adjustedReaction < (state.botReactionTime ?? Infinity) + BOT_GRACE_MS) {
    clearTimeout(state.botTimeout);
    state.botTimeout = undefined;
  }

  finalizeRound(socket, state, { playerTime: adjustedReaction });
};

export function createWsServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  const sessions = new WeakMap<WebSocket, SessionState>();

  wss.on('connection', (socket: WebSocket) => {
    logger.info('WS client connected');

    sessions.set(socket, {
      round: 1,
      scores: { player: 0, bot: 0 },
      roundResolved: false,
      history: [],
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
