import { useEffect, useMemo, useRef, useState } from 'react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { Gamepad2, Key, ShieldCheck, Trophy, UsersRound, Wallet, X, Zap } from 'lucide-react';
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
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
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
        <p className="text-xs xs:text-xs text-gray-400 mb-2 text-center px-2">Compete worldwide in live 1v1 reflex match for SOL. React faster than your opponent and win the pot.</p>
        
        {/* Guaranteed Fair Play Section */}
        <div className="w-full max-w-sm mx-auto mb-8">
          
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
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#05070d]/60 p-3 backdrop-blur-[3px] transition-all duration-300 hover:border-[#00FFA3]/50 hover:bg-white/5">
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
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#05070d]/60 p-3 backdrop-blur-[3px] transition-all duration-300 hover:border-[#7C3AED]/50 hover:bg-white/5">
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
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#05070d]/60 p-3 backdrop-blur-[3px] transition-all duration-300 hover:border-[#00FFA3]/50 hover:bg-white/5">
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
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#05070d]/60 p-3 backdrop-blur-[3px] transition-all duration-300 hover:border-[#A855F7]/50 hover:bg-white/5">
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
          {/* Neon Header with Decorations */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {/* Left Decoration */}
            <div className="flex items-center gap-1 opacity-50">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#00FFA3]"></div>
              <div className="h-1 w-1 rounded-full bg-[#00FFA3] shadow-[0_0_5px_#00FFA3]"></div>
            </div>
            
            {/* Neon Text */}
            <span className="inline-block text-sm font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] drop-shadow-[0_0_10px_rgba(0,255,163,0.3)]">
              Click here to show demo
            </span>

            {/* Right Decoration */}
            <div className="flex items-center gap-1 opacity-50">
              <div className="h-1 w-1 rounded-full bg-[#7C3AED] shadow-[0_0_5px_#06B6D4]"></div>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#7C3AED]"></div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3 max-w-xs mx-auto">
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting || isSigning}
            className="w-full bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A] py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            <span>{statusLabel ?? 'Connect Wallet'}</span>
          </button>

          {statusLabel ? (
            <p className="text-center text-xs text-[#00FFA3] uppercase tracking-widest">{statusLabel}</p>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-xs text-red-200 shadow-[0_0_15px_rgba(248,113,113,0.25)]">
              {errorMessage}
            </div>
          ) : null}
          
          <button
            onClick={() => onNavigate('create-wallet')}
            className="w-full bg-white/10 backdrop-blur-sm border border-[#06B6D4]/30 hover:bg-white/10 hover:border-[#7C3AED]/60 hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] text-white py-3 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            <span>Create Wallet</span>
          </button>

          <button
            onClick={() => onNavigate('unlock-wallet')}
            className="w-full text-[#06B6D4] hover:text-[#7C3AED] py-2 text-center text-sm transition-all flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>Unlock Existing Wallet</span>
          </button>
        </div>
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
