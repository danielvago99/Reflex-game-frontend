import crypto from 'crypto';
import { env } from '../config/env';

interface FreeStakeClaim {
  nonce: string;
  wallet: string;
  issuedAt: number;
  expiresAt: number;
}

interface UserQuota {
  count: number;
  spentLamports: bigint;
  windowStartedAt: number;
}

export class FreeStakeService {
  private readonly claims = new Map<string, FreeStakeClaim>();
  private readonly userDailyQuota = new Map<string, UserQuota>();
  private dailyBudgetRemaining: bigint;

  constructor() {
    this.dailyBudgetRemaining = BigInt(env.FREE_STAKE_DAILY_BUDGET_LAMPORTS);
  }

  issueClaim(wallet: string) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const issuedAt = Date.now();
    const expiresAt = issuedAt + env.FREE_STAKE_CLAIM_TTL_MS;
    const claim: FreeStakeClaim = { nonce, wallet, issuedAt, expiresAt };
    this.claims.set(nonce, claim);
    return {
      nonce,
      signature: this.signClaim(claim),
      expiresAt,
    };
  }

  validateAndConsumeClaim(input: {
    wallet: string;
    nonce: string;
    signature: string;
    requestedLamports: bigint;
  }) {
    const claim = this.claims.get(input.nonce);
    if (!claim) throw new Error('FREE_STAKE_INVALID_NONCE');
    if (claim.wallet !== input.wallet) throw new Error('FREE_STAKE_WALLET_MISMATCH');
    if (claim.expiresAt < Date.now()) throw new Error('FREE_STAKE_CLAIM_EXPIRED');

    const expectedSignature = this.signClaim(claim);
    if (expectedSignature !== input.signature) throw new Error('FREE_STAKE_INVALID_SIGNATURE');

    this.enforceQuota(input.wallet, input.requestedLamports);
    this.claims.delete(input.nonce);
  }

  private enforceQuota(wallet: string, requestedLamports: bigint) {
    if (requestedLamports > BigInt(env.FREE_STAKE_MAX_PER_MATCH_LAMPORTS)) {
      throw new Error('FREE_STAKE_MATCH_LIMIT_EXCEEDED');
    }

    const now = Date.now();
    const quota = this.userDailyQuota.get(wallet);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const activeQuota =
      quota && now - quota.windowStartedAt < oneDayMs
        ? quota
        : { count: 0, spentLamports: 0n, windowStartedAt: now };

    if (activeQuota.count >= env.FREE_STAKE_MAX_MATCHES_PER_USER_PER_DAY) {
      throw new Error('FREE_STAKE_USER_DAILY_MATCH_LIMIT');
    }

    if (
      activeQuota.spentLamports + requestedLamports >
      BigInt(env.FREE_STAKE_MAX_LAMPORTS_PER_USER_PER_DAY)
    ) {
      throw new Error('FREE_STAKE_USER_DAILY_BUDGET_LIMIT');
    }

    if (this.dailyBudgetRemaining < requestedLamports) {
      throw new Error('FREE_STAKE_DAILY_BUDGET_EXHAUSTED');
    }

    activeQuota.count += 1;
    activeQuota.spentLamports += requestedLamports;
    this.dailyBudgetRemaining -= requestedLamports;
    this.userDailyQuota.set(wallet, activeQuota);
  }

  private signClaim(claim: FreeStakeClaim) {
    const payload = `${claim.wallet}:${claim.nonce}:${claim.issuedAt}:${claim.expiresAt}`;
    return crypto
      .createHmac('sha256', env.FREE_STAKE_SIGNING_SECRET)
      .update(payload)
      .digest('hex');
  }
}

export const freeStakeService = new FreeStakeService();
