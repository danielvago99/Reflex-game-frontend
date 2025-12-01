import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);

// TODO: router.use('/matchmaking', matchmakingRouter);
