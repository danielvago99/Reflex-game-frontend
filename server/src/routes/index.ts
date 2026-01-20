import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { userRouter } from './user';
import { gameRouter } from './game';
import { ambassadorRouter } from './ambassador';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/game', gameRouter);
router.use('/ambassador', ambassadorRouter);

// TODO: router.use('/matchmaking', matchmakingRouter);
