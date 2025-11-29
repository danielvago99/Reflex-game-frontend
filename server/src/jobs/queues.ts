import { Queue } from 'bullmq';
import { env } from '../config/env';
import { createClient } from 'redis';

const connection = createClient({
  url: env.REDIS_URL,
});

// Do not connect here; connection setup will be handled later in a dedicated init step.

export const matchSettlementQueue = new Queue('match-settlement', {
  connection: { url: env.REDIS_URL },
});
