"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../db/prisma");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get('/', async (_req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ok', db: 'ok' });
    }
    catch {
        res.status(500).json({ status: 'error', db: 'down' });
    }
});
