import { motion } from 'motion/react';
import { Target, Zap, Trophy, X } from 'lucide-react';
import { useEffect } from 'react';
import { ROUNDS_TO_WIN } from '../../features/arena/constants';
import { Fake3DShapePreview } from '../../components/ui/Fake3DShapePreview';

interface HowToPlayOverlayProps {
  targetShape: string;
  targetColor: string;
  onContinue: () => void;
}

export function HowToPlayOverlay({ targetShape, targetColor, onContinue }: HowToPlayOverlayProps) {
  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onContinue]);

  const getColorName = (color: string) => {
    const colorMap: Record<string, string> = {
      '#FF6B6B': 'Red',
      '#4ECDC4': 'Cyan',
      '#FFD93D': 'Yellow',
      '#A78BFA': 'Purple',
      '#34D399': 'Green',
      '#F472B6': 'Pink',
      '#FB923C': 'Orange',
      '#00FF00': 'Green',
      '#FF0000': 'Red',
      '#0000FF': 'Blue',
      '#FFFF00': 'Yellow',
      '#9333EA': 'Purple',
      '#06B6D4': 'Cyan',
      '#FF6B00': 'Orange',
      '#FF0099': 'Pink',
    };
    return colorMap[color] || 'Colored';
  };

  const getShapeName = (shape: string) => {
    const normalizedShape = shape.toLowerCase();
    const shapeMap: Record<string, string> = {
      square: 'Box',
      triangle: 'Pyramid',
    };

    if (shapeMap[normalizedShape]) {
      return shapeMap[normalizedShape];
    }

    return normalizedShape.charAt(0).toUpperCase() + normalizedShape.slice(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
    >
      {/* Centered modal */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-auto relative"
      >
        {/* Lite glow on mobile, fuller on desktop */}
        <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-cyan-500/10 sm:from-cyan-500/20 via-purple-500/10 sm:via-purple-500/20 to-pink-500/10 sm:to-pink-500/20 rounded-t-3xl sm:rounded-3xl blur-lg sm:blur-2xl -z-10"></div>

        {/* Content container */}
        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border-t-2 sm:border-2 border-white/20 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
          {/* Drag handle - mobile only */}
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 blur-md sm:blur-lg opacity-50"></div>
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border-2 border-white/20 flex items-center justify-center">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  How to Play
                </h2>
              </div>
              
              {/* Close button - visible on tablet+ */}
              <button
                onClick={onContinue}
                className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close tutorial"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <p className="text-center text-gray-400 text-sm mb-4 sm:mb-6">
              First to win {ROUNDS_TO_WIN} rounds takes the match!
            </p>

            {/* Instructions */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {/* Step 1 */}
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-0.5 text-sm sm:text-base">Watch for Target</h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-snug">
                    Shapes will spawn randomly on screen
                  </p>
                </div>
              </div>

              {/* Step 2 - Target Display */}
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-1 sm:mb-2 text-sm sm:text-base">Find Your Target</h3>
                  <div className="relative">
                    {/* Lite glow on mobile */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg blur-sm"></div>
                    <div className="relative bg-black/50 border border-white/20 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Fake3DShapePreview
                          shape={targetShape as 'circle' | 'square' | 'triangle'}
                          className="w-6 h-6"
                          color={targetColor}
                        />
                        <div className="text-left">
                          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Target</div>
                          <div className="text-sm sm:text-base text-white font-semibold leading-tight">
                            {getColorName(targetColor)} {getShapeName(targetShape)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-0.5 flex items-center gap-1.5 text-sm sm:text-base">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    React Fast!
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-snug">
                    Click the <span className="text-cyan-400 font-semibold">REACT</span> button when you see it
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-0.5 flex items-center gap-1.5 text-sm sm:text-base">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    Win the Round
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-snug">
                    Fastest reaction time wins the round!
                  </p>
                </div>
              </div>
            </div>

            {/* Continue button - Enhanced */}
            <motion.button
              onClick={onContinue}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative w-full px-6 py-4 sm:py-5 rounded-xl overflow-hidden transition-all min-h-[56px] sm:min-h-[64px]"
              aria-label="Start playing"
            >
              {/* Animated gradient background */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ backgroundSize: '200% 100%' }}
              ></motion.div>
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-xl"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.05, opacity: [0, 0.3, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              ></motion.div>
              
              {/* Button content */}
              <div className="relative flex items-center justify-center gap-2 sm:gap-3 text-white">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                </motion.div>
                <span className="text-lg sm:text-xl font-bold tracking-wide">
                  Ready to Play
                </span>
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                >
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                </motion.div>
              </div>
              
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'easeInOut',
                }}
                style={{ transform: 'skewX(-20deg)' }}
              ></motion.div>
            </motion.button>

            {/* Hint text */}
            <p className="text-center text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
              <span className="hidden sm:inline">Click the button or press </span>
              <span className="sm:hidden">Tap the button to </span>
              <span className="hidden sm:inline text-cyan-400">SPACE</span>
              <span className="hidden sm:inline"> to </span>
              start
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}