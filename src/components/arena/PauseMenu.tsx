import { Play, LogOut, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
  isRanked?: boolean;
  stakeAmount?: number;
  onAutoResume?: () => void;
  pausesUsed?: number;
  maxPauses?: number;
}

export function PauseMenu({ 
  onResume, 
  onQuit, 
  isRanked = false, 
  stakeAmount = 0, 
  onAutoResume,
  pausesUsed = 0,
  maxPauses = 3
}: PauseMenuProps) {
  const hasStake = isRanked && stakeAmount > 0;
  const isPauseLimited = isRanked || stakeAmount > 0;
  const [timeRemaining, setTimeRemaining] = useState(10);
  const pausesRemaining = maxPauses - pausesUsed;

  // Auto-resume countdown for ranked/friend matches
  useEffect(() => {
    if (!isPauseLimited) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onAutoResume) {
            onAutoResume();
          } else {
            onResume();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPauseLimited, onResume, onAutoResume]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm sm:backdrop-blur-lg"
      style={{ 
        paddingBottom: 'var(--safe-area-bottom)',
      }}
    >
      {/* Mobile: Bottom sheet, Desktop: Modal */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full sm:max-w-md sm:mx-4"
      >
        {/* Lite glow - mobile performance */}
        <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-cyan-500/10 sm:from-cyan-500/20 via-purple-500/10 sm:via-purple-500/20 to-pink-500/10 sm:to-pink-500/20 rounded-t-2xl sm:rounded-3xl blur-lg sm:blur-xl -z-10"></div>
        
        {/* Menu container */}
        <div className="relative bg-black/80 sm:bg-black/70 border-t-2 sm:border-2 border-white/20 rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {/* Drag handle - mobile only */}
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 max-h-[85vh] overflow-y-auto">
            {/* Pause icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 blur-md sm:blur-lg opacity-40"></div>
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-6 sm:w-2 sm:h-8 bg-white rounded-full"></div>
                    <div className="w-1.5 h-6 sm:w-2 sm:h-8 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl text-center mb-1 sm:mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Game Paused
            </h2>
            <p className="text-center text-gray-400 mb-4 sm:mb-6 text-sm">
              Take a break or return to the lobby
            </p>

            {/* Pause counter for ranked/friend matches */}
            {isPauseLimited && (
              <div className="mb-4 sm:mb-6 flex items-center justify-center gap-2">
                <span className="text-gray-400 text-xs sm:text-sm">Pauses:</span>
                <div className="flex gap-1">
                  {Array.from({ length: maxPauses }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i < pausesRemaining
                          ? 'bg-gradient-to-r from-cyan-400 to-purple-400 shadow-md shadow-cyan-500/30'
                          : 'bg-gray-600/50'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs sm:text-sm tabular-nums ${
                  pausesRemaining === 0 ? 'text-red-400' : 
                  pausesRemaining === 1 ? 'text-orange-400' : 
                  'text-cyan-400'
                }`}>
                  {pausesRemaining}/{maxPauses}
                </span>
              </div>
            )}

            {/* Auto-resume timer for ranked/friend matches */}
            {isPauseLimited && (
              <div className="mb-4 sm:mb-6 relative">
                {/* Lite glow */}
                <div className="absolute -inset-px bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-lg sm:rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${timeRemaining <= 3 ? 'text-red-400 animate-pulse' : 'text-orange-400'}`} />
                    <div className="flex flex-col items-center">
                      <div className={`text-2xl sm:text-3xl ${timeRemaining <= 3 ? 'text-red-400 animate-pulse' : 'text-orange-400'} tabular-nums leading-none`}>
                        {timeRemaining}
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">seconds</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="relative h-1.5 sm:h-2 bg-black/30 rounded-full overflow-hidden mb-1.5 sm:mb-2">
                    <motion.div
                      className={`h-full ${timeRemaining <= 3 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-orange-500 to-yellow-400'}`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${(timeRemaining / 10) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <p className={`text-center text-xs ${timeRemaining <= 3 ? 'text-red-400' : 'text-orange-400'}`}>
                    Auto-resuming match...
                  </p>
                </div>
              </div>
            )}

            {/* Warning if stakes involved */}
            {hasStake && (
              <div className="mb-4 sm:mb-6 bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-xs sm:text-sm mb-0.5 sm:mb-1">
                      Quitting will forfeit your {stakeAmount} SOL stake!
                    </p>
                    <p className="text-gray-400 text-[10px] sm:text-xs">
                      Your opponent will win the match automatically
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2 sm:space-y-3">
              {/* Resume button */}
              <button
                onClick={onResume}
                className="group relative w-full px-6 py-3.5 sm:py-4 rounded-xl overflow-hidden transition-all active:scale-95 sm:hover:scale-105 min-h-[52px]"
                aria-label="Resume game"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-90 sm:group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 sm:group-hover:opacity-20 transition-opacity"></div>
                <div className="relative flex items-center justify-center gap-2 sm:gap-3 text-white text-base sm:text-lg font-bold">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" />
                  <span>Resume Game</span>
                </div>
              </button>

              {/* Forfeit button */}
              <button
                onClick={onQuit}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 hover:border-red-500 text-red-400 hover:text-red-300 h-12 transition-all rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95 sm:hover:scale-105"
                aria-label="Forfeit match"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{hasStake ? `Forfeit & Lose ${stakeAmount} SOL` : 'Forfeit Match'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
