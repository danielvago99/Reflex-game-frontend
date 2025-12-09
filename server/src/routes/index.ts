import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { userRouter } from './user';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/user', userRouter);

// TODO: router.use('/matchmaking', matchmakingRouter);
