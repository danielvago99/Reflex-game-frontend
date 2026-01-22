import { redisClient } from '../db/redis';
import { matchmakingEvents } from '../utils/events';
import { logger } from '../utils/logger';

const MATCH_CHECK_INTERVAL = 2000;
const MAX_WAIT_TIME_MS = 15000;
const REACTION_TOLERANCE_MS = 150;

export class MatchmakingService {
  private intervals: Map<number, NodeJS.Timeout> = new Map();

  constructor() {
    this.startQueueProcessing(0.1);
    this.startQueueProcessing(0.2);
    this.startQueueProcessing(0.5);
  }

  async addToQueue(userId: string, stake: number, avgReaction: number) {
    const queueKey = `matchmaking:queue:${stake}`;
    const timerKey = `matchmaking:timers:${stake}`;
    const now = Date.now();

    await redisClient.zadd(queueKey, { score: avgReaction, member: userId });
    await redisClient.zadd(timerKey, { score: now, member: userId });

    logger.info({ userId, stake, avgReaction }, 'Player added to matchmaking queue');
  }

  async removeFromQueue(userId: string, stake: number) {
    const queueKey = `matchmaking:queue:${stake}`;
    const timerKey = `matchmaking:timers:${stake}`;

    await redisClient.zrem(queueKey, userId);
    await redisClient.zrem(timerKey, userId);

    logger.info({ userId, stake }, 'Player removed from matchmaking queue');
  }

  private startQueueProcessing(stake: number) {
    if (this.intervals.has(stake)) return;

    logger.info(`Starting matchmaking processor for stake: ${stake} SOL`);
    const interval = setInterval(async () => {
      try {
        await this.processQueue(stake);
      } catch (error) {
        logger.error({ error, stake }, 'Matchmaking queue processing failed');
      }
    }, MATCH_CHECK_INTERVAL);

    this.intervals.set(stake, interval);
  }

  private async processQueue(stake: number) {
    const queueKey = `matchmaking:queue:${stake}`;
    const timerKey = `matchmaking:timers:${stake}`;

    const now = Date.now();
    const timeoutThreshold = now - MAX_WAIT_TIME_MS;

    const expiredPlayers = await redisClient.zrange<{ member: string; score: number }[]>(
      timerKey,
      0,
      timeoutThreshold,
      { byScore: true }
    );

    if (expiredPlayers.length > 0) {
      for (const { member } of expiredPlayers) {
        const userId = member;
        await this.removeFromQueue(userId, stake);
        await this.createBotMatch(userId, stake);
      }
    }

    const players = await redisClient.zrange<{ member: string; score: number }[]>(
      queueKey,
      0,
      20,
      { withScores: true }
    );

    if (players.length < 2) return;

    const entries = players.filter(
      (player): player is { member: string; score: number } =>
        typeof player?.member === 'string' && Number.isFinite(player.score)
    );

    if (entries.length < 2) return;

    const matchedUsers = new Set<string>();

    for (let i = 0; i < entries.length; i += 1) {
      const p1 = entries[i];
      const p1Id = p1.member;
      const p1Reaction = p1.score;

      if (!p1Id || Number.isNaN(p1Reaction) || matchedUsers.has(p1Id)) continue;

      for (let j = i + 1; j < entries.length; j += 1) {
        const p2 = entries[j];
        const p2Id = p2.member;
        const p2Reaction = p2.score;

        if (!p2Id || p2Id === p1Id || Number.isNaN(p2Reaction) || matchedUsers.has(p2Id)) continue;

        const diff = Math.abs(p1Reaction - p2Reaction);

        if (diff <= REACTION_TOLERANCE_MS) {
          await this.createHumanMatch(p1Id, p2Id, stake);

          matchedUsers.add(p1Id);
          matchedUsers.add(p2Id);

          await this.removeFromQueue(p1Id, stake);
          await this.removeFromQueue(p2Id, stake);
          break;
        }
      }
    }
  }

  private async createHumanMatch(player1Id: string, player2Id: string, stake: number) {
    logger.info({ player1Id, player2Id, stake }, 'Human Match Found');
    const matchId = `${player1Id}-${player2Id}-${Date.now()}`;

    matchmakingEvents.emit('match_found', {
      type: 'human',
      matchId,
      player1Id,
      player2Id,
      stake,
    });
  }

  private async createBotMatch(userId: string, stake: number) {
    logger.info({ userId, stake }, 'Timeout reached. Creating Bot Match.');

    matchmakingEvents.emit('bot_match', {
      userId,
      stake,
      difficulty: 'adaptive',
    });
  }
}

export const matchmakingService = new MatchmakingService();
