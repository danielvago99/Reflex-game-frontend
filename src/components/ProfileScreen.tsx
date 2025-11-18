import { ArrowLeft, TrendingUp, Trophy, Clock, Coins, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState, useEffect } from 'react';
import { getAvatarData } from './AvatarSelector';
import { FuturisticBackground } from './FuturisticBackground';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  playerName?: string;
}

export function ProfileScreen({ onNavigate, playerName = 'Player_0x4f2a' }: ProfileScreenProps) {
  const [userAvatar, setUserAvatar] = useState(() => {
    return localStorage.getItem('userAvatar') || 'gradient-1';
  });

  const avatarData = getAvatarData(userAvatar);

  const matchHistory: any[] = [
    // Empty by default - will show empty state when matchHistory.length === 0
  ];

  // Example with matches (comment out to see empty state):
  // const matchHistory = [
  //   { id: 1, opponent: 'Player_0x89d2', result: 'Win', stake: '0.1', earning: '+0.18', time: '245ms', date: '2h ago' },
  //   { id: 2, opponent: 'CryptoNinja', result: 'Win', stake: '0.1', earning: '+0.18', time: '238ms', date: '5h ago' },
  //   { id: 3, opponent: 'Bot_Advanced', result: 'Win', stake: '0.5', earning: '+0.90', time: '221ms', date: '1d ago' },
  //   { id: 4, opponent: 'Player_0x12a4', result: 'Loss', stake: '0.1', earning: '-0.10', time: '289ms', date: '1d ago' },
  //   { id: 5, opponent: 'ReflexMaster', result: 'Loss', stake: '0.1', earning: '-0.10', time: '312ms', date: '2d ago' },
  // ];

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
          <h1 className="text-2xl text-white">Player Stats</h1>
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
                <p className="text-3xl text-white">156</p>
              </div>
            </div>
            
            {/* Win Rate */}
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-br from-[#7C3AED]/30 to-[#06B6D4]/30 blur-sm" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}></div>
              <div className="relative bg-gradient-to-br from-[#7C3AED]/10 to-[#06B6D4]/10 border border-[#7C3AED]/20 backdrop-blur-sm p-4 overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-[#7C3AED]/30 to-transparent"></div>
                <p className="text-xs text-white mb-1 uppercase tracking-wider">Win Rate</p>
                <p className="text-3xl text-white">68%</p>
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
                  <p className="text-xl text-white">106</p>
                </div>
              </div>
              <span className="text-sm text-[#00FFA3]">68% win rate</span>
            </div>

            {/* Avg Reaction Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#06B6D4]/20 p-3 rounded-xl">
                  <Clock className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg Reaction Time</p>
                  <p className="text-xl text-white">256ms</p>
                </div>
              </div>
              <span className="text-sm text-[#06B6D4]">Top 15%</span>
            </div>

            {/* Best Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#7C3AED]/20 p-3 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-[#7C3AED]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Best Reaction</p>
                  <p className="text-xl text-white">189ms</p>
                </div>
              </div>
              <span className="text-sm text-[#7C3AED]">Personal best</span>
            </div>

            {/* SOL Earnings */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] p-3 rounded-xl">
                  <Coins className="w-5 h-5 text-[#0B0F1A]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Earnings</p>
                  <p className="text-xl bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] bg-clip-text text-transparent">
                    12.84 SOL
                  </p>
                </div>
              </div>
              <span className="text-sm text-[#00FFA3]">+2.4 this week</span>
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg text-white mb-4">Recent Match History</h3>
          
          <div className="space-y-3">
            {matchHistory.length === 0 ? (
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
              matchHistory.map((match) => (
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