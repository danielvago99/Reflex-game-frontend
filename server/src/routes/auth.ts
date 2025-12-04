import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import { prisma } from '../db/prisma';
import { redisClient } from '../db/redis';
import { attachUser, requireAuth } from '../middleware/auth';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ensurePlayerStats } from '../utils/playerStats';

const router = Router();

const addressQuerySchema = z.object({
  address: z.string().min(1),
});

const loginSchema = z.object({
  address: z.string().min(1),
  signature: z.string().min(1),
  nonce: z.string().min(1),
});

const getNonceKey = (address: string) => `auth:nonce:${address}`;

const waitForRedisReady = async (
  attempts = 10,
  delayMs = 500,
): Promise<void> => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await redisClient.ping();
      return;
    } catch (error) {
      logger.warn({ error, attempt }, 'Redis not ready, retrying');

      if (attempt === attempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
};

router.get('/nonce', async (req, res) => {
  const parsed = addressQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Address is required' });
  }

  const { address } = parsed.data;

  try {
    // Validate Solana public key
    // eslint-disable-next-line no-new
    new PublicKey(address);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const nonce = crypto.randomBytes(32).toString('hex');
  const nonceKey = getNonceKey(address);

  await waitForRedisReady();
  await redisClient.set(nonceKey, nonce, { ex: 300}); // Expires in 5 minutes

  const message = `Reflex Login\nAddress: ${address}\nNonce: ${nonce}`;

  return res.json({
    address,
    nonce,
    message,
  });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { address, signature, nonce } = parsed.data;

  try {
    // eslint-disable-next-line no-new
    new PublicKey(address);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const nonceKey = getNonceKey(address);
  await waitForRedisReady();
  const expectedNonce = await redisClient.get(nonceKey);

  if (!expectedNonce || expectedNonce !== nonce) {
    return res.status(401).json({ error: 'Invalid or expired nonce' });
  }

  const message = `Reflex Login\nAddress: ${address}\nNonce: ${nonce}`;
  const messageBytes = Buffer.from(message, 'utf8');
  const signatureBytes = new Uint8Array(Buffer.from(signature, 'base64'));
  const pubkey = new PublicKey(address);

  const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, pubkey.toBytes());

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const username = `reflex_${crypto.randomBytes(4).toString('hex')}`;

  const user = await prisma.user.upsert({
    where: { walletAddress: address },
    update: { updatedAt: new Date() },
    create: {
      walletAddress: address,
      username,
    },
  });

  await ensurePlayerStats(user.id);

  const token = jwt.sign(
    {
      sub: user.id,
      address: user.walletAddress,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  );

  const secureCookie = env.FRONTEND_ORIGIN.startsWith('https://');

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    path: '/',
  });

  await waitForRedisReady();
  await redisClient.del(nonceKey);

  return res.json({
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      avatar: user.avatar,
    },
  });
});

router.post('/logout', (_req, res) => {
  const secureCookie = env.FRONTEND_ORIGIN.startsWith('https://');

  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    path: '/',
  });

  return res.json({ ok: true });
});

router.get('/me', attachUser, requireAuth, async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      walletAddress: true,
      username: true,
      avatar: true,
    },
  });

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json({ user });
});

export { router as authRouter };
