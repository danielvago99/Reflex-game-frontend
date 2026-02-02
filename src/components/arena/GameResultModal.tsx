import { motion } from 'motion/react';
import { Trophy, Clock, Home, RotateCcw, Coins, X, Share2, ShieldAlert } from 'lucide-react';
import { MAX_ROUNDS } from '../../features/arena/constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import { recordMatchCompletion, getDailyChallengeInfo } from '../../utils/dailyChallenge';
import { addMatchToHistory } from '../../utils/matchHistory';
import { toast } from 'sonner';
import { MATCH_HISTORY_UPDATED_EVENT } from '../../hooks/useMatchHistory';

interface GameResultModalProps {
  playerScore: number;
  opponentScore: number;
  playerTimes: (number | null)[];
  opponentTimes: (number | null)[];
  isRanked: boolean;
  stakeAmount: number;
  matchType?: 'ranked' | 'friend' | 'bot'; // Add matchType prop
  wasForfeit: boolean;
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
  wasForfeit,
  onPlayAgain,
  onBackToMenu
}: GameResultModalProps) {
  const playerWon = playerScore > opponentScore;
  const resultConfig = {
    win: {
      title: 'VICTORY',
      color: 'from-cyan-400 to-blue-400',
      glow: 'from-cyan-500 to-blue-500',
      accent: 'text-cyan-400',
      border: 'border-cyan-400/40',
      icon: Trophy,
      message: 'You dominated the match !',
    },
    lose: {
      title: 'DEFEAT',
      color: 'from-pink-400 to-purple-400',
      glow: 'from-pink-500 to-purple-500',
      accent: 'text-pink-400',
      border: 'border-pink-400/40',
      icon: X,
      message: 'Reset, refocus, and strike back !',
    },
  };
  const config = playerWon ? resultConfig.win : resultConfig.lose;
  const ResultIcon = config.icon;
  const totalPot = stakeAmount * 2;
  const platformFee = totalPot * 0.15;
  const winnerPayout = totalPot - platformFee;
  const netProfit = winnerPayout - stakeAmount;
  const earnings = playerWon ? netProfit : -stakeAmount;
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

      addMatchToHistory({
        matchType,
        result: matchResult,
        stakeAmount,
        profit,
        playerScore,
        opponentScore,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(MATCH_HISTORY_UPDATED_EVENT));
      }

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

  const handleReport = () => {
    toast.info('Report submitted. Our team will review the match.');
  };
  const showReportButton = isRanked || matchType === 'ranked';

  const coinParticles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: `coin-${index}`,
        left: `${Math.random() * 100}%`,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 1.5,
        size: 12 + Math.random() * 10
      })),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative max-w-2xl w-full"
      >
        <div className="relative">
          <div className={`absolute -inset-6 bg-gradient-to-r ${config.glow} rounded-3xl blur-3xl opacity-40 animate-pulse`}></div>

          <div className="relative overflow-hidden bg-black/60 backdrop-blur-2xl border-2 border-white/20 rounded-3xl p-5 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            {playerWon && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {coinParticles.map((coin) => (
                  <motion.span
                    key={coin.id}
                    className="absolute top-0 rounded-full bg-gradient-to-br from-[#FFD700] via-[#FDE047] to-[#F59E0B] shadow-[0_0_18px_rgba(253,224,71,0.6)]"
                    style={{
                      left: coin.left,
                      width: coin.size,
                      height: coin.size
                    }}
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 520, opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: coin.duration,
                      delay: coin.delay,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                ))}
              </div>
            )}

            <div className="relative z-10">
              <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div
                  className={`relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border ${config.border} shadow-[0_0_40px_rgba(56,189,248,0.25)]`}
                >
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-30`}></div>
                  <ResultIcon className={`relative w-8 h-8 sm:w-10 sm:h-10 ${config.accent}`} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Match Result</p>
                  <h2
                    className={`text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}
                  >
                    {config.title}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-400 mt-1">
                    {wasForfeit
                      ? playerWon
                        ? 'Opponent forfeited the match'
                        : 'You forfeited the match'
                      : config.message}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] mb-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Final Score</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${config.border} ${config.accent}`}
                    >
                      {playerWon ? 'Winner' : 'Runner Up'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-4 sm:gap-6 py-4">
                    <div className={`text-3xl sm:text-4xl font-semibold ${playerWon ? config.accent : 'text-white'}`}>
                      {playerScore}
                    </div>
                    <div className="text-xl sm:text-2xl text-gray-600">-</div>
                    <div className={`text-3xl sm:text-4xl font-semibold ${!playerWon ? config.accent : 'text-white'}`}>
                      {opponentScore}
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: MAX_ROUNDS }, (_, round) => round).map((round) => (
                      <div
                        key={round}
                        className={`w-3 h-8 rounded-full ${
                          playerTimes[round] !== null && opponentTimes[round] !== null
                            ? playerTimes[round]! < opponentTimes[round]!
                              ? 'bg-gradient-to-t from-cyan-400 to-blue-500'
                              : 'bg-gradient-to-t from-pink-500 to-purple-600'
                            : 'bg-white/10'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Match Stats</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                        <Coins className="w-3.5 h-3.5 text-[#FDE047]" />
                        Earnings
                      </div>
                      <p
                        className={`mt-2 text-lg font-semibold ${earnings >= 0 ? config.accent : 'text-pink-400'}`}
                      >
                        {earnings >= 0 ? '+' : '-'}
                        {Math.abs(earnings).toFixed(2)} SOL
                      </p>
                      {(isRanked || stakeAmount > 0) && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          Pot {totalPot.toFixed(2)} · Fee {platformFee.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                      <div className="text-xs text-gray-400">Final Score</div>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {playerScore}-{opponentScore}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {playerWon ? 'Dominant finish' : 'Close the gap'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                        Avg RT
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">{avgPlayerTime}ms</p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {avgPlayerTime > 0 ? 'Lightning reflexes' : 'No data'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-2">
                <button
                  onClick={onPlayAgain}
                  className={`bg-gradient-to-r ${config.color} hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] text-[#030712] py-3 sm:py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl flex items-center justify-center gap-2.5 font-semibold text-base`}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Play Again</span>
                </button>

                <button
                  onClick={handleShare}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 text-white py-3 sm:py-3.5 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Result</span>
                </button>

                <button
                  onClick={onBackToMenu}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 text-white py-3 sm:py-3.5 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to Lobby</span>
                </button>

                {showReportButton && (
                  <button
                    onClick={handleReport}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-[0_0_35px_rgba(239,68,68,0.5)] text-white py-3 sm:py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl flex items-center justify-center gap-2.5 font-semibold text-base"
>
                    <ShieldAlert className="w-5 h-5" />
                    <span>Report Opponent</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
