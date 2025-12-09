"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../db/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.userRouter = router;
const profileUpdateSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50).optional(),
    avatar: zod_1.z.string().url().optional(),
});
const gameEndSchema = zod_1.z.object({
    result: zod_1.z.enum(['win', 'loss']),
    score: zod_1.z.number().int().nonnegative(),
});
router.get('/dashboard', auth_1.attachUser, auth_1.requireAuth, async (req, res) => {
    const authUser = req.user;
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: authUser.id },
        include: {
            stats: true,
            ambassadorProfile: true,
            dailyChallenge: true,
        },
    });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
});
router.patch('/profile', auth_1.attachUser, auth_1.requireAuth, async (req, res) => {
    const authUser = req.user;
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    const { username, avatar } = parsed.data;
    if (!username && !avatar) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    if (username) {
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                username,
                NOT: { id: authUser.id },
            },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }
    }
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: authUser.id },
        data: {
            username: username ?? undefined,
            avatar: avatar ?? undefined,
        },
        select: {
            id: true,
            username: true,
            avatar: true,
            walletAddress: true,
        },
    });
    return res.json({ user: updatedUser });
});
router.post('/game/end', auth_1.attachUser, auth_1.requireAuth, async (req, res) => {
    const authUser = req.user;
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const parsed = gameEndSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    const { result, score } = parsed.data;
    const updatedStats = await prisma_1.prisma.$transaction(async (tx) => {
        const stats = await tx.playerStats.upsert({
            where: { userId: authUser.id },
            create: {
                userId: authUser.id,
                totalMatches: 1,
                totalWins: result === 'win' ? 1 : 0,
                totalLosses: result === 'loss' ? 1 : 0,
                totalReflexPoints: score,
            },
            update: {
                totalMatches: { increment: 1 },
                totalWins: { increment: result === 'win' ? 1 : 0 },
                totalLosses: { increment: result === 'loss' ? 1 : 0 },
                totalReflexPoints: { increment: score },
            },
        });
        const winRate = stats.totalMatches > 0 ? stats.totalWins / stats.totalMatches : 0;
        return tx.playerStats.update({
            where: { id: stats.id },
            data: { winRate },
        });
    });
    return res.json({ stats: updatedStats });
});
