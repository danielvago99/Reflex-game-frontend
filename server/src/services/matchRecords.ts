import crypto from 'crypto';
import { toStakeLamports } from '../utils/stake';

export type MatchLifecycleStatus =
  | 'created'
  | 'waiting'
  | 'active'
  | 'finished'
  | 'settled'
  | 'refunded'
  | 'cancelled';

export interface MatchRecord {
  matchId: string;
  onChainMatch: string;
  playerA: string;
  playerB?: string;
  stakeLamports: number;
  freeStakeSponsored: boolean;
  status: MatchLifecycleStatus;
  idempotencyKey: string;
  winner?: string;
  settleSignature?: string;
  createdAt: number;
  updatedAt: number;
  logs: Array<{ at: number; action: string; details: Record<string, unknown> }>;
}

export class MatchRecordStore {
  private readonly records = new Map<string, MatchRecord>();
  private readonly idempotencyIndex = new Map<string, string>();

  create(input: {
    playerA: string;
    stakeLamports: number;
    idempotencyKey: string;
    freeStakeSponsored: boolean;
    onChainMatch?: string;
  }) {
    if (this.idempotencyIndex.has(input.idempotencyKey)) {
      return this.records.get(this.idempotencyIndex.get(input.idempotencyKey) as string) as MatchRecord;
    }


    const normalizedStakeLamports = toStakeLamports(input.stakeLamports);
    if (normalizedStakeLamports === null || normalizedStakeLamports <= 0) {
      throw new Error('INVALID_STAKE_LAMPORTS');
    }

    const matchId = crypto.randomUUID();
    const onChainMatch = input.onChainMatch ?? crypto.randomUUID().replace(/-/g, '').slice(0, 32);
    const now = Date.now();
    const record: MatchRecord = {
      matchId,
      onChainMatch,
      playerA: input.playerA,
      stakeLamports: normalizedStakeLamports,
      freeStakeSponsored: input.freeStakeSponsored,
      status: 'created',
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
      logs: [],
    };

    this.records.set(matchId, record);
    this.idempotencyIndex.set(input.idempotencyKey, matchId);
    this.log(matchId, 'created', {
      playerA: input.playerA,
      stakeLamports: normalizedStakeLamports,
      freeStakeSponsored: input.freeStakeSponsored,
    });

    return record;
  }

  get(matchId: string) {
    return this.records.get(matchId);
  }

  list() {
    return Array.from(this.records.values());
  }

  update(matchId: string, patch: Partial<Omit<MatchRecord, 'matchId' | 'logs'>>) {
    const current = this.records.get(matchId);
    if (!current) return undefined;
    const updated: MatchRecord = {
      ...current,
      ...patch,
      updatedAt: Date.now(),
    };
    this.records.set(matchId, updated);
    return updated;
  }

  log(matchId: string, action: string, details: Record<string, unknown>) {
    const current = this.records.get(matchId);
    if (!current) return;
    current.logs.push({ at: Date.now(), action, details });
    current.updatedAt = Date.now();
    this.records.set(matchId, current);
  }
}

export const matchRecordStore = new MatchRecordStore();
