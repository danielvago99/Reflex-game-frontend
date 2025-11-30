"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchSettlementQueue = void 0;
const bullmq_1 = require("bullmq");
const env_1 = require("../config/env");
const redis_1 = require("redis");
const connection = (0, redis_1.createClient)({
    url: env_1.env.REDIS_URL,
});
// Do not connect here; connection setup will be handled later in a dedicated init step.
exports.matchSettlementQueue = new bullmq_1.Queue('match-settlement', {
    connection: { url: env_1.env.REDIS_URL },
});
