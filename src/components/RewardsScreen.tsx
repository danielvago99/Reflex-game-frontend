import { ArrowLeft, Zap, Gift, Target, Trophy, Clock, Flame, Star, TrendingUp, Coins, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DailyChallengeCard } from './DailyChallengeCard';
import { FuturisticBackground } from './FuturisticBackground';
import type { PlayerStats } from '../features/auth/hooks/useUserDashboard';
import type { AmbassadorData } from '../features/auth/hooks/useAmbassadorData';

interface RewardsScreenProps {
  onNavigate: (screen: string) => void;
  stats?: PlayerStats;
  ambassadorStats?: AmbassadorData | null;
  isLoading?: boolean;
}

export function RewardsScreen({ onNavigate, stats, ambassadorStats, isLoading }: RewardsScreenProps) {
  const [reflexPoints, setReflexPoints] = useState(0);
  const [dailyProgress, setDailyProgress] = useState(0); // Matches played today
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [lastDailyClaim, setLastDailyClaim] = useState<Date | null>(null);
  const [streak, setStreak] = useState(3);
  const [ambassadorRewards, setAmbassadorRewards] = useState(0);
  const [dailyRewardsEarned, setDailyRewardsEarned] = useState(0);
  const [activePlayers, setActivePlayers] = useState(0); // Changed from ambassadorPointsTotal
  const [freeStakesAvailable, setFreeStakesAvailable] = useState(0);
  const [freeStakes005, setFreeStakes005] = useState(0);
  const [freeStakes010, setFreeStakes010] = useState(0);
  const [freeStakes020, setFreeStakes020] = useState(0);

  useEffect(() => {
    const totalFreeStakes = freeStakes005 + freeStakes010 + freeStakes020;
    setFreeStakesAvailable(totalFreeStakes);
    setCanClaimDaily(dailyProgress >= 5);
  }, [dailyProgress, freeStakes005, freeStakes010, freeStakes020]);

  useEffect(() => {
    if (stats) {
      setReflexPoints(Math.round(stats.totalSolWon ?? 0));
      setDailyProgress(stats.totalMatches ?? 0);
      setStreak(stats.currentStreak ?? 0);
      setDailyRewardsEarned(Number(stats.totalSolWon ?? 0));
      setFreeStakes005(0);
      setFreeStakes010(0);
      setFreeStakes020(0);
    }
  }, [stats]);

  useEffect(() => {
    if (ambassadorStats) {
      setActivePlayers(ambassadorStats.activeReferrals ?? 0);
      setAmbassadorRewards(ambassadorStats.totalRewards ?? 0);
    }
  }, [ambassadorStats]);

  const claimDailyReward = () => {
    if (!canClaimDaily) return;

    const baseReward = 10;
    const totalReward = baseReward;

    const newPoints = reflexPoints + totalReward;
    setReflexPoints(newPoints);

    const newDailyTotal = dailyRewardsEarned + totalReward;
    setDailyRewardsEarned(newDailyTotal);

    const newStreak = streak + 1;
    setStreak(newStreak);

    setDailyProgress(0);

    setLastDailyClaim(new Date());
    setCanClaimDaily(false);

    toast.success('Daily Reward Claimed!', {
      description: `+${totalReward} Reflex Points`,
      duration: 4000,
    });
  };

  const claimAmbassadorRewards = () => {
    if (ambassadorRewards === 0) return;

    const newPoints = reflexPoints + ambassadorRewards;
    setReflexPoints(newPoints);

    const newAmbassadorTotal = activePlayers + ambassadorRewards;
    setActivePlayers(newAmbassadorTotal);

    setAmbassadorRewards(0);

    toast.success('Ambassador Rewards Claimed!', {
      description: `+${ambassadorRewards} Reflex Points added to your account`,
      duration: 4000,
    });
  };

  const redeemForStake = (amount: number, cost: number) => {
    if (reflexPoints < cost) {
      toast.error('Insufficient Reflex Points', {
        description: `You need ${cost} points to redeem ${amount} SOL stake`,
      });
      return;
    }

    const newPoints = reflexPoints - cost;
    setReflexPoints(newPoints);

    if (amount === 0.05) setFreeStakes005((prev) => prev + 1);
    else if (amount === 0.1 || amount === 0.10) setFreeStakes010((prev) => prev + 1);
    else if (amount === 0.2 || amount === 0.20) setFreeStakes020((prev) => prev + 1);

    toast.success('Stake Redeemed!', {
      description: `You received ${amount} SOL free stake. -${cost} Reflex Points`,
      duration: 4000,
    });
  };

  const progressPercentage = Math.min((dailyProgress / 5) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-6 relative overflow-hidden">
      {/* Background effects */}
      <FuturisticBackground />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-3 bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-[#00FFA3]/50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl text-white mb-1">Rewards Center</h1>
            <p className="text-sm text-gray-400">Earn & redeem Reflex Points</p>
          </div>
        </div>

        {/* Total Balance Card - Hero Card with Ambassador Dashboard Style */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#7C3AED]/30 to-[#00FFA3]/30 blur-lg"></div>
          
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border-2 border-white/20 shadow-2xl overflow-hidden" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-6 h-px bg-gradient-to-r from-[#7C3AED] to-transparent"></div>
            <div className="absolute top-0 left-0 w-px h-6 bg-gradient-to-b from-[#7C3AED] to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-6 h-px bg-gradient-to-l from-[#00FFA3] to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-px h-6 bg-gradient-to-t from-[#00FFA3] to-transparent"></div>
            
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#00FFA3] rounded-full blur-[80px] animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#7C3AED] rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 rounded-xl border border-[#00FFA3]/50">
                    <Zap className="w-6 h-6 text-[#00FFA3] drop-shadow-[0_0_8px_rgba(0,255,163,0.8)]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-300 uppercase tracking-widest">Total Balance</p>
                    <p className="text-sm text-[#00FFA3]">Reflex Points</p>
                  </div>
                </div>
                <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
              </div>
              
              <div className="text-5xl text-white mb-2 drop-shadow-[0_0_12px_rgba(0,255,163,0.3)]">{reflexPoints.toLocaleString()}</div>
              <p className="text-sm text-gray-400">Available for rewards & free stakes</p>
            </div>
          </div>
        </div>

        {/* Points Breakdown - 3 Stat Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Ambassador Points */}
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-br from-[#7C3AED]/20 to-[#00FFA3]/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}></div>

            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg overflow-hidden" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
              {/* Corner indicators */}
              <div className="absolute top-0 left-1 w-1 h-1 border-t border-l border-[#7C3AED]/50"></div>
              <div className="absolute bottom-0 right-1 w-1 h-1 border-b border-r border-[#00FFA3]/50"></div>

              <div className="p-3 text-center flex flex-col items-center justify-center">
                <Users className="w-4 h-4 text-[#7C3AED] mb-2" />
                <div className="text-2xl text-white mb-1">{activePlayers}</div>
                <p className="text-xs text-gray-400 leading-tight">Active<br/>Ambassadors</p>
              </div>
            </div>
          </div>

          {/* Daily Rewards Points */}
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}></div>

            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg overflow-hidden" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
              {/* Corner indicators */}
              <div className="absolute top-0 left-1 w-1 h-1 border-t border-l border-[#00FFA3]/50"></div>
              <div className="absolute bottom-0 right-1 w-1 h-1 border-b border-r border-[#06B6D4]/50"></div>

              <div className="p-3 text-center flex flex-col items-center justify-center">
                <Target className="w-4 h-4 text-[#00FFA3] mb-2" />
                <div className="text-2xl text-white mb-1">{dailyRewardsEarned}</div>
                <p className="text-xs text-gray-400 leading-tight">Daily<br/>Streak</p>
              </div>
            </div>
          </div>

          {/* Redeemed Points */}
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-br from-[#06B6D4]/20 to-[#7C3AED]/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}></div>

            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg overflow-hidden" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
              {/* Corner indicators */}
              <div className="absolute top-0 left-1 w-1 h-1 border-t border-l border-[#06B6D4]/50"></div>
              <div className="absolute bottom-0 right-1 w-1 h-1 border-b border-r border-[#7C3AED]/50"></div>

              <div className="p-3 text-center flex flex-col items-center justify-center">
                <Trophy className="w-4 h-4 text-[#06B6D4] mb-2" />
                <div className="text-2xl text-white mb-1">{freeStakesAvailable}</div>
                <p className="text-xs text-gray-400 leading-tight">Free<br/>Stakes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Challenge Card - New Component */}
        <div className="mb-6">
          <DailyChallengeCard variant="banner" onClick={() => onNavigate('daily-challenge')} />
        </div>

        {/* Redeem for Stakes Section */}
        <div className="relative">
          <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 blur-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)' }}></div>
          
          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)' }}>
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-px bg-gradient-to-r from-[#00FFA3] to-transparent"></div>
            <div className="absolute top-0 left-0 w-px h-4 bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-4 h-px bg-gradient-to-l from-[#06B6D4] to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-px h-4 bg-gradient-to-t from-[#06B6D4] to-transparent"></div>
            
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00FFA3]/20 rounded-lg">
                    <Coins className="w-5 h-5 text-[#00FFA3]" />
                  </div>
                  <div>
                    <h3 className="text-white">Redeem for Stakes</h3>
                    <p className="text-xs text-gray-400">Exchange points for free stakes</p>
                  </div>
                </div>
              </div>

              {/* Stake Options Grid */}
              <div className="space-y-3">
                {/* 0.05 SOL Stake */}
                <div className="relative group">
                  <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Coins className="w-4 h-4 text-[#00FFA3]"/>
                          <span className="text-white">0.05 SOL</span>
                        </div>
                        <p className="text-xs text-gray-400">You have: {freeStakes005} free stakes</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-[#00FFA3]"/>
                          <span className="text-[#00FFA3]">90 pts</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => redeemForStake(0.05, 90)}
                      disabled={reflexPoints < 90}
                      className={`w-full px-4 py-2.5 rounded-lg transition-all duration-300 ${
                        reflexPoints >= 90
                          ? 'bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] text-[#0B0F1A]'
                          : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm">{reflexPoints >= 90 ? 'Redeem 0.05 SOL' : 'Not enough points'}</span>
                    </button>
                  </div>
                </div>

                {/* 0.1 SOL Stake */}
                <div className="relative group">
                  <div className="absolute -inset-px bg-gradient-to-r from-[#7C3AED]/20 to-[#00FFA3]/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Coins className="w-4 h-4 text-[#7C3AED]"/>
                          <span className="text-white">0.1 SOL</span>
                        </div>
                        <p className="text-xs text-gray-400">You have: {freeStakes010} free stakes</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-[#7C3AED]"/>
                          <span className="text-[#7C3AED]">150 pts</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => redeemForStake(0.10, 150)}
                      disabled={reflexPoints < 150}
                      className={`w-full px-4 py-2.5 rounded-lg transition-all duration-300 ${
                        reflexPoints >= 150
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#00FFA3] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] text-white'
                          : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm">{reflexPoints >= 150 ? 'Redeem 0.1 SOL' : 'Not enough points'}</span>
                    </button>
                  </div>
                </div>

                {/* 0.2 SOL Stake */}
                <div className="relative group">
                  <div className="absolute -inset-px bg-gradient-to-r from-[#06B6D4]/20 to-[#7C3AED]/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Coins className="w-4 h-4 text-[#06B6D4]"/>
                          <span className="text-white">0.2 SOL</span>
                        </div>
                        <p className="text-xs text-gray-400">You have: {freeStakes020} free stakes</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-[#06B6D4]"/>
                          <span className="text-[#06B6D4]">250 pts</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => redeemForStake(0.20, 250)}
                      disabled={reflexPoints < 250}
                      className={`w-full px-4 py-2.5 rounded-lg transition-all duration-300 ${
                        reflexPoints >= 250
                          ? 'bg-gradient-to-r from-[#06B6D4] to-[#7C3AED] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white'
                          : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm">{reflexPoints >= 250 ? 'Redeem 0.2 SOL' : 'Not enough points'}</span>
                    </button>
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
