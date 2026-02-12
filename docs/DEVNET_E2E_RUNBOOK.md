# Devnet End-to-End Runbook

1. Install deps:
   - `npm install`
   - `cd server && npm install`
2. Copy env:
   - `cp .env.example .env`
   - Fill DB/Redis/JWT and Solana signer secrets.
3. Start backend:
   - `cd server && npm run dev`
4. Start frontend:
   - `npm run dev`
5. Optional Anchor flow:
   - `cd solana && anchor build`
   - `cd solana && anchor test`
6. Runtime flow:
   - Call `/api/matchmaking/free-stake/claim` (optional promo).
   - Call `/api/matchmaking/create` and `/api/matchmaking/:matchId/join`.
   - Backend finalizes via `/api/matchmaking/:matchId/finish` and emits websocket `match:status` with tx signature.

## Known limitations
- No external audit yet.
- In-memory match records are not durable across process restart.
- `solanaEscrowService` falls back to skipped settlement if signer/program not configured.
