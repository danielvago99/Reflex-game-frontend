import { Router, Request } from 'express';
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

const router = Router();

const addressQuerySchema = z.object({
  address: z.string().min(1),
});

const loginSchema = z.object({
  address: z.string().min(1),
  signature: z.string().min(1),
  nonce: z.string().min(1),
  referralCode: z.string().min(1).optional(),
});

const getNonceKey = (address: string) => `auth:nonce:${address}`;
const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (Array.isArray(forwardedFor)) {
    const firstForwarded = forwardedFor[0]?.split(',')[0]?.trim();
    return firstForwarded || req.ip || '0.0.0.0';
  }

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    const firstForwarded = forwardedFor.split(',')[0]?.trim();
    return firstForwarded || req.ip || '0.0.0.0';
  }

  return req.ip || '0.0.0.0';
};

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

  const { address, signature, nonce, referralCode } = parsed.data;

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

  const ipAddress = getClientIp(req);
  const normalizedReferralCode = referralCode?.trim();

  const existingUser = await prisma.user.findUnique({
    where: { walletAddress: address },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { walletAddress: address },
        data: { ipAddress },
      })
    : await prisma.$transaction(async (tx) => {
        const username = `reflex_${crypto.randomBytes(4).toString('hex')}`;
        const createdUser = await tx.user.create({
          data: {
            walletAddress: address,
            username,
            ipAddress,
          },
        });

        if (normalizedReferralCode) {
          const ambassador = await tx.ambassadorProfile.findUnique({
            where: { code: normalizedReferralCode },
          });

          if (ambassador) {
            await tx.referral.create({
              data: {
                ambassadorId: ambassador.id,
                referredId: createdUser.id,
                status: 'pending',
                totalMatches: 0,
              },
            });

            await tx.ambassadorProfile.update({
              where: { id: ambassador.id },
              data: {
                totalInvited: { increment: 1 },
              },
            });
          }
        }

        return createdUser;
      });

  const token = jwt.sign(
    {
      sub: user.id,
      address: user.walletAddress,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  );

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
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
    token,
  });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
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
