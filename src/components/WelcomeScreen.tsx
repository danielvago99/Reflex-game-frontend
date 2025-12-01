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
    <div className="h-screen-dvh bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] flex flex-col items-center justify-center p-3 xs:p-4 sm:p-6 relative overflow-hidden">
      
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
        <h1 className="text-4xl xs:text-5xl mb-2 xs:mb-3 bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] bg-clip-text text-transparent">
          REFLEX
        </h1>
        <p className="text-lg xs:text-xl text-gray-400 mb-2 text-center px-2">The Fastest Way to Earn on Solana</p>
        
        {/* Description - Futuristic Panel */}
        <div className="relative mb-8 max-w-sm mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA3]/20 via-[#06B6D4]/20 to-[#7C3AED]/20 blur-sm" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}></div>
          
          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl overflow-hidden" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>
            <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent"></div>
            
            {/* Corner indicators */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#00FFA3]/50"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#06B6D4]/50"></div>
            
            <div className="p-6">
              <p className="text-gray-300 text-center leading-relaxed">
                Challenge players worldwide in real-time reflex duels.
                Win SOL, climb ranks, and build your streak.
              </p>
            </div>
          </div>
        </div>

        {/* Game features mini preview */}
        <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm mx-auto">
          <div className="bg-white/5 backdrop-blur-lg border border-[#00FFA3]/20 rounded-xl p-3 flex flex-col items-center gap-2">
            <Target className="w-6 h-6 text-[#00FFA3]" strokeWidth={2} />
            <span className="text-xs text-gray-400">Quick Reflexes</span>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-[#06B6D4]/20 rounded-xl p-3 flex flex-col items-center gap-2">
            <Timer className="w-6 h-6 text-[#06B6D4]" strokeWidth={2} />
            <span className="text-xs text-gray-400">Real-time</span>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-[#7C3AED]/20 rounded-xl p-3 flex flex-col items-center gap-2">
            <Trophy className="w-6 h-6 text-[#7C3AED]" strokeWidth={2} />
            <span className="text-xs text-gray-400">Earn SOL</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3 max-w-xs mx-auto">
          <button
            onClick={handleConnectWallet}
            className="w-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A] py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
          </button>
          
          <button
            onClick={() => onNavigate('create-wallet')}
            className="w-full bg-white/5 backdrop-blur-lg border border-[#00FFA3]/30 hover:bg-white/10 hover:border-[#00FFA3]/60 hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] text-white py-3 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
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
          <span>Powered by Solana</span>
        </div>
      </div>
    </div>
  );
}