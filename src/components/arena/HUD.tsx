import { Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface HUDProps {
  player: { name: string; avatar: string };
  opponent: { name: string; avatar: string };
  playerScore: number;
  opponentScore: number;
  currentRound: number;
  totalRounds: number;
  stakeAmount?: number;
}

export function HUD({
  player,
  opponent,
  playerScore,
  opponentScore,
  currentRound,
  totalRounds,
  stakeAmount = 0,
}: HUDProps) {
  return (
    <div 
      className="w-full px-3 py-2 sm:p-4 md:p-6" 
      style={{ 
        paddingTop: 'max(0.5rem, var(--safe-area-top))',
      }}
    >
      {/* Compact single-bar HUD for mobile */}
      <div className="max-w-6xl mx-auto">
        {/* Mobile: ultra-compact bar */}
        <div className="sm:hidden">
          <div className="relative bg-black/60 border border-white/20 rounded-lg px-2 py-1.5">
            {/* Subtle glow - mobile lite */}
            <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/20 to-pink-500/20 rounded-lg -z-10"></div>
            
            <div className="flex items-center justify-between gap-2">
              {/* Player */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-7 h-7 rounded-full ring-1 ring-cyan-400/50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white truncate leading-tight">{player.name}</p>
                </div>
              </div>

              {/* Center - Score */}
              <div className="flex items-center gap-1.5 px-2">
                <motion.div
                  key={`player-score-${playerScore}`}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-lg font-bold text-cyan-400 font-mono leading-none"
                >
                  {playerScore}
                </motion.div>
                <div className="text-sm text-gray-500 leading-none">:</div>
                <motion.div
                  key={`opponent-score-${opponentScore}`}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-lg font-bold text-pink-400 font-mono leading-none"
                >
                  {opponentScore}
                </motion.div>
              </div>

              {/* Opponent */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[11px] text-white truncate leading-tight">{opponent.name}</p>
                </div>
                <img
                  src={opponent.avatar}
                  alt={opponent.name}
                  className="w-7 h-7 rounded-full ring-1 ring-pink-400/50"
                />
              </div>
            </div>
            
            {/* Round indicator - bottom mini bar */}
            <div className="mt-1 pt-1 border-t border-white/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-400 font-mono">
                  R{currentRound}/{totalRounds}
                </span>
                <div className="flex-1 mx-2 h-1 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300"
                    style={{ width: `${(currentRound / totalRounds) * 100}%` }}
                  ></div>
                </div>
                {stakeAmount > 0 && (
                  <span className="text-[10px] font-semibold text-[#00FFA3]">◎ {stakeAmount.toFixed(3)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tablet/Desktop: regular HUD */}
        <div className="hidden sm:block">
          <div className="relative">
            {/* Lighter glow on tablet, full on desktop */}
            <div className="absolute -inset-0.5 md:-inset-1 bg-gradient-to-r from-cyan-500/20 md:from-cyan-500/30 via-purple-500/20 md:via-purple-500/30 to-pink-500/20 md:to-pink-500/30 rounded-xl blur-sm md:blur-md"></div>
            
            <div className="relative bg-black/50 md:bg-black/40 border border-white/10 rounded-xl p-3 md:p-4 lg:p-6">
              <div className="grid grid-cols-3 gap-3 md:gap-6 lg:gap-8 items-center">
                {/* Player */}
                <div className="flex items-center gap-2 md:gap-3">
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded-full ring-1 md:ring-2 ring-cyan-400"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base text-white truncate">{player.name}</p>
                    <div className="flex items-center gap-1 text-cyan-400">
                      <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm font-mono">{playerScore}</span>
                    </div>
                  </div>
                </div>

                {/* Center - Score and Round */}
                <div className="text-center">
                  {/* Score */}
                  <div className="flex items-center justify-center gap-2 md:gap-4 lg:gap-6 mb-1 md:mb-2">
                    <motion.div
                      key={`player-score-${playerScore}`}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl md:text-3xl lg:text-5xl font-bold text-cyan-400 font-mono"
                    >
                      {playerScore}
                    </motion.div>
                    <div className="text-xl md:text-2xl lg:text-4xl text-gray-500 font-bold">:</div>
                    <motion.div
                      key={`opponent-score-${opponentScore}`}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl md:text-3xl lg:text-5xl font-bold text-pink-400 font-mono"
                    >
                      {opponentScore}
                    </motion.div>
                  </div>

                  {/* Round indicator */}
                  <div className="inline-flex items-center gap-1.5 bg-white/5 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-white/10">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] md:text-xs lg:text-sm text-gray-300 font-mono">
                      ROUND {currentRound}/{totalRounds}
                    </span>
                    {stakeAmount > 0 && (
                      <span className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#00FFA3]">
                        ◎ {stakeAmount.toFixed(3)} SOL
                      </span>
                    )}
                  </div>
                </div>

                {/* Opponent */}
                <div className="flex items-center gap-2 md:gap-3 justify-end">
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm md:text-base text-white truncate">{opponent.name}</p>
                    <div className="flex items-center gap-1 text-pink-400 justify-end">
                      <span className="text-xs md:text-sm font-mono">{opponentScore}</span>
                      <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                  </div>
                  <img
                    src={opponent.avatar}
                    alt={opponent.name}
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded-full ring-1 md:ring-2 ring-pink-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
