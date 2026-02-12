# Security Checklist (Audit-Ready, Not Audited)

- [x] Escrow payout destination restricted to player A or player B.
- [x] Fee destination restricted to `Config.fee_vault` PDA-bound account.
- [x] Settlement requires `server_authority` signer.
- [x] Settlement/cancel/refund are one-way state transitions to prevent double spend.
- [x] Free-stake claims require nonce + HMAC signature + TTL.
- [x] Free-stake budget controls include per-match, per-user/day and global daily cap.
- [x] Idempotency keys used for match creation and settle replay protection on backend.
- [x] Server keys loaded from env only (no committed private keys).
- [x] Devnet-first defaults for RPC and Anchor provider.

## Hardening before mainnet

- Move `server_authority` to multisig/committee signer.
- Split program upgrade authority from game backend operator.
- Add external signer HSM/KMS integration.
- Add persistent DB-backed idempotency and match logs.
- Commission independent smart-contract + infra audit.
