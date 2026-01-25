import { Trophy, Zap, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface RoundResultModalProps {
  result: 'win' | 'lose';
  playerReactionTime: number | null;
  opponentReactionTime: number | null;
  onNext: () => void;
  currentRound: number;
  totalRounds: number;
  isMatchOver: boolean;
  lossReason?: 'early-click' | 'no-reaction' | 'slower' | null;
}

export function RoundResultModal({
  result,
  playerReactionTime,
  opponentReactionTime,
  onNext,
  currentRound,
  totalRounds,
  isMatchOver,
  lossReason,
}: RoundResultModalProps) {
  const [countdown, setCountdown] = useState(5);
  const isWin = result === 'win';
  
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = setTimeout(() => {
      onNext();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [onNext]);

  const resultConfig = {
    win: {
      title: 'ROUND WIN!',
      color: 'from-cyan-400 to-blue-400',
      glow: 'from-cyan-500 to-blue-500',
      icon: Trophy,
      message: 'Lightning fast! ⚡',
    },
    lose: {
      title: 'ROUND LOST',
      color: 'from-pink-400 to-purple-400',
      glow: 'from-pink-500 to-purple-500',
      icon: Zap,
      message: 'Close one! Try again 💪',
    },
  };

  const config = resultConfig[result];
  const Icon = config.icon;

  let message = config.message;

  if (result === 'lose') {
    if (lossReason === 'early-click') {
      message = 'Round lost: you clicked before the target appeared.';
    } else if (lossReason === 'no-reaction') {
      message = 'Round lost: you did not react in time.';
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative max-w-lg w-full"
      >
        {/* Glow effect */}
        <div className={`absolute -inset-6 bg-gradient-to-r ${config.glow} rounded-3xl blur-3xl opacity-40 animate-pulse`}></div>
        
        {/* Modal container */}
        <div className="relative bg-black/60 backdrop-blur-2xl border-2 border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${config.glow} blur-2xl opacity-60`}></div>
              <div className={`relative w-24 h-24 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center`}>
                <Icon className="w-12 h-12 text-white" />
              </div>
            </motion.div>
          </div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-4xl md:text-5xl font-bold text-center mb-2 bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}
          >
            {config.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-gray-300 mb-8 text-lg"
          >
            {message}
          </motion.p>

          {/* Reaction times */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 mb-8"
          >
            {/* Player time */}
            <div className="relative">
              <div className={`absolute -inset-1 bg-gradient-to-r ${isWin ? 'from-cyan-500/30 to-blue-500/30' : 'from-white/10 to-white/10'} rounded-xl blur-sm`}></div>
              <div className="relative glass rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isWin ? 'bg-cyan-400' : 'bg-gray-400'}`}></div>
                    <span className="text-gray-300 font-semibold">You</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isWin ? 'text-cyan-400' : 'text-gray-400'}`} />
                    <span className={`text-2xl font-bold font-mono ${isWin ? 'text-cyan-400' : 'text-white'}`}>
                      {playerReactionTime}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Opponent time */}
            <div className="relative">
              <div className={`absolute -inset-1 bg-gradient-to-r ${!isWin ? 'from-pink-500/30 to-purple-500/30' : 'from-white/10 to-white/10'} rounded-xl blur-sm`}></div>
              <div className="relative glass rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${!isWin ? 'bg-pink-400' : 'bg-gray-400'}`}></div>
                    <span className="text-gray-300 font-semibold">Opponent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${!isWin ? 'text-pink-400' : 'text-gray-400'}`} />
                    <span className={`text-2xl font-bold font-mono ${!isWin ? 'text-pink-400' : 'text-white'}`}>
                      {opponentReactionTime}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time difference */}
            {playerReactionTime && opponentReactionTime && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-400">
                  Difference: <span className={`font-mono font-bold ${isWin ? 'text-cyan-400' : 'text-pink-400'}`}>
                    {Math.abs(playerReactionTime - opponentReactionTime)}ms
                  </span>
                </span>
              </div>
            )}
          </motion.div>

          {/* Countdown message instead of button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative w-full px-6 py-4 rounded-xl overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${config.glow} opacity-30`}></div>
            <div className="relative flex items-center justify-center gap-3 text-white text-lg">
              <span className="text-gray-300">
                {isMatchOver ? 'Results in' : 'Next round starts in'}{' '}
                <span className={`font-bold font-mono text-2xl bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                  {countdown}
                </span>
                <span className="text-gray-400"> {countdown === 1 ? 'second' : 'seconds'}</span>
              </span>
            </div>
          </motion.div>

          {/* Round progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <span className="text-sm text-gray-400 font-mono">
              Round {currentRound} of {totalRounds}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
