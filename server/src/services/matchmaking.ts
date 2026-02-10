import { redisClient } from '../db/redis';
import { matchmakingEvents } from '../utils/events';
import { logger } from '../utils/logger';

const MATCH_CHECK_INTERVAL = 4000;
const MAX_WAIT_TIME_MS = 9000;
const REACTION_TOLERANCE_MS = 5000;

interface RankedPlayer {
  member: string;
  score: number;
}

const parseRankedPlayers = (raw: unknown): RankedPlayer[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const first = raw[0];
  if (typeof first === 'object' && first !== null && 'member' in first) {
    return (raw as RankedPlayer[]).filter(
      (entry) => typeof entry.member === 'string' && Number.isFinite(entry.score)
    );
  }

  const parsed: RankedPlayer[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    const member = raw[i];
    const score = raw[i + 1];
    if (typeof member === 'string' && (typeof score === 'number' || typeof score === 'string')) {
      const numericScore = Number(score);
      if (Number.isFinite(numericScore)) {
        parsed.push({ member, score: numericScore });
      }
    }
  }

  return parsed;
};

export class MatchmakingService {
  private intervals: Map<number, NodeJS.Timeout> = new Map();

  constructor() {
    logger.info('Matchmaking Service Started (Lazy Mode)');
  }

  async addToQueue(userId: string, stake: number, avgReaction: number) {
    const queueKey = `matchmaking:queue:${stake}`;
    const timerKey = `matchmaking:timers:${stake}`;
    const now = Date.now();

    await redisClient.zadd(queueKey, { score: avgReaction, member: userId });
    await redisClient.zadd(timerKey, { score: now, member: userId });

    logger.info({ userId, stake, avgReaction }, 'Player added to matchmaking queue');

    this.startQueueProcessing(stake);
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
        const hasPlayers = await this.processQueue(stake);

        if (!hasPlayers) {
          logger.info(`Queue empty for ${stake} SOL - Stopping processor`);
          clearInterval(this.intervals.get(stake));
          this.intervals.delete(stake);
        }
      } catch (error) {
        logger.error({ error, stake }, 'Matchmaking queue processing failed');
      }
    }, MATCH_CHECK_INTERVAL);

    this.intervals.set(stake, interval);
  }

  private async processQueue(stake: number): Promise<boolean> {
    const queueKey = `matchmaking:queue:${stake}`;
    const timerKey = `matchmaking:timers:${stake}`;

    const now = Date.now();
    const timeoutThreshold = now - MAX_WAIT_TIME_MS;

    const expiredRaw = await redisClient.zrange(timerKey, 0, -1, { withScores: true });
    const expiredPlayers = parseRankedPlayers(expiredRaw);
    const timedOutUsers = expiredPlayers.filter((player) => player.score < timeoutThreshold).map((player) => player.member);

    if (timedOutUsers.length > 0) {
      for (const userId of timedOutUsers) {
        await this.removeFromQueue(userId, stake);
        matchmakingEvents.emit('bot_match', { userId, stake });
        logger.info({ userId }, 'Triggered BOT match due to timeout');
      }
    }

    const playersRaw = await redisClient.zrange(queueKey, 0, 20, { withScores: true });
    const entries = parseRankedPlayers(playersRaw);

    if (entries.length < 2) {
      const count = await redisClient.zcard(queueKey);
      return count > 0;
    }

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

    const count = await redisClient.zcard(queueKey);
    return count > 0;
  }

  private async createHumanMatch(player1Id: string, player2Id: string, stake: number) {
    logger.info({ player1Id, player2Id, stake }, 'Human Match Found - Emitting Event');

    matchmakingEvents.emit('match_found', {
      player1Id,
      player2Id,
      stake,
    });
  }
}

export const matchmakingService = new MatchmakingService();
