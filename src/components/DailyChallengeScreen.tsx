import { ArrowLeft } from 'lucide-react';
import { DailyChallengeCard } from './DailyChallengeCard';
import { FuturisticBackground } from './FuturisticBackground';
import { useRewardsData } from '../features/rewards/hooks/useRewardsData';

interface DailyChallengeScreenProps {
  onBack: () => void;
}

export function DailyChallengeScreen({ onBack }: DailyChallengeScreenProps) {
  const { data } = useRewardsData();
  const matchesPlayed = data?.dailyMatchesPlayed ?? data?.dailyProgress ?? 0;
  const matchesTarget = data?.dailyTarget ?? 5;
  const streak = data?.dailyStreak ?? data?.streak ?? 0;
  const isCompleted = matchesPlayed >= matchesTarget;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-6 relative overflow-hidden">
      {/* Background effects */}
      <FuturisticBackground />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00FFA3]/50 rounded-xl transition-all text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-2xl font-bold">Daily Challenge</h1>
            <p className="text-gray-400 text-sm">Complete 5 matches daily to earn rewards</p>
          </div>
        </div>

        {/* Daily Challenge Full Card */}
        <DailyChallengeCard
          variant="full"
          matchesPlayed={matchesPlayed}
          matchesTarget={matchesTarget}
          currentStreak={streak}
          isCompleted={isCompleted}
        />
      </div>
    </div>
  );
}
