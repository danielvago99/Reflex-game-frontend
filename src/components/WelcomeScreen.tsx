import { useEffect, useMemo, useRef, useState } from 'react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { Key, Target, Timer, Trophy, Wallet, X, Zap } from 'lucide-react';
import { FuturisticBackground } from './FuturisticBackground';
import { useWallet as useAppWallet } from '../features/wallet/context/WalletProvider';
import { useAuth } from '../features/auth/hooks/useAuth';

interface WelcomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  const { wallets, select, connect, connected, connecting, publicKey, wallet, signMessage } = useSolanaWallet();
  const { connectExternalWallet } = useAppWallet();
  const { loginWithExternalWallet } = useAuth();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'signing'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSignedRef = useRef(false);
  const lastSignedKeyRef = useRef<string | null>(null);

  const walletName = wallet?.adapter.name ?? 'External Wallet';
  const isConnecting = connecting || status === 'connecting';
  const isSigning = status === 'signing';

  const walletOptions = useMemo(
    () =>
      wallets.filter(walletOption => walletOption.readyState !== WalletReadyState.Unsupported),
    [wallets],
  );

  useEffect(() => {
    if (!connected || !publicKey) {
      hasSignedRef.current = false;
      lastSignedKeyRef.current = null;
      return;
    }

    const activeKey = publicKey.toBase58();
    connectExternalWallet(activeKey, walletName);

    if (hasSignedRef.current && lastSignedKeyRef.current === activeKey) {
      return;
    }

    hasSignedRef.current = true;
    lastSignedKeyRef.current = activeKey;
    setStatus('signing');
    setErrorMessage(null);

    const runLogin = async () => {
      try {
        if (!signMessage) {
          throw new Error('Wallet does not support message signing.');
        }

        await loginWithExternalWallet({
          address: activeKey,
          signMessage: async (message: string) => signMessage(new TextEncoder().encode(message)),
        });
        setStatus('idle');
        setIsWalletModalOpen(false);
        onNavigate('dashboard');
      } catch (error) {
        console.error('Solana login failed', error);
        setStatus('idle');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to authenticate with wallet');
        hasSignedRef.current = false;
      }
    };

    void runLogin();
  }, [connected, connectExternalWallet, loginWithExternalWallet, onNavigate, publicKey, signMessage, walletName]);

  const handleConnectWallet = () => {
    setErrorMessage(null);
    setIsWalletModalOpen(true);
  };

  const handleSelectWallet = async (walletToSelect: string) => {
    try {
      setErrorMessage(null);
      setStatus('connecting');
      select(walletToSelect);
      await connect();
      setStatus('idle');
    } catch (error) {
      console.error('Wallet connection failed', error);
      setStatus('idle');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to connect wallet');
    }
  };

  const handleCloseModal = () => {
    if (isConnecting || isSigning) return;
    setIsWalletModalOpen(false);
  };

  const statusLabel = isSigning ? 'Signing...' : isConnecting ? 'Connecting...' : undefined;

  return (
    <div
      id="page-root"
      className="min-h-screen-dvh bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] px-4 py-8 sm:px-6 lg:px-10 relative overflow-hidden"
    >
      <FuturisticBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 text-center lg:text-left">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] blur-xl opacity-50"></div>
              <div className="relative rounded-3xl bg-gradient-to-br from-[#00FFA3] to-[#7C3AED] p-4 shadow-2xl sm:p-5">
                <Zap className="h-10 w-10 text-[#0B0F1A] sm:h-12 sm:w-12" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#00FFA3]/80">Reflexmatch Protocol</p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                REFLEXMATCH<span className="text-[#00FFA3]">.io</span>
              </h1>
              <p className="mt-2 text-sm text-gray-400 sm:text-base">
                Enter the neon arena where milliseconds decide the payout.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr_0.9fr]">
          <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(0,255,163,0.12)]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#7C3AED]/80">Game Briefing</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Fastest reaction wins the vault.</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">
                Reflexmatch is a high-stakes reaction duel powered by Solana. Trigger the signal, land
                the perfect timing window, and secure instant on-chain payouts. Spectators track your
                streak live while you climb the global leaderboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-gray-400">Match Format</p>
                <p className="mt-2 text-lg font-semibold text-white">1v1 Neon Duels</p>
                <p className="mt-1 text-xs text-gray-500">Ranked + private rooms</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-gray-400">Latency Target</p>
                <p className="mt-2 text-lg font-semibold text-white">&lt; 100ms</p>
                <p className="mt-1 text-xs text-gray-500">Realtime signal sync</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-gray-400">Payout Speed</p>
                <p className="mt-2 text-lg font-semibold text-white">Instant SPL</p>
                <p className="mt-1 text-xs text-gray-500">Autonomous settlement</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-gray-400">Skill Curve</p>
                <p className="mt-2 text-lg font-semibold text-white">Adaptive</p>
                <p className="mt-1 text-xs text-gray-500">AI-adjusted difficulty</p>
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-[#00FFA3]/20 bg-gradient-to-b from-black/60 via-black/40 to-black/70 p-6 shadow-[0_0_35px_rgba(0,255,163,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#00FFA3]/70">Live Arena</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Active pulse feed</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#00FFA3]">
                24/7 ONLINE
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-[#00FFA3]" />
                    <div>
                      <p className="text-sm font-semibold text-white">Precision Streaks</p>
                      <p className="text-xs text-gray-400">Target windows tighten per win</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#00FFA3]">+12% XP</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Timer className="h-5 w-5 text-[#06B6D4]" />
                    <div>
                      <p className="text-sm font-semibold text-white">Realtime Matchmaking</p>
                      <p className="text-xs text-gray-400">Queue matched under 30s</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#06B6D4]">Synced</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-[#7C3AED]" />
                    <div>
                      <p className="text-sm font-semibold text-white">Winner Takes Vault</p>
                      <p className="text-xs text-gray-400">On-chain pot distribution</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#7C3AED]">Top Tier</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#00FFA3]/10 via-[#06B6D4]/10 to-[#7C3AED]/10 p-4 text-sm text-gray-300">
              <p className="font-semibold text-white">Season 04: Neon Ascension</p>
              <p className="mt-2 text-xs text-gray-400">
                Unlock holographic skins, climb ladder ranks, and earn split-second bonuses for
                perfect reaction chains.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[#00FFA3]/70">Access Terminal</p>
              <h3 className="text-xl font-semibold text-white">Authenticate &amp; deploy</h3>
              <p className="text-xs text-gray-400">
                Connect your Solana wallet or create a new vault to enter competitive queues.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting || isSigning}
                className="w-full rounded-2xl bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] py-3 text-sm font-semibold text-[#0B0F1A] shadow-[0_0_30px_rgba(0,255,163,0.35)] transition hover:shadow-[0_0_40px_rgba(0,255,163,0.6)] disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {statusLabel ?? 'Connect Wallet'}
                </span>
              </button>

              {statusLabel ? (
                <p className="text-center text-xs uppercase tracking-widest text-[#00FFA3]">{statusLabel}</p>
              ) : null}

              {errorMessage ? (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-xs text-red-200 shadow-[0_0_15px_rgba(248,113,113,0.25)]">
                  {errorMessage}
                </div>
              ) : null}

              <button
                onClick={() => onNavigate('create-wallet')}
                className="w-full rounded-2xl border border-[#00FFA3]/40 bg-white/5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(0,255,163,0.2)] transition hover:border-[#00FFA3]/70 hover:bg-white/10"
              >
                <span className="flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" />
                  Create Wallet
                </span>
              </button>

              <button
                onClick={() => onNavigate('lobby')}
                className="w-full rounded-2xl border border-[#7C3AED]/40 bg-white/5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.25)] transition hover:border-[#7C3AED]/70 hover:bg-white/10"
              >
                <span className="flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Show Demo
                </span>
              </button>

              <button
                onClick={() => onNavigate('unlock-wallet')}
                className="w-full rounded-2xl border border-white/10 py-2 text-xs text-[#00FFA3] transition hover:border-[#00FFA3]/60 hover:text-[#06B6D4]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Key className="h-4 w-4" />
                  Unlock Existing Wallet
                </span>
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-gray-400">
              <div className="flex items-center justify-between">
                <span>Competitive Uptime</span>
                <span className="text-[#00FFA3]">99.97%</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Active competitors</span>
                <span className="text-white">2,418 online</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Vault liquidity</span>
                <span className="text-white">4,102 SOL</span>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex flex-col items-center justify-between gap-2 text-xs text-gray-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#00FFA3]"></div>
            <span>Built for competitive players</span>
          </div>
          <span className="text-[#00FFA3]/70">Neon latency optimized · Solana native</span>
        </footer>
      </div>

      {isWalletModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#05070d]/80 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#7C3AED]/20 via-[#06B6D4]/20 to-[#00FFA3]/20 blur-2xl opacity-60"></div>

            <div
              className="relative bg-black/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl overflow-hidden"
              style={{
                clipPath:
                  'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
              }}
            >
              <div className="absolute top-0 left-0 h-px w-8 bg-gradient-to-r from-[#00FFA3] to-transparent"></div>
              <div className="absolute top-0 left-0 h-8 w-px bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
              <div className="absolute bottom-0 right-0 h-px w-8 bg-gradient-to-l from-[#7C3AED] to-transparent"></div>
              <div className="absolute bottom-0 right-0 h-8 w-px bg-gradient-to-t from-[#7C3AED] to-transparent"></div>

              <div className="flex items-start justify-between px-6 pt-6">
                <div>
                  <h2 className="text-lg text-white">Connect your wallet</h2>
                  <p className="text-xs text-gray-400">Choose a Solana wallet to enter the arena.</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  disabled={isConnecting || isSigning}
                  className="rounded-full border border-white/10 p-1 text-gray-400 transition hover:text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 px-6 py-5">
                {walletOptions.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-gray-400">
                    No compatible wallets detected. Install Phantom or Solflare to continue.
                  </div>
                ) : (
                  walletOptions.map(walletOption => {
                    const readyState = walletOption.readyState;
                    const readyLabel =
                      readyState === WalletReadyState.Installed
                        ? 'Detected'
                        : readyState === WalletReadyState.Loadable
                        ? 'Loadable'
                        : readyState === WalletReadyState.NotDetected
                        ? 'Not Installed'
                        : 'Unsupported';
                    const isSelected = walletOption.adapter.name === wallet?.adapter.name;

                    return (
                      <button
                        key={walletOption.adapter.name}
                        onClick={() => handleSelectWallet(walletOption.adapter.name)}
                        disabled={isConnecting || isSigning}
                        className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:border-[#00FFA3]/50 hover:bg-white/10 disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                            {walletOption.adapter.icon ? (
                              <img src={walletOption.adapter.icon} alt="" className="h-6 w-6" />
                            ) : (
                              <Wallet className="h-5 w-5 text-[#00FFA3]" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{walletOption.adapter.name}</p>
                            <p className="text-xs text-gray-400">{readyLabel}</p>
                          </div>
                        </div>
                        <span className="text-xs text-[#00FFA3]">
                          {isSelected ? (isConnecting ? 'Connecting...' : 'Selected') : 'Connect'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {errorMessage ? (
                <div className="mx-6 mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 shadow-[0_0_15px_rgba(248,113,113,0.2)]">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
