import { Router } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaEscrowService } from '../services/solanaEscrowService';

const router = Router();

const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_JOIN_EXPIRY_SECONDS = 120;
const DEFAULT_SETTLE_DEADLINE_SECONDS = 900;

const parsePublicKey = (value: unknown, fieldName: string) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${fieldName}. Expected a non-empty base58 string.`);
  }

  try {
    return new PublicKey(value.trim()).toBase58();
  } catch {
    throw new Error(`Invalid ${fieldName}. Expected a valid Solana public key.`);
  }
};

router.post('/create', async (req, res) => {
  try {
    const stakeAmount = req.body?.stakeAmount;
    const playerWallet = parsePublicKey(req.body?.playerWallet, 'playerWallet');

    if (typeof stakeAmount !== 'number' || !Number.isFinite(stakeAmount) || stakeAmount <= 0) {
      return res.status(400).json({ error: 'Invalid stakeAmount. Expected a positive number.' });
    }

    const stakeLamports = BigInt(Math.round(stakeAmount * LAMPORTS_PER_SOL));

    const result = await solanaEscrowService.createMatch({
      playerA: playerWallet,
      stakeLamports,
      joinExpirySeconds: DEFAULT_JOIN_EXPIRY_SECONDS,
    });

    return res.status(200).json({
      serializedTransaction: result.serializedTransaction,
      gameMatch: result.gameMatch,
      vault: result.vault,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create match transaction.';
    const status = message.startsWith('Invalid ') ? 400 : 500;
    return res.status(status).json({ error: message });
  }
});

router.post('/join', async (req, res) => {
  try {
    const gameMatch = parsePublicKey(req.body?.gameMatch, 'gameMatch');
    const playerWallet = parsePublicKey(req.body?.playerWallet, 'playerWallet');

    const { serializedTransaction } = await solanaEscrowService.joinMatch({
      gameMatch,
      playerB: playerWallet,
      settleDeadlineSeconds: DEFAULT_SETTLE_DEADLINE_SECONDS,
    });

    return res.status(200).json({ serializedTransaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create join transaction.';
    const status = message.startsWith('Invalid ') ? 400 : 500;
    return res.status(status).json({ error: message });
  }
});

export { router as matchRouter };
