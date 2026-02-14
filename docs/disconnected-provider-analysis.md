# Disconnected Provider Analysis (In-App Wallet vs Solana Adapter)

## Root architectural flaw
The app has **two wallet sources of truth** that are never unified:

- `SolanaProvider` and `useSolanaAuth` read wallet state from `@solana/wallet-adapter-react`.
- The in-app wallet login/unlock flow lives in custom `WalletProvider`.

Because these providers are disconnected, in-app wallet users can authenticate at the app layer but still appear as "no Solana wallet connected" to on-chain and handshake paths.

## How `SolanaProvider.tsx` currently instantiates Anchor
`SolanaProvider` builds Anchor objects only from wallet-adapter hooks:

1. Reads `connection` from `useConnection()`.
2. Reads `wallet` from `useAnchorWallet()`.
3. If `wallet` is absent, `provider` is `null`.
4. If `provider` is absent, `program` is `null`.

So all program RPCs (`createMatch`, `joinMatch`) are hard-gated on wallet-adapter connectivity, not in-app wallet state.

## Why `program` is null for in-app wallet users
In-app wallet users are connected only through `WalletProvider` (`address`, `signMessage`, `sendTransaction`), not through wallet-adapter’s `connected/publicKey/wallet` context.

Therefore:

- `useAnchorWallet()` returns `null`.
- `AnchorProvider` is never instantiated.
- `Program` stays `null`.
- Match entry/on-chain actions fail with "Wallet is not connected" semantics even after in-app auth.

## Why `useSolanaAuth` fails for in-app wallet handshake
`useSolanaAuth` also binds to wallet-adapter state:

- Requires `connected && publicKey` from `@solana/wallet-adapter-react`.
- Requires adapter `signMessage`.

For in-app wallet sessions, those adapter fields are unset, so login handshake cannot proceed through this hook (or fails with wallet-not-connected / no-signing-support errors), despite custom wallet being unlocked and capable of signing.

## High-level architecture fix: Unified Wallet Adapter bridge
Introduce a **Unified Wallet Adapter interface** used by `SolanaProvider`, auth handshake hooks, and tx execution:

- Canonical shape: `{ publicKey, connected, signMessage, sendTransaction, walletType }`.
- Resolution rule: prefer external adapter when connected; otherwise fall back to in-app wallet if unlocked.
- Implement a bridge wrapper that converts `WalletProvider` capabilities into adapter-compatible methods.
- Build Anchor provider/program from unified wallet, not raw `useAnchorWallet()`.
- Point `useSolanaAuth` to unified wallet so handshake signatures come from either source.

This removes the disconnected-provider split and ensures ranked-match gating sees both external and in-app wallets as valid Solana signers.
