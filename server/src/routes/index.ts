import { Router } from 'express';
import { healthRouter } from './health';

export const router = Router();

router.use('/health', healthRouter);

// TODO: router.use('/auth', authRouter);
// TODO: router.use('/matchmaking', matchmakingRouter);
