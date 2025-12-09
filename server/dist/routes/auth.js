"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const prisma_1 = require("../db/prisma");
const redis_1 = require("../db/redis");
const auth_1 = require("../middleware/auth");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.authRouter = router;
const addressQuerySchema = zod_1.z.object({
    address: zod_1.z.string().min(1),
});
const loginSchema = zod_1.z.object({
    address: zod_1.z.string().min(1),
    signature: zod_1.z.string().min(1),
    nonce: zod_1.z.string().min(1),
});
const getNonceKey = (address) => `auth:nonce:${address}`;
const waitForRedisReady = async (attempts = 10, delayMs = 500) => {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            await redis_1.redisClient.ping();
            return;
        }
        catch (error) {
            logger_1.logger.warn({ error, attempt }, 'Redis not ready, retrying');
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
        new web3_js_1.PublicKey(address);
    }
    catch (error) {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }
    const nonce = crypto_1.default.randomBytes(32).toString('hex');
    const nonceKey = getNonceKey(address);
    await waitForRedisReady();
    await redis_1.redisClient.set(nonceKey, nonce, { ex: 300 }); // Expires in 5 minutes
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
        new web3_js_1.PublicKey(address);
    }
    catch (error) {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }
    const nonceKey = getNonceKey(address);
    await waitForRedisReady();
    const expectedNonce = await redis_1.redisClient.get(nonceKey);
    if (!expectedNonce || expectedNonce !== nonce) {
        return res.status(401).json({ error: 'Invalid or expired nonce' });
    }
    const message = `Reflex Login\nAddress: ${address}\nNonce: ${nonce}`;
    const messageBytes = Buffer.from(message, 'utf8');
    const signatureBytes = new Uint8Array(Buffer.from(signature, 'base64'));
    const pubkey = new web3_js_1.PublicKey(address);
    const isValid = tweetnacl_1.default.sign.detached.verify(messageBytes, signatureBytes, pubkey.toBytes());
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    const username = `reflex_${crypto_1.default.randomBytes(4).toString('hex')}`;
    const user = await prisma_1.prisma.user.upsert({
        where: { walletAddress: address },
        update: { updatedAt: new Date() },
        create: {
            walletAddress: address,
            username,
        },
    });
    const token = jsonwebtoken_1.default.sign({
        sub: user.id,
        address: user.walletAddress,
    }, env_1.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: env_1.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
    await waitForRedisReady();
    await redis_1.redisClient.del(nonceKey);
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
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: env_1.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
    return res.json({ ok: true });
});
router.get('/me', auth_1.attachUser, auth_1.requireAuth, async (req, res) => {
    const authUser = req.user;
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await prisma_1.prisma.user.findUnique({
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
