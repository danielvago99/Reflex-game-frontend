import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { userRouter } from './user';
import { gameRouter } from './game';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/game', gameRouter);

// TODO: router.use('/matchmaking', matchmakingRouter);
