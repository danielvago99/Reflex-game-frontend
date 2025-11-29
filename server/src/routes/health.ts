import { Router } from 'express';
import { prisma } from '../db/prisma';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok' });
  } catch {
    res.status(500).json({ status: 'error', db: 'down' });
  }
});
