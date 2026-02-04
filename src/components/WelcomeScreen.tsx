import { useEffect, useMemo, useRef, useState } from 'react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { Gamepad2, Key, RotateCcw, ShieldCheck, Trophy, UsersRound, Wallet, X, Zap } from 'lucide-react';
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
    <div id="page-root" className="h-screen-dvh bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] flex flex-col items-center justify-center p-3 xs:p-4 sm:p-6 relative overflow-hidden">
      
      <FuturisticBackground />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Logo */}
        <div className="mb-6 xs:mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] blur-xl opacity-50 rounded-full"></div>
          <div className="relative bg-gradient-to-br from-[#00FFA3] to-[#7C3AED] p-4 xs:p-5 sm:p-6 rounded-2xl xs:rounded-3xl shadow-2xl">
            <Zap className="w-12 xs:w-14 sm:w-16 h-12 xs:h-14 sm:h-16 text-[#0B0F1A]" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl xs:text-2xl mb-2 xs:mb-3 bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] bg-clip-text text-transparent">
          REFLEXMATCH.io
        </h1>
        <p className="text-xs xs:text-xs text-gray-400 text-center px-2 gap-3 mb-4">
          Compete worldwide in live 1v1 reflex match for SOL. React faster than your opponent and win the pot.
        </p>

        {/* Buttons */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting || isSigning}
            className="mx-auto w-full bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A] py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            <span>{statusLabel ?? 'Connect Wallet'}</span>
          </button>

          <button
            onClick={() => onNavigate('lobby')}
            className="mx-auto w-36 rounded-lg border border-white/10 bg-white/5 py-1.5 px-3 text-xs text-white/90 shadow-lg transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white flex items-center justify-center gap-2 mb-2"
          >
            <RotateCcw className="h-4 w-4 text-[#00FFA3]" />
            <span>Try Demo</span>
          </button>

          {statusLabel ? (
            <p className="text-center text-xs text-[#00FFA3] uppercase tracking-widest">{statusLabel}</p>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-xs text-red-200 shadow-[0_0_15px_rgba(248,113,113,0.25)]">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm mb-4">
          <button
            onClick={() => onNavigate('create-wallet')}
            className="flex items-center gap-2 text-gray-400 transition hover:text-white"
          >
            <Zap className="h-4 w-4" />
            <span>Create Wallet</span>
          </button>
          <button
            onClick={() => onNavigate('unlock-wallet')}
            className="flex items-center gap-2 text-gray-400 transition hover:text-white"
          >
            <Key className="h-4 w-4" />
            <span>Unlock Wallet</span>
          </button>
        </div>

        {/* Guaranteed Fair Play Section */}
        <div className="w-full max-w-sm mx-auto">
          {/* Neon Header with Decorations */}
          <div className="flex items-center justify-center gap-3 mb-5">
            {/* Left Decoration */}
            <div className="flex items-center gap-1 opacity-50">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#00FFA3]"></div>
              <div className="h-1 w-1 rounded-full bg-[#00FFA3] shadow-[0_0_5px_#00FFA3]"></div>
            </div>

            {/* Neon Text */}
            <span className="text-sm font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] drop-shadow-[0_0_10px_rgba(0,255,163,0.3)]">
              Guaranteed Fair Play
            </span>

            {/* Right Decoration */}
            <div className="flex items-center gap-1 opacity-50">
              <div className="h-1 w-1 rounded-full bg-[#7C3AED] shadow-[0_0_5px_#06B6D4]"></div>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#7C3AED]"></div>
            </div>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Anti-Cheat */}
            <div className="group relative overflow-hidden rounded-xl border border-[#06B6D4]/20 bg-[#05070d]/60 p-3 backdrop-blur-[3px] transition-all duration-300 hover:border-[#00FFA3]/50 hover:bg-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-[#00FFA3]/10 p-2 text-[#00FFA3] shadow-[0_0_15px_rgba(0,255,163,0.2)]">
                  <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#00FFA3]">Anti-Cheat</h4>
                  <p className="text-[10px] text-gray-400 leading-tight">Server-verified reaction times, identical targets, equal latency.</p>
                </div>
              </div>
            </div>

            {/* Smart Contract */}
            <div className="group relative overflow-hidden rounded-xl border border-[#06B6D4]/20 bg-[#05070d]/60 p-3 backdrop-blur-[3px] transition-all duration-300 hover:border-[#7C3AED]/50 hover:bg-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-[#7C3AED]/10 p-2 text-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                  <Trophy className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#7C3AED]">Winner Gets Paid</h4>
                  <p className="text-[10px] text-gray-400 leading-tight">Automatic payouts on-chain with verification on solscan.io</p>
                </div>
              </div>
            </div>

            {/* Practise Mode */}
            <div className="group relative overflow-hidden rounded-xl border border-[#06B6D4]/20 bg-[#05070d]/60 p-3 backdrop-blur-[3px] transition-all duration-300 hover:border-[#00FFA3]/50 hover:bg-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-[#00FFA3]/10 p-2 text-[#00FFA3] shadow-[0_0_15px_rgba(0,255,163,0.2)]">
                  <Gamepad2 className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#00FFA3]">Practise Mode</h4>
                  <p className="text-[10px] text-gray-400 leading-tight">You can train without SOL stake against bot in practise mode.</p>
                </div>
              </div>
            </div>

            {/* Matchmaking */}
            <div className="group relative overflow-hidden rounded-xl border border-[#06B6D4]/20 bg-[#05070d]/60 p-3 backdrop-blur-[3px] transition-all duration-300 hover:border-[#A855F7]/50 hover:bg-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-[#7C3AED]/10 p-2 text-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                  <UsersRound className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#7C3AED]">Fair Matchmaking</h4>
                  <p className="text-[10px] text-gray-400 leading-tight">Stake your SOL to compete in 1v1 ranked or friend matches.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 flex items-center justify-center gap-4">
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            aria-label="X"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-[#00FFA3] transition hover:border-[#00FFA3]/60 hover:shadow-[0_0_20px_rgba(0,255,163,0.35)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M18.244 2H21l-6.573 7.51L22 22h-6.5l-4.15-5.64L6.204 22H3.448l7.063-8.083L2 2h6.662l3.75 5.104L18.244 2zm-.96 18.33h1.82L7.78 3.57H5.86l11.424 16.76z"
              />
            </svg>
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-[#06B6D4] transition hover:border-[#06B6D4]/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.264 18.264 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.249.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.083.083 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.04.077.077 0 0 0 .084-.026c.461-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.007-.128c.125-.094.251-.192.371-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.099.246.198.372.291a.077.077 0 0 1-.006.128 12.903 12.903 0 0 1-1.873.892.076.076 0 0 0-.04.105c.36.699.772 1.364 1.225 1.994a.076.076 0 0 0 .084.026 19.873 19.873 0 0 0 6.002-3.04.077.077 0 0 0 .031-.055c.5-5.177-.838-9.673-3.548-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.175 1.095 2.156 2.418 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.095 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z"
              />
            </svg>
          </a>
          <a
            href="https://www.tiktok.com"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-[#7C3AED] transition hover:border-[#7C3AED]/60 hover:shadow-[0_0_20px_rgba(124,58,237,0.35)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.41 7.588a6.93 6.93 0 0 1-4.012-1.278v7.078a5.97 5.97 0 1 1-5.988-5.97c.328 0 .646.027.956.077v3.287a2.68 2.68 0 1 0 1.783 2.523V2h3.249a6.92 6.92 0 0 0 4.012 3.338v2.25Z"
              />
            </svg>
          </a>
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noreferrer"
            aria-label="YouTube"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-[#00FFA3] transition hover:border-[#00FFA3]/60 hover:shadow-[0_0_20px_rgba(0,255,163,0.35)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3.02 3.02 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.57a3.02 3.02 0 0 0 2.12-2.13A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.6 15.5V8.5l6.4 3.5-6.4 3.5Z"
              />
            </svg>
          </a>
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
