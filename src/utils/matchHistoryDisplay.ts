import { ENV } from '../config/env';
import type { MatchHistoryEntry } from '../hooks/useMatchHistory';

const normalizeAmount = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const resolveStakeFee = (stake: number, explicitFee?: number | null) => {
  if (explicitFee != null) {
    return explicitFee;
  }

  return stake * (ENV.PLATFORM_FEE_PERCENTAGE / 100);
};

export const getNetWinAmount = (match: MatchHistoryEntry): number | null => {
  const stake = normalizeAmount(match.stakeAmount);
  const pot =
    normalizeAmount(match.potAmount) ??
    normalizeAmount(match.totalPot) ??
    normalizeAmount(match.pot) ??
    normalizeAmount(match.payoutPot);
  const fee =
    normalizeAmount(match.stakeFee) ??
    normalizeAmount(match.platformFee) ??
    normalizeAmount(match.feeAmount) ??
    normalizeAmount(match.fee);
  const profit = normalizeAmount(match.profit);

  if (pot != null && stake != null) {
    return pot - stake - resolveStakeFee(stake, fee);
  }

  if (profit != null) {
    return profit;
  }

  if (stake != null) {
    return stake - resolveStakeFee(stake, fee);
  }

  return null;
};
