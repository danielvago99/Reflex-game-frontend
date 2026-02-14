import { describe, expect, it } from 'vitest';
import { MatchRecordStore } from '../matchRecords';

describe('MatchRecordStore idempotency', () => {
  it('returns same record for same idempotency key and blocks duplicate settle transitions', () => {
    const store = new MatchRecordStore();

    const first = store.create({
      playerA: 'A111',
      stakeLamports: 1000,
      idempotencyKey: 'idem-key-1',
      freeStakeSponsored: false,
    });

    const second = store.create({
      playerA: 'A111',
      stakeLamports: 1000,
      idempotencyKey: 'idem-key-1',
      freeStakeSponsored: false,
    });

    expect(first.matchId).toBe(second.matchId);

    store.update(first.matchId, { status: 'settled', settleSignature: 'sig-1' });
    const settled = store.get(first.matchId);
    expect(settled?.status).toBe('settled');
    expect(settled?.settleSignature).toBe('sig-1');
  });
});
