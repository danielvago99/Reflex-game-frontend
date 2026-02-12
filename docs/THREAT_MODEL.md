# Threat Model (Concise)

## Assets
- Escrowed SOL in per-match vault PDA.
- DAO fee flow into fee vault.
- Promo treasury budget for free stakes.
- Server authority signing capability.

## Main attackers
- Malicious players trying to self-settle or settle twice.
- Sybil users farming free stakes.
- Backend compromise leaking authority key.

## Controls
- On-chain state machine + signer checks block unauthorized settles.
- Strict payout constraints prevent arbitrary withdraw destinations.
- Backend idempotency + match state transitions reduce replay/race risk.
- Free-stake HMAC claims with nonce/TTL + quota controls mitigate abuse.
- Operational guidance requires key separation and multisig before production.
