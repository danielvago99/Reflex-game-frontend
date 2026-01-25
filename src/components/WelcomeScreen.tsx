import { Zap, Target, Timer, Trophy, Wallet, Key } from 'lucide-react';
import { FuturisticBackground } from './FuturisticBackground';

interface WelcomeScreenProps {
  onNavigate: (screen: string) => void;
  onWalletConnect?: (
    address: string,
    provider: string,
    signMessage?: (message: string) => Promise<Uint8Array>
  ) => void;
}

export function WelcomeScreen({ onNavigate, onWalletConnect }: WelcomeScreenProps) {
  const handleConnectWallet = () => {
    if (onWalletConnect) {
      onWalletConnect('DemoWalletPublicKey123456789', 'Phantom');
      return;
    }

    onNavigate('dashboard');
  };

  return (
    <div className="h-screen-dvh bg-gradient-to-br from-[#05070f] via-[#0b1020] to-[#1a0d2c] flex flex-col items-center justify-center px-4 py-6 sm:px-8 sm:py-10 relative overflow-hidden">
      <FuturisticBackground />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[440px] sm:max-w-lg">
        {/* Logo */}
        <div className="mb-5 sm:mb-7 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3] to-[#7C3AED] blur-2xl opacity-60 rounded-full"></div>
          <div className="relative bg-[#0c1224] border border-white/10 p-4 sm:p-5 rounded-[28px] shadow-[0_0_30px_rgba(0,255,163,0.35)]">
            <div className="absolute inset-0 rounded-[28px] border border-[#00FFA3]/40" />
            <div className="relative bg-gradient-to-br from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] p-3 sm:p-4 rounded-[20px]">
              <Zap className="w-12 sm:w-14 h-12 sm:h-14 text-[#0B0F1A]" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl mb-2 bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] bg-clip-text text-transparent tracking-[0.2em]">
          REFLEX
        </h1>
        <p className="text-base sm:text-lg text-gray-300 mb-4 text-center">
          Earn more by reacting faster on Solana
        </p>
        
        {/* Info card */}
        <div className="relative mb-6 w-full">
          <div
            className="absolute -inset-[1px] bg-gradient-to-r from-[#00FFA3]/40 via-[#06B6D4]/30 to-[#7C3AED]/40 blur-sm"
            style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
          ></div>

          <div
            className="relative bg-[#0c1224]/80 backdrop-blur-lg border border-white/10 shadow-[0_0_30px_rgba(124,58,237,0.25)] overflow-hidden"
            style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>
            <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent"></div>
            <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-[#00FFA3]/60"></div>
            <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-[#06B6D4]/60"></div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#7C3AED] blur-lg opacity-50 rounded-2xl"></div>
                  <div className="relative w-12 h-12 rounded-2xl bg-[#121a33] border border-[#00FFA3]/40 flex items-center justify-center text-lg font-semibold text-white">
                    R
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-white">Mobil 4</p>
                  <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse"></span>
                    Online
                  </div>
                </div>
                <span className="ml-auto text-xs text-purple-200">8 Wins</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <Zap className="w-4 h-4" />
                  Wallet Balance
                </div>
                <p className="mt-2 text-2xl font-semibold text-[#00FFA3]">0.0000 SOL</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/80">
                  <div className="rounded-xl border border-white/10 bg-[#0f1830]/70 px-3 py-2 text-center">
                    Deposit
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0f1830]/70 px-3 py-2 text-center">
                    Withdraw
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 w-full">
          <div className="bg-white/5 backdrop-blur-lg border border-[#00FFA3]/30 rounded-2xl p-3 flex flex-col items-center gap-2">
            <Target className="w-6 h-6 text-[#00FFA3]" strokeWidth={2} />
            <span className="text-xs text-gray-300">Quick Reflexes</span>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-[#06B6D4]/30 rounded-2xl p-3 flex flex-col items-center gap-2">
            <Timer className="w-6 h-6 text-[#06B6D4]" strokeWidth={2} />
            <span className="text-xs text-gray-300">Real-time</span>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-[#7C3AED]/30 rounded-2xl p-3 flex flex-col items-center gap-2">
            <Trophy className="w-6 h-6 text-[#7C3AED]" strokeWidth={2} />
            <span className="text-xs text-gray-300">Earn SOL</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={handleConnectWallet}
            className="w-full bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] hover:shadow-[0_0_30px_rgba(0,255,163,0.45)] text-[#0B0F1A] py-3 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
          </button>

          <button
            onClick={() => onNavigate('create-wallet')}
            className="w-full bg-white/5 backdrop-blur-lg border border-[#7C3AED]/40 hover:bg-white/10 hover:border-[#7C3AED]/70 hover:shadow-[0_0_24px_rgba(124,58,237,0.4)] text-white py-3 rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            <span>Create Wallet</span>
          </button>

          <button
            onClick={() => onNavigate('unlock-wallet')}
            className="w-full border border-[#00FFA3]/40 bg-[#0f1830]/70 text-[#00FFA3] hover:text-[#06B6D4] hover:border-[#06B6D4]/60 py-2.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>Unlock Existing Wallet</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center gap-2 text-gray-500 text-sm">
          <div className="w-2 h-2 bg-[#00FFA3] rounded-full animate-pulse"></div>
          <span>Powered by Solana</span>
        </div>
      </div>
    </div>
  );
}
