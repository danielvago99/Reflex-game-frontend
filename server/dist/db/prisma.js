"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// src/db/prisma.ts
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const env_1 = require("../config/env"); // tu máš zod-env s DATABASE_URL
const pool = new pg_1.Pool({
    connectionString: env_1.env.DATABASE_URL,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = new client_1.PrismaClient({
    adapter,
});
exports.default = exports.prisma;
// voliteľné, ale fajn:
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
    await pool.end();
});
