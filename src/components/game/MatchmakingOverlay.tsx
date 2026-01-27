import { X, Swords, Wallet, ShieldAlert, Loader2, User, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'signing' | 'error';

interface MatchmakingOverlayProps {
  status: MatchmakingStatus;
  onCancel: () => void;
  opponentName?: string;
  errorMsg?: string;
}

export function MatchmakingOverlay({
  status,
  onCancel,
  opponentName = 'Unknown Player',
  errorMsg = 'Connection timed out',
}: MatchmakingOverlayProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (status === 'searching' || status === 'signing') {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
    setDots('');
  }, [status]);

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative max-w-md w-full">
        <div className="absolute -inset-4 bg-gradient-to-br from-[#00FFA3]/20 via-[#06B6D4]/20 to-[#7C3AED]/20 blur-2xl opacity-50"></div>

        <div
          className="relative bg-black/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl overflow-hidden min-h-[320px] flex flex-col items-center justify-center text-center p-8"
          style={{
            clipPath:
              'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
          }}
        >
          <div className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-[#00FFA3] to-transparent"></div>
          <div className="absolute top-0 left-0 w-px h-8 bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-8 h-px bg-gradient-to-l from-[#7C3AED] to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-px h-8 bg-gradient-to-t from-[#7C3AED] to-transparent"></div>

          {status === 'searching' && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 rounded-lg transition-all z-10 group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
            </button>
          )}

          {status === 'searching' && (
            <div className="animate-in zoom-in duration-300 w-full flex flex-col items-center">
              <div className="relative inline-flex items-center justify-center mb-8">
                <div
                  className="absolute w-32 h-32 border border-[#06B6D4]/20 rounded-full animate-ping"
                  style={{ animationDuration: '3s' }}
                ></div>
                <div
                  className="absolute w-24 h-24 border border-[#06B6D4]/40 rounded-full animate-ping"
                  style={{ animationDelay: '0.5s', animationDuration: '3s' }}
                ></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-[#06B6D4]/20 to-[#00FFA3]/20 rounded-full border border-[#06B6D4]/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Wifi className="w-10 h-10 text-[#06B6D4] animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl text-white font-bold mb-2">Finding Match</h2>
              <p className="text-gray-400 text-sm">Scanning global lobby for opponents{dots}</p>

              <div className="mt-8 mx-auto w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#06B6D4] to-[#00FFA3] w-1/3 animate-[shimmer_1.5s_infinite] translate-x-[-100%]"></div>
              </div>
            </div>
          )}

          {status === 'found' && (
            <div className="animate-in zoom-in duration-300 w-full flex flex-col items-center">
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="absolute w-20 h-20 bg-[#00FFA3]/10 rounded-full animate-pulse"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-full border-2 border-[#00FFA3] flex items-center justify-center shadow-[0_0_30px_rgba(0,255,163,0.3)]">
                  <Swords className="w-10 h-10 text-[#00FFA3]" />
                </div>
              </div>

              <h2 className="text-2xl text-white font-bold mb-2 tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,255,163,0.5)]">
                Match Found!
              </h2>

              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl w-full max-w-xs mx-auto backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-[1px]">
                    <div className="w-full h-full bg-[#0B0F1A] rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Opponent</p>
                    <p className="text-white font-bold truncate">{opponentName}</p>
                  </div>
                </div>
              </div>

              <p className="text-[#00FFA3] text-sm mt-6 animate-pulse">Initializing Secure Session...</p>
            </div>
          )}

          {status === 'signing' && (
            <div className="animate-in zoom-in duration-300 w-full flex flex-col items-center">
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="absolute w-32 h-32 border-2 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin"></div>
                <div
                  className="absolute w-24 h-24 border-2 border-[#06B6D4]/20 border-b-[#06B6D4] rounded-full animate-spin"
                  style={{ animationDirection: 'reverse' }}
                ></div>

                <div className="relative w-20 h-20 bg-gradient-to-br from-[#7C3AED]/20 to-[#0B0F1A] rounded-2xl border border-[#7C3AED]/50 flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-[#7C3AED]" />
                </div>

                <div className="absolute -top-2 -right-2 bg-[#7C3AED] text-[#0B0F1A] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  REQ
                </div>
              </div>

              <h2 className="text-2xl text-white font-bold mb-2">Sign Transaction</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                Please approve the stake request to enter the arena{dots}
              </p>

              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-lg mx-auto">
                <Loader2 className="w-4 h-4 text-[#7C3AED] animate-spin" />
                <span className="text-sm text-[#7C3AED]">Waiting for wallet...</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-in zoom-in duration-300 w-full flex flex-col items-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute w-24 h-24 bg-red-500/20 rounded-full animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-red-500/30 to-[#0B0F1A] rounded-full border-2 border-red-500 flex items-center justify-center">
                  <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
              </div>

              <h2 className="text-xl text-white font-bold mb-2">Matchmaking Failed</h2>
              <p className="text-red-400 text-sm mb-8 max-w-xs">{errorMsg}</p>

              <button
                onClick={onCancel}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all hover:border-red-500/50"
              >
                Close & Return to Lobby
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
