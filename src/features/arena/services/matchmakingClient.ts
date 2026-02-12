import { API } from '../../../utils/api';
import { wsService } from '../../../utils/websocket';

export interface CreateMatchPayload {
  stakeLamports: number;
  idempotencyKey: string;
  freeStake?: boolean;
  claimNonce?: string;
  claimSignature?: string;
}

export const matchmakingClient = {
  createMatch: (payload: CreateMatchPayload) => API.game.createMatch(payload),
  joinMatch: (matchId: string) => API.game.joinMatch(matchId),
  finishMatch: (matchId: string, winner: string, feeVault?: string) =>
    API.game.finishMatch(matchId, { winner, feeVault }),
  claimFreeStake: () => API.game.claimFreeStake(),
  getMatch: (matchId: string) => API.game.getMatch(matchId),
  onMatchStatus: (handler: (payload: unknown) => void) =>
    wsService.on('match:status', (message) => handler(message.payload)),
};
