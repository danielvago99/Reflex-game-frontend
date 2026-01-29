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
        <p className="text-lg xs:text-xl text-gray-400 mb-2 text-center px-2">Earn More by Reacting Faster on Solana</p>
        
        {/* Description - Futuristic Panel */}
        <div className="relative mb-8 max-w-sm mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA3]/30 via-[#06B6D4]/30 to-[#7C3AED]/30 blur-sm" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}></div>
          
          <div className="relative backdrop-blur-[3px] border border-white/10 shadow-xl overflow-hidden" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>
            <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent"></div>
            
            {/* Corner indicators */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#00FFA3]/50"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#06B6D4]/50"></div>
            
            <div className="p-6">
              <p className="text-gray-300 text-center leading-relaxed">
                Compete worldwide or challenge friends in real-time reflex battles to win SOL. 
              </p>
            </div>
          </div>
        </div>

        {/* Game features mini preview */}
        <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm mx-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-[#00FFA3]/20 rounded-xl p-3 flex flex-col items-center gap-2">
            <Target className="w-6 h-6 text-[#00FFA3]" strokeWidth={2} />
            <span className="text-xs text-gray-400">Quick Reflexes</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-[#06B6D4]/20 rounded-xl p-3 flex flex-col items-center gap-2">
            <Timer className="w-6 h-6 text-[#06B6D4]" strokeWidth={2} />
            <span className="text-xs text-gray-400">Real-time</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-[#7C3AED]/20 rounded-xl p-3 flex flex-col items-center gap-2">
            <Trophy className="w-6 h-6 text-[#7C3AED]" strokeWidth={2} />
            <span className="text-xs text-gray-400">Earn SOL</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3 max-w-xs mx-auto">
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting || isSigning}
            className="w-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A] py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
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
            className="w-full bg-white/10 backdrop-blur-sm border border-[#00FFA3]/30 hover:bg-white/10 hover:border-[#00FFA3]/60 hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] text-white py-3 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            <span>Create Wallet</span>
          </button>

          <button
            onClick={() => onNavigate('unlock-wallet')}
            className="w-full text-[#00FFA3] hover:text-[#06B6D4] py-2 text-center text-sm transition-all flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>Unlock Existing Wallet</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center gap-2 text-gray-500 text-sm">
          <div className="w-2 h-2 bg-[#00FFA3] rounded-full animate-pulse"></div>
          <span>Powered by Community</span>
        </div>
      </div>

      {isWalletModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#05070d]/80 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md">
            <div
              className="absolute -inset-1 bg-gradient-to-r from-[#7C3AED]/20 to-[#00FFA3]/20 blur-sm"
              style={{
                clipPath:
                  'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
              }}
            ></div>

            <div
              className="relative border border-white/10 bg-white/10 backdrop-blur-sm shadow-xl overflow-hidden pb-5 pt-5"
              style={{
                clipPath:
                  'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>
              <div className="absolute top-2 left-2 h-3 w-3 border-t border-l border-[#7C3AED]/50"></div>
              <div className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-[#00FFA3]/50"></div>

              <div className="flex items-start justify-between px-6 pt-8">
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

              <div className="space-y-3 px-6 pb-6 pt-5">
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
