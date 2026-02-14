import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const toStakeLamports = (value: unknown): number | null => {
  if (typeof value === 'bigint') {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) && asNumber >= 0 ? asNumber : null;
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;

  const rounded = Math.round(numeric);
  return Number.isSafeInteger(rounded) ? rounded : null;
};

// Backward compatibility: accepts SOL float and converts to lamports.
export const stakeInputToLamports = (payload: { stakeLamports?: unknown; stake?: unknown }) => {
  const fromLamports = toStakeLamports(payload.stakeLamports);
  if (fromLamports !== null) return fromLamports;

  const solStake = typeof payload.stake === 'number' ? payload.stake : Number(payload.stake);
  if (!Number.isFinite(solStake) || solStake < 0) return null;

  const lamports = Math.round(solStake * LAMPORTS_PER_SOL);
  return Number.isSafeInteger(lamports) ? lamports : null;
};

