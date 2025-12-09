"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisQueueClient = void 0;
exports.enqueueMatchSettlement = enqueueMatchSettlement;
exports.getMatchSettlementJob = getMatchSettlementJob;
exports.deleteMatchSettlementJob = deleteMatchSettlementJob;
const redis_1 = require("@upstash/redis");
const env_1 = require("../config/env");
// Single Upstash Redis klient – používa REST URL + TOKEN
exports.redisQueueClient = new redis_1.Redis({
    url: env_1.env.UPSTASH_REDIS_REST_URL,
    token: env_1.env.UPSTASH_REDIS_REST_TOKEN,
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
async function enqueueMatchSettlement(matchId, payload) {
    const key = `${MATCH_QUEUE_PREFIX}:${matchId}`;
    // Uložíme JSON payload – môžeš si do toho dať čokoľvek
    await exports.redisQueueClient.set(key, {
        payload,
        enqueuedAt: Date.now(),
    });
}
/**
 * Fetch queued settlement payload for given match.
 * Môžeš použiť z admin nástroja / skriptu alebo cron jobu.
 */
async function getMatchSettlementJob(matchId) {
    const key = `${MATCH_QUEUE_PREFIX}:${matchId}`;
    return exports.redisQueueClient.get(key);
}
const defaultJobShape = {
    payload: {},
    enqueuedAt: 0,
};
/**
 * Optional – ak chceš job po spracovaní zmazať.
 */
async function deleteMatchSettlementJob(matchId) {
    const key = `${MATCH_QUEUE_PREFIX}:${matchId}`;
    await exports.redisQueueClient.del(key);
}
