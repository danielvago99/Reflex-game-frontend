import { Router } from 'express';
import { attachUser, requireAuth } from '../middleware/auth';
import { matchRecordStore } from '../services/matchRecords';
import { freeStakeService } from '../services/freeStakeService';
import { solanaEscrowService } from '../services/solanaEscrowService';
import { logger } from '../utils/logger';
import { stakeInputToLamports } from '../utils/stake';
import { matchmakingEvents } from '../utils/events';

const router = Router();

router.post('/free-stake/claim', attachUser, requireAuth, (req, res) => {
  const auth = req.user;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const claim = freeStakeService.issueClaim(auth.address);
  return res.status(201).json({ claim });
});

router.post('/create', attachUser, requireAuth, (req, res) => {
  const auth = req.user;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const { idempotencyKey, freeStake, claimNonce, claimSignature } = req.body as {
    idempotencyKey?: string;
    freeStake?: boolean;
    claimNonce?: string;
    claimSignature?: string;
  };

  const stakeLamports = stakeInputToLamports(req.body as { stakeLamports?: unknown; stake?: unknown });
  if (stakeLamports === null || stakeLamports <= 0) {
    return res.status(400).json({ error: 'Invalid stake lamports' });
  }
  if (!idempotencyKey || idempotencyKey.length < 8) {
    return res.status(400).json({ error: 'Missing idempotency key' });
  }

  try {
    if (freeStake) {
      freeStakeService.validateAndConsumeClaim({
        wallet: auth.address,
        nonce: claimNonce ?? '',
        signature: claimSignature ?? '',
        requestedLamports: stakeLamports,
      });
    }

    const record = matchRecordStore.create({
      playerA: auth.address,
      stakeLamports,
      idempotencyKey,
      freeStakeSponsored: Boolean(freeStake),
    });
    matchRecordStore.update(record.matchId, { status: 'waiting' });

    matchmakingEvents.emit('match_status', { matchId: record.matchId, status: 'waiting', userIds: [auth.id] });
    return res.status(201).json({ match: record });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Could not create match',
    });
  }
});

router.post('/:matchId/join', attachUser, requireAuth, (req, res) => {
  const auth = req.user;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const match = matchRecordStore.get(req.params.matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.playerA === auth.address) return res.status(400).json({ error: 'Cannot self-join' });
  if (match.playerB) return res.status(409).json({ error: 'Match already joined' });

  const updated = matchRecordStore.update(match.matchId, {
    playerB: auth.address,
    status: 'active',
  });

  matchRecordStore.log(match.matchId, 'joined', { playerB: auth.address });
  matchmakingEvents.emit('match_status', { matchId: match.matchId, status: 'active', userIds: [auth.id] });
  return res.json({ match: updated });
});

router.post('/:matchId/finish', attachUser, requireAuth, async (req, res) => {
  const auth = req.user;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const { winner, feeVault } = req.body as { winner?: string; feeVault?: string };
  const match = matchRecordStore.get(req.params.matchId);

  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (!match.playerB) return res.status(400).json({ error: 'Match not active' });
  if (!winner || (winner !== match.playerA && winner !== match.playerB)) {
    return res.status(400).json({ error: 'Winner must be playerA or playerB' });
  }

  if (match.status === 'settled') {
    return res.status(200).json({ match, signature: match.settleSignature, idempotent: true });
  }

  matchRecordStore.update(match.matchId, { status: 'finished', winner });
  matchRecordStore.log(match.matchId, 'winner_selected', { winner, decidedBy: auth.address });

  try {
    const result = await solanaEscrowService.settleMatch({
      matchId: match.onChainMatch,
      winner,
      playerA: match.playerA,
      playerB: match.playerB,
      feeVault: feeVault ?? match.playerA,
    });

    const updated = matchRecordStore.update(match.matchId, {
      status: 'settled',
      settleSignature: result.signature,
    });

    matchRecordStore.log(match.matchId, 'settled', {
      winner,
      signature: result.signature,
    });

    logger.info(
      {
        matchId: match.matchId,
        onChainMatch: match.onChainMatch,
        playerA: match.playerA,
        playerB: match.playerB,
        stakeLamports: match.stakeLamports.toString(),
        winner,
        signature: result.signature,
      },
      'Match settled',
    );

    matchmakingEvents.emit('match_status', { matchId: match.matchId, status: 'settled', signature: result.signature, userIds: [auth.id] });
    return res.json({ match: updated, signature: result.signature });
  } catch (error) {
    matchRecordStore.log(match.matchId, 'settle_failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return res.status(500).json({
      error: 'Settlement failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:matchId', attachUser, requireAuth, (req, res) => {
  const match = matchRecordStore.get(req.params.matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  return res.json({ match });
});

export { router as matchmakingRouter };
