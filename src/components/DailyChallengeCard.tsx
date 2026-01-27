import { Trophy, Flame, Zap, Target, TrendingUp, Clock, Gift, ChevronRight } from 'lucide-react';
import { Progress } from './ui/progress';

interface DailyChallengeCardProps {
  variant?: 'full' | 'compact' | 'banner';
  onClick?: () => void;
  matchesPlayed: number;
  matchesTarget?: number;
  currentStreak: number;
  isCompleted: boolean;
  timeLeft?: string;
}

const DAILY_REWARD = 10;
const WEEKLY_BONUS = 50;
const WEEKLY_STREAK_TARGET = 7;

const getTimeUntilReset = (): string => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

export function DailyChallengeCard({
  variant = 'banner',
  onClick,
  matchesPlayed,
  matchesTarget = 5,
  currentStreak,
  isCompleted,
  timeLeft,
}: DailyChallengeCardProps) {
  const progressPercent = matchesTarget > 0 ? Math.round((matchesPlayed / matchesTarget) * 100) : 0;
  const cappedProgress = Math.min(progressPercent, 100);
  const matchesRemaining = Math.max(0, matchesTarget - matchesPlayed);
  const daysUntilWeeklyBonus = Math.max(0, WEEKLY_STREAK_TARGET - currentStreak);
  const timeLeftLabel = timeLeft ?? getTimeUntilReset();
  const totalDaysCompleted = 0;

  // Compact variant for lobby
  if (variant === 'compact') {
    if (isCompleted) return null; // Hide when complete

    return (
      <button
        onClick={onClick}
        className="relative w-full group cursor-pointer"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA3]/50 to-[#7C3AED]/50 blur opacity-75 group-hover:opacity-100 transition-opacity rounded-lg"></div>
        
        <div className="relative bg-gradient-to-r from-[#00FFA3]/10 to-[#7C3AED]/10 backdrop-blur-sm border border-[#00FFA3]/30 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] rounded-lg">
              <Target className="w-4 h-4 text-[#0B0F1A]" />
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-sm font-medium">Daily Challenge</span>
                <div className="px-2 py-0.5 bg-[#00FFA3]/20 rounded-full">
                  <span className="text-[10px] text-[#00FFA3] font-medium">{matchesPlayed}/{matchesTarget}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] rounded-full transition-all duration-500"
                    style={{ width: `${cappedProgress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400">{matchesRemaining} left</span>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#00FFA3] transition-colors" />
          </div>
        </div>
      </button>
    );
  }

  // Banner variant for dashboard and lobby
  if (variant === 'banner') {
    return (
      <div 
        onClick={onClick}
        className="relative group cursor-pointer"
      >
        {/* Static glow - no animation */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA3] via-[#7C3AED] to-[#06B6D4] opacity-40 blur-xl group-hover:opacity-60 transition-all duration-300 rounded-2xl"></div>
        
        <div className="relative bg-gradient-to-br from-[#0B0F1A] via-[#1a0f2e] to-[#0B0F1A] border-2 border-[#00FFA3]/50 rounded-2xl overflow-hidden">
          {/* Static background effects - no animation */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00FFA3] rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7C3AED] rounded-full blur-3xl opacity-30"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-[#06B6D4] rounded-full blur-3xl opacity-20"></div>
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
          }}></div>

          <div className="relative p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                {/* Icon with static glow */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-xl opacity-40"></div>
                  <div className="relative p-3 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] rounded-xl">
                    <Trophy className="w-7 h-7 text-[#0B0F1A]" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-lg">Daily Challenge</h3>
                    {currentStreak > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#FF6B6B]/30 to-[#FFD93D]/30 rounded-full border border-[#FF6B6B]/50">
                        <Flame className="w-3.5 h-3.5 text-[#FF6B6B]" />
                        <span className="text-xs text-white font-medium">{currentStreak} day streak!</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2">
                    {isCompleted 
                      ? `✅ Challenge Complete! +${DAILY_REWARD} Points Earned`
                      : `Complete ${matchesRemaining} more ${matchesRemaining === 1 ? 'match' : 'matches'} to earn ${DAILY_REWARD} Reflex Points!`
                    }
                  </p>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] transition-all duration-500 rounded-full relative overflow-hidden"
                        style={{ width: `${cappedProgress}%` }}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <span className="text-sm text-[#00FFA3] font-bold whitespace-nowrap">
                      {matchesPlayed}/{matchesTarget}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side - Rewards */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Streak progress to weekly bonus */}
                {currentStreak > 0 && currentStreak < 7 && (
                  <div className="hidden sm:flex flex-col items-center gap-1 px-3 py-2 bg-gradient-to-br from-[#7C3AED]/30 to-[#FF6B6B]/30 rounded-xl border border-[#7C3AED]/50">
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-[#FF6B6B]" />
                      <span className="text-white text-xs font-medium">{daysUntilWeeklyBonus} more</span>
                    </div>
                    <div className="text-[10px] text-gray-300">for +{WEEKLY_BONUS} bonus</div>
                  </div>
                )}

                {/* Weekly bonus achieved */}
                {currentStreak >= 7 && (
                  <div className="hidden sm:flex flex-col items-center gap-1 px-3 py-2 bg-gradient-to-br from-[#FFD93D] to-[#FF6B6B] rounded-xl border border-[#FFD93D] animate-pulse">
                    <div className="flex items-center gap-1">
                      <Gift className="w-4 h-4 text-[#0B0F1A]" />
                      <span className="text-[#0B0F1A] text-xs font-bold">+{WEEKLY_BONUS} Bonus!</span>
                    </div>
                    <div className="text-[10px] text-[#0B0F1A] font-medium">7-Day Streak</div>
                  </div>
                )}

                {/* View button */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all group/btn">
                  <span className="text-white text-sm font-medium">View</span>
                  <ChevronRight className="w-5 h-5 text-[#00FFA3] group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Time until reset - small footer */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-400">Resets in {timeLeftLabel}</span>
              </div>
              {totalDaysCompleted > 0 && (
                <span className="text-xs text-gray-400">{totalDaysCompleted} total days completed</span>
              )}
            </div>
          </div>

          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          </div>
        </div>
      </div>
    );
  }

  // Full variant for dedicated screen
  return (
    <div className="space-y-6">
      {/* Main Challenge Card */}
      <div className="relative">
        {/* Massive glow effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-[#00FFA3] via-[#7C3AED] to-[#06B6D4] blur-2xl opacity-60 animate-pulse"></div>
        
        <div className="relative bg-gradient-to-br from-[#0B0F1A] via-[#1a0f2e] to-[#0B0F1A] border-2 border-[#00FFA3] rounded-2xl overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FFA3] rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7C3AED] rounded-full blur-3xl opacity-20"></div>

          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-lg opacity-70 animate-pulse"></div>
                  <div className="relative p-2.5 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] rounded-xl">
                    <Trophy className="w-6 h-6 text-[#0B0F1A]" />
                  </div>
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold mb-0.5">Daily Challenge</h2>
                  <p className="text-gray-300 text-xs">Complete 5 matches every day</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00FFA3]" />
                  <span className="text-xs text-white">{timeLeftLabel}</span>
                </div>
                {currentStreak > 0 && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-r from-[#FF6B6B]/30 to-[#FFD93D]/30 rounded-lg border border-[#FF6B6B]/50">
                    <Flame className="w-3.5 h-3.5 text-[#FF6B6B]" />
                    <span className="text-xs text-white font-medium">{currentStreak} day streak</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-white text-sm font-semibold mb-0.5">Today's Progress</h3>
                  <p className="text-gray-400 text-xs">
                    {isCompleted 
                      ? "Amazing! Challenge complete!"
                      : `${matchesRemaining} ${matchesRemaining === 1 ? 'match' : 'matches'} remaining`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl text-[#00FFA3] font-bold drop-shadow-[0_0_10px_rgba(0,255,163,0.5)]">
                    {matchesPlayed}/{matchesTarget}
                  </div>
                  <div className="text-xs text-gray-400">Matches</div>
                </div>
              </div>

              {/* Large Progress Bar */}
              <div className="space-y-1">
                <Progress value={cappedProgress} className="h-2.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{cappedProgress}% Complete</span>
                  {!isCompleted && (
                    <span className="text-[#00FFA3]">+{DAILY_REWARD} RP</span>
                  )}
                </div>
              </div>
            </div>

            {/* Rewards Section */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Daily Reward */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[#00FFA3]/50 to-[#06B6D4]/50 blur opacity-75 rounded-lg"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-[#00FFA3]/30 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg">
                      <Zap className="w-3.5 h-3.5 text-[#00FFA3]" />
                    </div>
                    <h4 className="text-white text-xs">Daily Reward</h4>
                  </div>
                  <div className="text-xl text-[#00FFA3] font-bold mb-0.5 drop-shadow-[0_0_10px_rgba(0,255,163,0.5)]">
                    +{DAILY_REWARD}
                  </div>
                  <p className="text-xs text-gray-400">Reflex Points</p>
                </div>
              </div>

              {/* Weekly Streak Bonus */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[#FFD93D]/50 to-[#FF6B6B]/50 blur opacity-75 rounded-lg"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-[#FFD93D]/30 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 bg-gradient-to-br from-[#FFD93D]/20 to-[#FF6B6B]/20 rounded-lg">
                      <Flame className="w-3.5 h-3.5 text-[#FF6B6B]" />
                    </div>
                    <h4 className="text-white text-xs">7-Day Bonus</h4>
                  </div>
                  <div className="text-xl text-[#FFD93D] font-bold mb-0.5 drop-shadow-[0_0_10px_rgba(255,217,61,0.5)]">
                    +{WEEKLY_BONUS}
                  </div>
                  <p className="text-xs text-gray-400">
                    {currentStreak >= 7 
                      ? "Keep the streak alive!"
                      : `${daysUntilWeeklyBonus} more ${daysUntilWeeklyBonus === 1 ? 'day' : 'days'}`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            {totalDaysCompleted > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-lg text-white font-bold mb-0.5">{totalDaysCompleted}</div>
                    <div className="text-xs text-gray-400 uppercase">Total Days</div>
                  </div>
                  <div className="w-px h-10 bg-white/10"></div>
                  <div className="text-center">
                    <div className="text-lg text-white font-bold mb-0.5">{currentStreak}</div>
                    <div className="text-xs text-gray-400 uppercase">Current Streak</div>
                  </div>
                  <div className="w-px h-10 bg-white/10"></div>
                  <div className="text-center">
                    <div className="text-lg text-[#00FFA3] font-bold mb-0.5">
                      {totalDaysCompleted * DAILY_REWARD + Math.floor(currentStreak / 7) * WEEKLY_BONUS}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">Total RP</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">How It Works</h3>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-[#00FFA3]/20 rounded-lg flex-shrink-0">
              <Target className="w-3.5 h-3.5 text-[#00FFA3]" />
            </div>
            <div>
              <p className="text-white text-xs font-medium mb-0.5">Daily Goal</p>
              <p className="text-gray-400 text-xs">Complete 5 matches each day to earn {DAILY_REWARD} Reflex Points</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-[#7C3AED]/20 rounded-lg flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-white text-xs font-medium mb-0.5">Build Your Streak</p>
              <p className="text-gray-400 text-xs">Complete the challenge multiple days in a row to build your streak</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-[#FFD93D]/20 rounded-lg flex-shrink-0">
              <Gift className="w-3.5 h-3.5 text-[#FFD93D]" />
            </div>
            <div>
              <p className="text-white text-xs font-medium mb-0.5">Weekly Bonus</p>
              <p className="text-gray-400 text-xs">Maintain a 7-day streak to earn a massive {WEEKLY_BONUS} point bonus!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add shimmer animation to global CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;
document.head.appendChild(style);
