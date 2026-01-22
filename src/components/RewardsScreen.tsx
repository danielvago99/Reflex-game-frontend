import { ArrowLeft, Zap, Target, Trophy, Flame, Coins, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DailyChallengeCard } from './DailyChallengeCard';
import { FuturisticBackground } from './FuturisticBackground';
import { useRewardsData } from '../features/rewards/hooks/useRewardsData';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface RewardsScreenProps {
  onNavigate: (screen: string) => void;
}

export function RewardsScreen({ onNavigate }: RewardsScreenProps) {
  useScrollToTop();
  const { data, loading, redeemStake } = useRewardsData();
  const reflexPoints = data?.reflexPoints ?? 0;
  const streak = data?.dailyStreak ?? data?.streak ?? 0;
  const dailyMatchesPlayed = data?.dailyMatchesPlayed ?? data?.dailyProgress ?? 0;
  const dailyMatchesTarget = data?.dailyTarget ?? 5;
  const dailyChallengeCompleted = dailyMatchesPlayed >= dailyMatchesTarget;
  const freeStakes005 = data?.freeStakes005 ?? 0;
  const freeStakes010 = data?.freeStakes010 ?? 0;
  const freeStakes020 = data?.freeStakes020 ?? 0;
  const freeStakesAvailable = freeStakes005 + freeStakes010 + freeStakes020;
  const activePlayers = 0;

  const getRedeemCost = (amount: number) => {
    if (amount === 0.05) {
      return 90;
    }
    if (amount === 0.1) {
      return 170;
    }
    if (amount === 0.2) {
      return 320;
    }
    return null;
  };

  const handleRedeem = async (amount: number) => {
    const cost = getRedeemCost(amount);

    if (cost === null) {
      toast.error('Unsupported stake amount');
      return;
    }

    if (reflexPoints < cost) {
      toast.error('Insufficient Reflex Points', {
        description: `You need ${cost} points to redeem ${amount} SOL stake`,
      });
      return;
    }

    try {
      await redeemStake(amount);
      toast.success('Stake Redeemed!', {
        description: `You received ${amount} SOL free stake. -${cost} Reflex Points`,
        duration: 4000,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to redeem stake.';
      toast.error('Redemption failed', { description: message });
    }
  };

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
                <div className="text-2xl text-white mb-1">{streak}</div>
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
          <DailyChallengeCard
            variant="banner"
            onClick={() => onNavigate('daily-challenge')}
            matchesPlayed={dailyMatchesPlayed}
            matchesTarget={dailyMatchesTarget}
            currentStreak={streak}
            isCompleted={dailyChallengeCompleted}
          />
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
                      onClick={() => handleRedeem(0.05)}
                      disabled={loading || reflexPoints < 90}
                      className={`w-full px-4 py-2.5 rounded-lg transition-all duration-300 ${
                        !loading && reflexPoints >= 90
                          ? 'bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] text-[#0B0F1A]'
                          : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm">
                        {loading ? 'Loading...' : reflexPoints >= 90 ? 'Redeem 0.05 SOL' : 'Not enough points'}
                      </span>
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
                          <span className="text-[#7C3AED]">170 pts</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRedeem(0.1)}
                      disabled={loading || reflexPoints < 170}
                      className={`w-full px-4 py-2.5 rounded-lg transition-all duration-300 ${
                        !loading && reflexPoints >= 170
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#00FFA3] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] text-white'
                          : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm">
                        {loading ? 'Loading...' : reflexPoints >= 170 ? 'Redeem 0.1 SOL' : 'Not enough points'}
                      </span>
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
                          <span className="text-[#06B6D4]">320 pts</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRedeem(0.2)}
                      disabled={loading || reflexPoints < 320}
                      className={`w-full px-4 py-2.5 rounded-lg transition-all duration-300 ${
                        !loading && reflexPoints >= 320
                          ? 'bg-gradient-to-r from-[#06B6D4] to-[#7C3AED] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white'
                          : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm">
                        {loading ? 'Loading...' : reflexPoints >= 320 ? 'Redeem 0.2 SOL' : 'Not enough points'}
                      </span>
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
