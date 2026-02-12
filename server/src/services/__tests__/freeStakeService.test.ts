import { describe, expect, it } from 'vitest';
import { FreeStakeService } from '../freeStakeService';

describe('FreeStakeService limits', () => {
  it('enforces per-user daily match limits', () => {
    const service = new FreeStakeService();
    const wallet = 'wallet-1';

    for (let i = 0; i < 3; i += 1) {
      const claim = service.issueClaim(wallet);
      service.validateAndConsumeClaim({
        wallet,
        nonce: claim.nonce,
        signature: claim.signature,
        requestedLamports: 1000n,
      });
    }

    const fourth = service.issueClaim(wallet);

    expect(() =>
      service.validateAndConsumeClaim({
        wallet,
        nonce: fourth.nonce,
        signature: fourth.signature,
        requestedLamports: 1000n,
      }),
    ).toThrowError('FREE_STAKE_USER_DAILY_MATCH_LIMIT');
  });
});
