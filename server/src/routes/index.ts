import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { userRouter } from './user';
import { gameRouter } from './game';
import { ambassadorRouter } from './ambassador';
import { rewardsRouter } from './rewards';
import { jackpotRouter } from './jackpot';
import { matchmakingRouter } from './matchmaking';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/game', gameRouter);
router.use('/ambassador', ambassadorRouter);
router.use('/rewards', rewardsRouter);
router.use('/jackpot', jackpotRouter);
router.use('/matchmaking', matchmakingRouter);
