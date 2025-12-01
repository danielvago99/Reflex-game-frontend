import { Redis } from '@upstash/redis';
import { env } from '../config/env';

// Single Upstash Redis klient – používa REST URL + TOKEN
export const redisQueueClient = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Lightweight "queue" for match settlement.
 * V skutočnosti je to len zápis do Redis key – úplne stačí pre tvoje použitie.
 */

const MATCH_QUEUE_PREFIX = 'queue:match-settlement';

/**
 * Enqueue match settlement job (napr. keď je match ukončený
 * a potrebuješ spraviť on-chain settlement alebo update štatistík).
 */
export async function enqueueMatchSettlement(matchId: string, payload: unknown) {
  const key = `${MATCH_QUEUE_PREFIX}:${matchId}`;

  // Uložíme JSON payload – môžeš si do toho dať čokoľvek
  await redisQueueClient.set(key, {
    payload,
    enqueuedAt: Date.now(),
  });
}

/**
 * Fetch queued settlement payload for given match.
 * Môžeš použiť z admin nástroja / skriptu alebo cron jobu.
 */
export async function getMatchSettlementJob(matchId: string) {
  const key = `${MATCH_QUEUE_PREFIX}:${matchId}`;
  return redisQueueClient.get<typeof defaultJobShape>(key);
}

const defaultJobShape = {
  payload: {},
  enqueuedAt: 0,
};

/**
 * Optional – ak chceš job po spracovaní zmazať.
 */
export async function deleteMatchSettlementJob(matchId: string) {
  const key = `${MATCH_QUEUE_PREFIX}:${matchId}`;
  await redisQueueClient.del(key);
}
