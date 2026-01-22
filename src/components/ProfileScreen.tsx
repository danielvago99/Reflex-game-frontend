import { ArrowLeft, TrendingUp, Trophy, Clock, Coins, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useMemo } from 'react';
import { getAvatarData } from './AvatarSelector';
import { FuturisticBackground } from './FuturisticBackground';
import type { PlayerStats } from '../features/auth/hooks/useUserDashboard';
import type { MatchHistoryEntry } from '../hooks/useMatchHistory';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  playerName?: string;
  avatarUrl?: string;
  stats?: PlayerStats;
  isLoading?: boolean;
  matchHistory?: MatchHistoryEntry[];
  matchHistoryLoading?: boolean;
}

export function ProfileScreen({
  onNavigate,
  playerName = 'Player_0x4f2a',
  avatarUrl,
  stats,
  isLoading,
  matchHistory = [],
  matchHistoryLoading = false,
}: ProfileScreenProps) {
  useScrollToTop();
  const avatarData = useMemo(() => {
    if (avatarUrl) {
      return { id: 'custom-avatar', url: avatarUrl, style: 'custom' };
    }

    const storedAvatar = localStorage.getItem('userAvatar') || 'gradient-1';
    return getAvatarData(storedAvatar);
  }, [avatarUrl]);

  const totalMatches = stats?.totalMatches ?? 0;
  const totalWins = stats?.totalWins ?? 0;
  const rawWinRate = stats?.winRate ?? 0;
  const normalizedWinRate = rawWinRate <= 1 ? rawWinRate * 100 : rawWinRate;
  const winRate = Math.round(normalizedWinRate);
  const averageReaction = stats?.avgReaction ?? null;
  const bestReaction = stats?.bestReaction ?? null;
  const totalVolumePlayed = stats?.totalVolumeSolPlayed ?? 0;

  const formattedHistory = (matchHistory ?? []).map((match) => {
    const isWin = match.result === 'win' || match.result === 'Win';
    const opponentLabel = match.opponent ?? 'Unknown opponent';
    const stake = match.stakeAmount != null ? match.stakeAmount.toString() : '—';
    const earning = isWin
      ? match.profit != null
        ? `+${match.profit}`
        : '+0'
      : match.stakeAmount != null
        ? `-${match.stakeAmount}`
        : '-';
    const reaction = match.reactionTimeMs != null ? `${match.reactionTimeMs}ms` : '—';

    const createdAt = match.createdAt ? new Date(match.createdAt).getTime() : null;
    const now = Date.now();
    const diff = createdAt ? now - createdAt : 0;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    let timeAgo = 'Just now';
    if (createdAt) {
      if (days > 0) timeAgo = `${days}d ago`;
      else if (hours > 0) timeAgo = `${hours}h ago`;
      else if (minutes > 0) timeAgo = `${minutes}m ago`;
    }

    return {
      id: match.id,
      opponent: opponentLabel,
      result: isWin ? 'Win' : 'Loss',
      stake,
      earning,
      time: reaction,
      date: timeAgo,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-6 relative overflow-hidden">
      {/* Background effects */}
      <FuturisticBackground />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 p-3 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl text-white">Player Ranked Stats</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-lg opacity-50"></div>
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-[#00FFA3] flex items-center justify-center overflow-hidden shadow-xl">
                <img 
                  src={avatarData.url} 
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl text-white mb-1">{playerName}</h2>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Matches */}
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 blur-sm" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}></div>
              <div className="relative bg-gradient-to-br from-[#00FFA3]/10 to-[#06B6D4]/10 border border-[#00FFA3]/20 backdrop-blur-sm p-4 overflow-hidden" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
                <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-[#00FFA3]/30 to-transparent"></div>
                <p className="text-xs text-white mb-1 uppercase tracking-wider">Total Matches</p>
                <p className="text-3xl text-white">{isLoading ? '—' : totalMatches}</p>
              </div>
            </div>
            
            {/* Win Rate */}
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-br from-[#7C3AED]/30 to-[#06B6D4]/30 blur-sm" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}></div>
              <div className="relative bg-gradient-to-br from-[#7C3AED]/10 to-[#06B6D4]/10 border border-[#7C3AED]/20 backdrop-blur-sm p-4 overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-[#7C3AED]/30 to-transparent"></div>
                <p className="text-xs text-white mb-1 uppercase tracking-wider">Win Rate</p>
                <p className="text-3xl text-white">{isLoading ? '—' : `${winRate}%`}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6 shadow-xl">
          <h3 className="text-lg text-white mb-4">Performance Metrics</h3>
          
          <div className="space-y-4">
            {/* Total Wins */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#00FFA3]/20 p-3 rounded-xl">
                  <Trophy className="w-5 h-5 text-[#00FFA3]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Wins</p>
                  <p className="text-xl text-white">{isLoading ? '—' : totalWins}</p>
                </div>
              </div>
              <span className="text-sm text-[#00FFA3]">{isLoading ? '—' : `${winRate}% win rate`}</span>
            </div>

            {/* Avg Reaction Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#06B6D4]/20 p-3 rounded-xl">
                  <Clock className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg Reaction Time</p>
                  <p className="text-xl text-white">{isLoading || averageReaction === null ? '—' : `${averageReaction}ms`}</p>
                </div>
              </div>
              <span className="text-sm text-[#06B6D4]">{isLoading ? '—' : 'Live data'}</span>
            </div>

            {/* Best Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#7C3AED]/20 p-3 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-[#7C3AED]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Best Reaction</p>
                  <p className="text-xl text-white">{isLoading || bestReaction === null ? '—' : `${bestReaction}ms`}</p>
                </div>
              </div>
              <span className="text-sm text-[#7C3AED]">{isLoading ? '—' : 'Personal best'}</span>
            </div>

            {/* SOL Earnings */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] p-3 rounded-xl">
                  <Coins className="w-5 h-5 text-[#0B0F1A]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Volume Played</p>
                  <p className="text-xl bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] bg-clip-text text-transparent">
                    {isLoading ? '—' : `${Number(totalVolumePlayed || 0)} SOL`}
                  </p>
                </div>
              </div>
              <span className="text-sm text-[#00FFA3]">{isLoading ? '—' : 'Synced'}</span>
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg text-white mb-4">Recent Match History</h3>
          
          <div className="space-y-3">
            {matchHistoryLoading ? (
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center text-sm text-gray-400">
                Loading match history...
              </div>
            ) : formattedHistory.length === 0 ? (
              // Empty State
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
                <div className="mx-auto mb-4 p-4 bg-white/5 rounded-full border border-white/10 w-16 h-16 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-white mb-2">No Matches Yet</h4>
                <p className="text-sm text-gray-400">
                  Play your first match to see your history here.
                </p>
              </div>
            ) : (
              // Match List
              formattedHistory.map((match) => (
                <div
                  key={match.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        match.result === 'Win' ? 'bg-[#00FFA3]' : 'bg-red-400'
                      }`}></div>
                      <div>
                        <p className="text-white text-sm">{match.opponent}</p>
                        <p className="text-xs text-gray-500">{match.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${
                        match.result === 'Win' ? 'text-[#00FFA3]' : 'text-red-400'
                      }`}>
                        {match.earning} SOL
                      </p>
                      <p className="text-xs text-gray-500">{match.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Stake: {match.stake} SOL</span>
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <span className={match.result === 'Win' ? 'text-[#00FFA3]' : 'text-red-400'}>
                      {match.result}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
