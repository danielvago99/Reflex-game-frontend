import { Gamepad2, TrendingUp, Settings, Gift, ArrowDownToLine, ArrowUpFromLine, Zap } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DepositDialog } from './wallet/DepositDialog';
import { WithdrawDialog } from './wallet/WithdrawDialog';
import { getReflexPoints } from '../utils/reflexPoints';
import { getAvatarData } from './AvatarSelector';
import { FuturisticBackground } from './FuturisticBackground';
import { getRecentMatches } from '../utils/matchHistory';
import type { PlayerStats } from '../features/auth/hooks/useUserDashboard';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
  playerName?: string;
  walletAddress?: string;
  balance?: number;
  avatarUrl?: string;
  stats?: PlayerStats;
  isLoading?: boolean;
}

export function DashboardScreen({
  onNavigate,
  playerName = 'Player_0x4f2a',
  walletAddress = 'DemoWallet123456789ABCDEFGHIJKLMNOPQRSTUVWXY',
  balance = 0,
  avatarUrl,
  stats,
  isLoading
}: DashboardScreenProps) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Recent matches data - empty array means no matches
  const [recentMatches, setRecentMatches] = useState<Array<{ result: string; amount: string; time: string; color: string }>>([]);

  useEffect(() => {
    // Load fresh data on mount
    setRecentMatches(getRecentMatches());
  }, []); // Only run on mount since we use key prop to force remount

  const avatarData = useMemo(() => {
    if (avatarUrl) {
      return { id: 'custom-avatar', url: avatarUrl, style: 'custom' };
    }

    const storedAvatar = localStorage.getItem('userAvatar') || 'gradient-1';
    return getAvatarData(storedAvatar);
  }, [avatarUrl]);

  const reflexPoints = stats?.totalReflexPoints ?? getReflexPoints();
  const winRate = stats?.winRate ?? 0;
  const totalMatches = stats?.totalMatches ?? 0;
  const totalWins = stats?.totalWins ?? 0;
  const totalLosses = stats?.totalLosses ?? 0;
  const walletBalance = useMemo(() => {
    if (typeof stats?.totalSolWon === 'string') return parseFloat(stats.totalSolWon);
    if (typeof stats?.totalSolWon === 'number') return stats.totalSolWon;
    return balance;
  }, [balance, stats?.totalSolWon]);
  const displayedReflexPoints = isLoading && !stats ? '—' : reflexPoints;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-3 xs:p-4 sm:p-6 relative overflow-hidden">
      <FuturisticBackground />
      
      <div className="relative z-10 max-w-md mx-auto">
        {/* Header with Avatar and Balance */}
        <div className="relative mb-4 xs:mb-6">
          {/* Outer glow - static, no animation */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA3] via-[#7C3AED] to-[#06B6D4] opacity-40 blur-xl rounded-2xl"></div>
          
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
              {/* User Info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-lg opacity-40"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-[#00FFA3] flex items-center justify-center overflow-hidden shadow-xl">
                    <img 
                      src={avatarData.url} 
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl text-white mb-1">{playerName}</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00FFA3] rounded-full"></div>
                    <span className="text-sm text-gray-400">Online</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isLoading ? 'Syncing stats...' : `W ${totalWins} / L ${totalLosses}`}
                  </p>
                </div>
              </div>
              
              {/* Wallet Balance Section - Reduced Height */}
              <div className="relative">
                {/* Inner glow border - static */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 blur opacity-50 rounded-xl"></div>
                
                <div className="relative bg-white/5 backdrop-blur-sm border border-[#00FFA3]/30 rounded-xl p-4 overflow-hidden">
                  {/* Animated background grid */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0,255,163,0.3) 25%, rgba(0,255,163,0.3) 26%, transparent 27%, transparent 74%, rgba(0,255,163,0.3) 75%, rgba(0,255,163,0.3) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(0,255,163,0.3) 25%, rgba(0,255,163,0.3) 26%, transparent 27%, transparent 74%, rgba(0,255,163,0.3) 75%, rgba(0,255,163,0.3) 76%, transparent 77%)',
                    backgroundSize: '8px 8px'
                  }}></div>

                  {/* Corner accents */}
                  <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-[#00FFA3]/80"></div>
                  <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-[#06B6D4]/80"></div>
                  <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-[#00FFA3]/80"></div>
                  <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-[#06B6D4]/80"></div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-200%] animate-shimmer"></div>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg">
                          <Zap className="w-4 h-4 text-[#00FFA3]" />
                        </div>
                        <h3 className="text-white text-sm">Wallet Balance</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full"></div>
                        <span className="text-xs text-gray-400">{displayedReflexPoints} RP</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-3xl text-[#00FFA3] font-bold drop-shadow-[0_0_10px_rgba(0,255,163,0.6)]">
                        {isLoading ? '—' : walletBalance.toFixed(4)}
                        <span className="text-lg text-gray-400 ml-2">SOL</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Matches</p>
                        <p className="text-white text-sm">{isLoading ? '—' : totalMatches}</p>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Wins</p>
                        <p className="text-[#00FFA3] text-sm">{isLoading ? '—' : totalWins}</p>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Win Rate</p>
                        <p className="text-white text-sm">{isLoading ? '—' : `${Math.round(winRate * 100)}%`}</p>
                      </div>
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setShowDeposit(true);
                        }}
                        className="relative group/btn"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA3]/50 to-[#06B6D4]/50 blur opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-lg"></div>
                        <div className="relative bg-white/10 hover:bg-white/20 border border-[#00FFA3]/30 hover:border-[#00FFA3]/60 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2">
                          <ArrowDownToLine className="w-4 h-4 text-[#00FFA3]" />
                          <span className="text-sm">Deposit</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowWithdraw(true);
                        }}
                        className="relative group/btn"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#06B6D4]/50 to-[#7C3AED]/50 blur opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-lg"></div>
                        <div className="relative bg-white/10 hover:bg-white/20 border border-[#06B6D4]/30 hover:border-[#06B6D4]/60 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2">
                          <ArrowUpFromLine className="w-4 h-4 text-[#06B6D4]" />
                          <span className="text-sm">Withdraw</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] hover:translate-x-[200%] transition-transform duration-1000"></div>
            </div>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => onNavigate('lobby')}
            className="relative w-full overflow-hidden p-5 rounded-xl transition-all duration-300 transform hover:scale-[1.03] group"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#00FFA3] animate-[gradient_3s_ease_infinite]"></div>
            
            {/* Outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] opacity-50 blur-xl group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {/* Pulse effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3]/50 to-[#06B6D4]/50 animate-pulse"></div>
            
            <div className="relative flex items-center justify-center gap-3 text-[#0B0F1A] drop-shadow-lg">
              <Gamepad2 className="w-6 h-6" />
              <span className="text-lg">Play Game</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('ambassador')}
            className="w-full bg-white/5 backdrop-blur-lg border border-[#7C3AED]/30 hover:bg-white/10 hover:border-[#7C3AED]/60 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] text-white p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Gift className="w-6 h-6 text-[#7C3AED]" />
            <span>Ambassador Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('rewards')}
            className="relative w-full overflow-hidden p-4 rounded-xl transition-all duration-300 group"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/20 via-[#00FFA3]/20 to-[#06B6D4]/20 transition-all duration-300 group-hover:from-[#7C3AED]/30 group-hover:via-[#00FFA3]/30 group-hover:to-[#06B6D4]/30"></div>
            <div className="absolute inset-0 border-2 border-transparent bg-clip-padding transition-all duration-300 rounded-xl" style={{ background: 'linear-gradient(#101522, #101522) padding-box, linear-gradient(90deg, #7C3AED, #00FFA3, #06B6D4) border-box' }}></div>
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-[#7C3AED]/30 via-[#00FFA3]/30 to-[#06B6D4]/30"></div>
            
            <div className="relative flex items-center justify-center gap-3 text-white">
              <Zap className="w-6 h-6 text-[#00FFA3] group-hover:drop-shadow-[0_0_8px_rgba(0,255,163,0.8)]" />
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#00FFA3] to-[#06B6D4] bg-clip-text text-transparent group-hover:drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]">Rewards & Reflex Points</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className="w-full bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-[#06B6D4]/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-white p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            <TrendingUp className="w-6 h-6 text-[#06B6D4]" />
            <span>My Stats</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="w-full bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] text-white p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Settings className="w-6 h-6 text-gray-300" />
            <span>Settings</span>
          </button>
        </div>

        {/* Recent Activity - Futuristic Panel */}
        <div className="relative">
          {/* Multi-layer border effect */}
          <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/10 via-[#06B6D4]/10 to-[#7C3AED]/10" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}></div>
          
          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg overflow-hidden" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
            {/* Top decorative line */}
            <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#00FFA3]/50 to-transparent"></div>
            
            {/* Corner indicators */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#00FFA3]/50"></div>
            <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#06B6D4]/50"></div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs text-gray-400 uppercase tracking-widest">Recent Matches</h3>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-[#00FFA3] rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-[#06B6D4] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-[#7C3AED] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                {recentMatches.length === 0 ? (
                  // Empty State - Motivational
                  <div className="relative">
                    <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-8 text-center">
                      {/* Decorative elements */}
                      <div className="absolute top-2 left-2 w-16 h-16 border-t-2 border-l-2 border-[#00FFA3]/20 rounded-tl-lg"></div>
                      <div className="absolute bottom-2 right-2 w-16 h-16 border-b-2 border-r-2 border-[#06B6D4]/20 rounded-br-lg"></div>
                      
                      <div className="relative">
                        {/* Icon */}
                        <div className="mx-auto mb-4 p-4 bg-white/5 rounded-full border border-white/10 w-16 h-16 flex items-center justify-center">
                          <Gamepad2 className="w-8 h-8 text-gray-400" />
                        </div>
                        
                        {/* Text */}
                        <h4 className="text-white mb-2">No Matches Yet</h4>
                        <p className="text-sm text-gray-400 mb-4 max-w-xs mx-auto">
                          Jump into your first game and test your reflexes. Compete against others and win SOL!
                        </p>
                        
                        {/* CTA */}
                        <button
                          onClick={() => onNavigate('lobby')}
                          className="mx-auto bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 hover:from-[#00FFA3]/30 hover:to-[#06B6D4]/30 border border-[#00FFA3]/30 text-[#00FFA3] py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          <span className="text-sm">Play Your First Match</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Match List
                  recentMatches.map((match, i) => (
                    <div key={i} className="relative group">
                      <div className="flex items-center justify-between py-3 px-3 bg-white/5 backdrop-blur-sm border-l-2 transition-all hover:bg-white/10" style={{ borderColor: match.color }}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: match.color }}></div>
                            <div className="absolute inset-0 w-2 h-2 rounded-full blur-sm" style={{ backgroundColor: match.color }}></div>
                          </div>
                          <span className="text-white text-sm">{match.result}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm" style={{ color: match.color }}>{match.amount}</p>
                          <p className="text-xs text-gray-500">{match.time}</p>
                        </div>
                      </div>
                      {i < recentMatches.length - 1 && <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mt-2"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DepositDialog 
        open={showDeposit}
        onClose={() => setShowDeposit(false)}
        walletAddress={walletAddress}
      />
      <WithdrawDialog
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        currentBalance={balance}
      />
    </div>
  );
}