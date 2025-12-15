import { motion } from 'motion/react';
import { Trophy, Clock, Home, RotateCcw, Coins, X, Share2 } from 'lucide-react';
import { MAX_ROUNDS } from '../../features/arena/constants';
import { useEffect, useRef, useState } from 'react';
import { recordMatchCompletion, getDailyChallengeInfo } from '../../utils/dailyChallenge';
import { addMatchToHistory } from '../../utils/matchHistory';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../features/auth/hooks/useAuth';

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
  const hasRecordedRef = useRef(false);
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
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    const syncMatchResult = async () => {
      const matchResult: 'win' | 'loss' = playerWon ? 'win' : 'loss';
      const profit = playerWon ? netProfit : -stakeAmount;

      if (matchType === 'ranked') {
        const token =
          typeof localStorage !== 'undefined'
            ? localStorage.getItem('auth_token')
            : null;

        try {
          const response = await fetch(`${API_BASE_URL}/api/user/game/end`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              result: matchResult,
              score: Math.max(playerScore, 0) * 10,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to sync ranked stats');
          }
        } catch (error) {
          console.error('Failed to sync ranked stats', error);
          toast.error('Could not update ranked stats', {
            description: 'Please try again once your connection is stable.',
          });
        }
      }

      addMatchToHistory({
        matchType,
        result: matchResult,
        stakeAmount,
        profit,
        playerScore,
        opponentScore,
      });

      if (matchType === 'ranked' || matchType === 'friend') {
        const result = recordMatchCompletion();
        setChallengeUpdate(result);

        if (result.dailyCompleted) {
          if (result.weeklyBonusEarned) {
            toast.success(
              `🎉 Daily Challenge Complete! +${result.rewardEarned} RP (including +${result.weeklyBonus} Weekly Bonus!)`,
              {
                description: `You're on a ${result.newStreak}-day streak!`,
                duration: 5000,
              }
            );
          } else {
            toast.success(
              `✅ Daily Challenge Complete! +${result.rewardEarned} RP`,
              {
                description: result.streakIncreased
                  ? `${result.newStreak}-day streak!`
                  : 'Keep it up!',
                duration: 4000,
              }
            );
          }
        } else if (result.newProgress > 0) {
          const info = getDailyChallengeInfo();
          toast.info(
            `🎮 Match counted! ${info.matchesRemaining} more for daily challenge`,
            {
              description: `${info.matchesCompleted}/${info.matchesTarget} matches complete`,
              duration: 3000,
            }
          );
        }
      }
    };

    void syncMatchResult();
  }, [playerScore, opponentScore, stakeAmount, matchType, playerWon]);

  // Calculate average reaction time (exclude null values)
  const validPlayerTimes = playerTimes.filter((t): t is number => t !== null && t < 999999);
  const avgPlayerTime = validPlayerTimes.length > 0
    ? Math.round(validPlayerTimes.reduce((a, b) => a + b, 0) / validPlayerTimes.length)
    : 0;

  const handleShare = async () => {
    try {
      const shareText = `I ${playerWon ? 'won' : 'lost'} ${playerScore}-${opponentScore} in Reflex Arena with a ${avgPlayerTime}ms average reaction time!`;
      const shareData = {
        title: 'Reflex Arena Result',
        text: shareText,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      };

      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} Play here: ${shareData.url ?? ''}`.trim());
        toast.success('Result copied! Share it with your friends.');
      }
    } catch (error) {
      console.error('Error sharing result', error);
      toast.error('Unable to share your result right now.');
    }
  };

  const handlePlayAgain = () => {
    // Avoid instantly starting a new ranked/friend match; send players back to queue
    if (matchType === 'bot') {
      onPlayAgain();
    } else {
      onBackToMenu();
    }
  };

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

          <div className="relative bg-gradient-to-br from-black/90 to-[#0B0F1A]/90 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-5">
              {playerWon ? (
                <>
                  <div className="mb-3 relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] blur-xl opacity-60 rounded-full animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] p-4 sm:p-5 rounded-full shadow-2xl">
                      <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-[#0B0F1A]" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl mb-1 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] bg-clip-text text-transparent">
                    Victory!
                  </h2>
                  <p className="text-gray-400">You dominated the arena</p>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="bg-red-500/20 p-4 sm:p-5 rounded-full inline-block border-4 border-red-500/30">
                      <X className="w-10 h-10 sm:w-14 sm:h-14 text-red-400" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl text-red-400 mb-1">Defeat</h2>
                  <p className="text-gray-400">Better luck next time</p>
                </>
              )}
            </div>

            {/* SOL Earnings/Loss - Only for ranked matches */}
            {isRanked && (
              <div className={`mb-5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border ${
                playerWon
                  ? 'bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 border-[#00FFA3]/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <Coins className={`w-5 h-5 ${playerWon ? 'text-[#00FFA3]' : 'text-red-400'}`} />
                    <div className="leading-snug">
                      <p className="text-[10px] sm:text-xs text-gray-400">
                        {playerWon ? 'You won' : 'You lost'}
                      </p>
                      <p className={`text-base sm:text-lg ${
                        playerWon
                          ? 'bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] bg-clip-text text-transparent'
                          : 'text-red-400'
                      }`}>
                        {playerWon ? '+' : '-'}{playerWon ? netProfit.toFixed(2) : stakeAmount.toFixed(2)} SOL
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] sm:text-xs text-gray-500 leading-snug">
                    {playerWon ? (
                      <>
                        <div>Prize: {winnerPayout.toFixed(2)} SOL</div>
                        <div>Stake: -{stakeAmount.toFixed(2)} SOL</div>
                      </>
                    ) : (
                      <>
                        <div>Total Pot: {totalPot.toFixed(2)} SOL</div>
                        <div>Stake Lost: -{stakeAmount.toFixed(2)} SOL</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Score */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-5">
              <div className="text-center mb-3">
                <p className="text-sm text-gray-400 mb-2">Final Score</p>
                <div className="flex items-center justify-center gap-4">
                  <div className={`text-xl sm:text-2xl ${playerWon ? 'text-[#00FFA3]' : 'text-white'}`}>
                    {playerScore}
                  </div>
                  <div className="text-lg sm:text-xl text-gray-600">-</div>
                  <div className={`text-xl sm:text-2xl ${!playerWon ? 'text-red-400' : 'text-white'}`}>
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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-5">
              <h3 className="text-sm text-gray-400 mb-3">Your Statistics</h3>

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
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handlePlayAgain}
                className="w-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A] py-2.5 sm:py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl flex items-center justify-center gap-2.5"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Play Again</span>
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <button
                  onClick={handleShare}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 text-white py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Share Result</span>
                </button>

                <button
                  onClick={onBackToMenu}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 text-white py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Back to Lobby</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}