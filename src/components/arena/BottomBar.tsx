import { Pause, MousePointerClick } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomBarProps {
  onPause: () => void;
  onReact: () => void;
  reactionLog?: string[];
  isActive: boolean;
  reactionTime: number | null;
}

export function BottomBar({ onPause, onReact, reactionLog = [], isActive, reactionTime }: BottomBarProps) {
  return (
    <div 
      className="w-full px-3 py-2 sm:p-4 md:p-6"
      style={{ 
        paddingBottom: 'max(0.5rem, var(--safe-area-bottom))',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Mobile: bottom thumb-zone layout */}
        <div className="sm:hidden">
          <div className="relative bg-black/60 border border-white/20 rounded-xl p-2">
            {/* Subtle glow - mobile lite */}
            <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/20 to-pink-500/20 rounded-xl -z-10"></div>
            
            <div className="flex items-center gap-2">
              {/* Pause - top left thumb zone */}
              <button
                onClick={onPause}
                className="flex-shrink-0 bg-white/10 active:bg-white/20 border border-white/20 rounded-lg px-3 py-2.5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Pause game"
              >
                <Pause className="w-5 h-5 text-white" />
              </button>

              {/* Big Reaction Button - center thumb zone */}
              <button
                onClick={onReact}
                disabled={!isActive}
                className={`flex-1 rounded-lg px-4 py-3 min-h-[52px] transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 active:scale-95 shadow-lg shadow-cyan-500/30' 
                    : 'bg-gray-700 opacity-50 cursor-not-allowed'
                }`}
                aria-label={isActive ? 'React now' : 'Wait for target'}
              >
                <div className="flex items-center justify-center gap-2 text-white">
                  <MousePointerClick className="w-5 h-5" />
                  <div className="text-center">
                    <div className="text-base font-bold leading-tight">
                      REACT
                    </div>
                    {reactionTime !== null && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-cyan-200 leading-tight"
                      >
                        {reactionTime}ms
                      </motion.div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Tablet/Desktop: full layout with reaction log */}
        <div className="hidden sm:block">
          <div className="relative">
            {/* Lighter effects on tablet */}
            <div className="absolute -inset-0.5 md:-inset-1 bg-gradient-to-r from-cyan-500/15 md:from-cyan-500/20 via-purple-500/15 md:via-purple-500/20 to-pink-500/15 md:to-pink-500/20 rounded-xl blur-sm"></div>
            
            <div className="relative bg-black/50 md:bg-black/40 border border-white/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Big Reaction Button */}
                <div className="flex-1 flex justify-center">
                  <button
                    onClick={onReact}
                    disabled={!isActive}
                    className={`group relative px-8 py-4 md:px-12 md:py-6 rounded-xl overflow-hidden transition-all min-h-[52px] ${
                      isActive 
                        ? 'hover:scale-105 active:scale-95 cursor-pointer' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    aria-label={isActive ? 'React now' : 'Wait for target'}
                  >
                    <div className={`absolute inset-0 transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 group-hover:from-cyan-400 group-hover:via-purple-400 group-hover:to-pink-400'
                        : 'bg-gradient-to-r from-gray-600 to-gray-700'
                    }`}></div>
                    
                    {/* Glow effect when active - lite on tablet */}
                    {isActive && (
                      <div className="absolute -inset-0.5 md:-inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-md md:blur-lg opacity-40 md:opacity-50 group-hover:opacity-60 md:group-hover:opacity-75"></div>
                    )}
                    
                    <div className="relative flex items-center justify-center gap-2 md:gap-3 text-white">
                      <MousePointerClick className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
                      <div className="text-center sm:text-left">
                        <div className="text-lg md:text-xl lg:text-3xl font-bold">
                          REACT
                        </div>
                        {reactionTime !== null && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs md:text-sm text-cyan-200"
                          >
                            {reactionTime}ms
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Pause Button */}
                <button
                  onClick={onPause}
                  className="group relative px-4 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 min-h-[44px]"
                  aria-label="Pause game"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-1.5 md:gap-2 text-white font-semibold">
                    <Pause className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm lg:text-base">Pause</span>
                  </div>
                </button>

                {/* Reaction Log - desktop only */}
                <div className="hidden lg:block w-64">
                  <div className="space-y-1 min-h-[60px] text-xs text-gray-400">
                    {reactionLog.length > 0 ? (
                      reactionLog.slice(0, 3).map((log, index) => (
                        <motion.div
                          key={`${log}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1 - (index * 0.25), x: 0 }}
                          className="text-gray-300 font-mono truncate"
                        >
                          {log}
                        </motion.div>
                      ))
                    ) : (
                      <div className="italic opacity-50">
                        Waiting...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
