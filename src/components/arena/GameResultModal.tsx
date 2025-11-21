import { motion } from 'motion/react';
import { Trophy, Target, Clock, Home, RotateCcw, Coins, X } from 'lucide-react';
import { MAX_ROUNDS } from '../../features/arena/constants';
import { useEffect, useState } from 'react';
import { recordMatchCompletion, getDailyChallengeInfo } from '../../utils/dailyChallenge';
import { addMatchToHistory } from '../../utils/matchHistory';
import { toast } from 'sonner';

interface GameResultModalProps {
  playerScore: number;
  opponentScore: number;
  playerTimes: (number | null)[];
  opponentTimes: (number | null)[];
  isRanked: boolean;
  stakeAmount: number;
  matchType?: 'ranked' | 'friend' | 'bot'; // Add matchType prop
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameResultModal({
  playerScore,
  opponentScore,
  playerTimes,
  opponentTimes,
  isRanked,
  stakeAmount,
  matchType = 'bot', // Default to 'bot' if not provided
  onPlayAgain,
  onBackToMenu
}: GameResultModalProps) {
  const playerWon = playerScore > opponentScore;
  const totalPot = stakeAmount * 2;
  const platformFee = totalPot * 0.15;
  const winnerPayout = totalPot - platformFee;
  const netProfit = winnerPayout - stakeAmount;
  const [challengeUpdate, setChallengeUpdate] = useState<{
    newProgress: number;
    dailyCompleted: boolean;
    rewardEarned: number;
    streakIncreased: boolean;
    newStreak: number;
    weeklyBonusEarned: boolean;
    weeklyBonus: number;
  } | null>(null);

  // Record match completion for daily challenge and match history
  useEffect(() => {
    // Determine match result
    const matchResult: 'win' | 'loss' = playerWon ? 'win' : 'loss';
    
    // Calculate profit/loss
    const profit = playerWon ? netProfit : -stakeAmount;
    
    // Add to match history
    addMatchToHistory({
      matchType,
      result: matchResult,
      stakeAmount,
      profit,
      playerScore,
      opponentScore
    });
    
    // Only record daily challenge progress for ranked and friend matches
    if (matchType === 'ranked' || matchType === 'friend') {
      const result = recordMatchCompletion();
      setChallengeUpdate(result);

      // Show toast notifications for daily challenge progress
      if (result.dailyCompleted) {
        if (result.weeklyBonusEarned) {
          toast.success(
            `🎉 Daily Challenge Complete! +${result.rewardEarned} RP (including +${result.weeklyBonus} Weekly Bonus!)`,
            {
              description: `You're on a ${result.newStreak}-day streak!`,
              duration: 5000
            }
          );
        } else {
          toast.success(
            `✅ Daily Challenge Complete! +${result.rewardEarned} RP`,
            {
              description: result.streakIncreased ? `${result.newStreak}-day streak!` : 'Keep it up!',
              duration: 4000
            }
          );
        }
      } else if (result.newProgress > 0) {
        const info = getDailyChallengeInfo();
        toast.info(
          `🎮 Match counted! ${info.matchesRemaining} more for daily challenge`,
          {
            description: `${info.matchesCompleted}/${info.matchesTarget} matches complete`,
            duration: 3000
          }
        );
      }
    }
  }, [playerScore, opponentScore, stakeAmount, matchType, playerWon]);

  // Calculate average reaction time (exclude null values)
  const validPlayerTimes = playerTimes.filter((t): t is number => t !== null && t < 999999);
  const avgPlayerTime = validPlayerTimes.length > 0 
    ? Math.round(validPlayerTimes.reduce((a, b) => a + b, 0) / validPlayerTimes.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative max-w-lg w-full"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className={`absolute -inset-2 rounded-3xl blur-2xl ${
            playerWon 
              ? 'bg-gradient-to-r from-[#00FFA3]/40 to-[#06B6D4]/40'
              : 'bg-gradient-to-r from-red-500/40 to-red-600/40'
          } animate-pulse`}></div>

          <div className="relative bg-gradient-to-br from-black/90 to-[#0B0F1A]/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              {playerWon ? (
                <>
                  <div className="mb-4 relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] blur-xl opacity-60 rounded-full animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] p-6 rounded-full shadow-2xl">
                      <Trophy className="w-16 h-16 text-[#0B0F1A]" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h2 className="text-4xl mb-2 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] bg-clip-text text-transparent">
                    Victory!
                  </h2>
                  <p className="text-gray-400">You dominated the arena</p>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="bg-red-500/20 p-6 rounded-full inline-block border-4 border-red-500/30">
                      <X className="w-16 h-16 text-red-400" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h2 className="text-4xl text-red-400 mb-2">Defeat</h2>
                  <p className="text-gray-400">Better luck next time</p>
                </>
              )}
            </div>

            {/* SOL Earnings/Loss - Only for ranked matches */}
            {isRanked && (
              <div className={`mb-6 p-5 rounded-2xl border ${
                playerWon
                  ? 'bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 border-[#00FFA3]/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coins className={`w-6 h-6 ${playerWon ? 'text-[#00FFA3]' : 'text-red-400'}`} />
                    <div>
                      <p className="text-sm text-gray-400">
                        {playerWon ? 'You won' : 'You lost'}
                      </p>
                      <p className={`text-3xl ${
                        playerWon 
                          ? 'bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] bg-clip-text text-transparent'
                          : 'text-red-400'
                      }`}>
                        {playerWon ? '+' : '-'}{playerWon ? netProfit.toFixed(2) : stakeAmount.toFixed(2)} SOL
                      </p>
                    </div>
                  </div>
                  {playerWon && (
                    <div className="text-right text-xs text-gray-500">
                      <div>Prize: {winnerPayout.toFixed(2)} SOL</div>
                      <div>Stake: -{stakeAmount.toFixed(2)} SOL</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Score */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-400 mb-2">Final Score</p>
                <div className="flex items-center justify-center gap-4">
                  <div className={`text-3xl ${playerWon ? 'text-[#00FFA3]' : 'text-white'}`}>
                    {playerScore}
                  </div>
                  <div className="text-2xl text-gray-600">-</div>
                  <div className={`text-3xl ${!playerWon ? 'text-red-400' : 'text-white'}`}>
                    {opponentScore}
                  </div>
                </div>
              </div>

              {/* Round indicators */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: MAX_ROUNDS }, (_, round) => round).map((round) => (
                  <div
                    key={round}
                    className={`w-3 h-8 rounded-full ${
                      playerTimes[round] !== null && opponentTimes[round] !== null
                        ? playerTimes[round]! < opponentTimes[round]!
                          ? 'bg-gradient-to-t from-[#00FFA3] to-[#06B6D4]'
                          : 'bg-red-500'
                        : 'bg-white/10'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-6">
              <h3 className="text-sm text-gray-400 mb-4">Your Statistics</h3>
              
              <div className="space-y-4">
                {/* Avg Reaction Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#06B6D4]/20 p-2 rounded-lg">
                      <Clock className="w-4 h-4 text-[#06B6D4]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Avg Reaction</p>
                      <p className="text-white">{avgPlayerTime}ms</p>
                    </div>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#00FFA3]/20 p-2 rounded-lg">
                      <Target className="w-4 h-4 text-[#00FFA3]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Accuracy</p>
                      <p className="text-white">{validPlayerTimes.length}/{MAX_ROUNDS} rounds</p>
                    </div>
                  </div>
                  <div className="w-20 bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] h-1.5 rounded-full"
                      style={{ width: `${(validPlayerTimes.length / MAX_ROUNDS) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={onPlayAgain}
                className="w-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A] py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Play Again</span>
              </button>

              <button
                onClick={onBackToMenu}
                className="w-full bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 text-white py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Home className="w-5 h-5" />
                <span>Back to Lobby</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}