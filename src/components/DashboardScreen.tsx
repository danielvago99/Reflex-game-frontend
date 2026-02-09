import { Gamepad2, TrendingUp, Settings, Gift, ArrowDownToLine, ArrowUpFromLine, Trophy, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DepositDialog } from './wallet/DepositDialog';
import { WithdrawDialog } from './wallet/WithdrawDialog';
import { JackpotDialog } from './jackpot/JackpotDialog';
import { getAvatarData } from './AvatarSelector';
import { FuturisticBackground } from './FuturisticBackground';
import { useRewardsData } from '../features/rewards/hooks/useRewardsData';
import { useRealBalance } from '../hooks/useRealBalance';
import type { PlayerStats } from '../features/auth/hooks/useUserDashboard';
import type { MatchHistoryEntry } from '../hooks/useMatchHistory';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
  playerName?: string;
  walletAddress?: string;
  avatarUrl?: string;
  stats?: PlayerStats;
  isLoading?: boolean;
  recentMatches?: MatchHistoryEntry[];
  matchesLoading?: boolean;
}

export function DashboardScreen({
  onNavigate,
  playerName = 'Player_0x4f2a',
  walletAddress = 'DemoWallet123456789ABCDEFGHIJKLMNOPQRSTUVWXY',
  avatarUrl,
  stats,
  isLoading,
  recentMatches = [],
  matchesLoading = false
}: DashboardScreenProps) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showJackpot, setShowJackpot] = useState(false);
  const { data: rewardsData } = useRewardsData();
  const { balance, loading: balanceLoading } = useRealBalance();
  const toastShownRef = useRef(false);

  const avatarData = useMemo(() => {
    if (avatarUrl) {
      return { id: 'custom-avatar', url: avatarUrl, style: 'custom' };
    }

    const storedAvatar = localStorage.getItem('userAvatar') || 'gradient-1';
    return getAvatarData(storedAvatar);
  }, [avatarUrl]);

  const walletBalance = useMemo(() => balance ?? 0, [balance]);
  const isBalanceLoading = Boolean(isLoading || balanceLoading);
  const balanceDisplay = isBalanceLoading ? '...' : balance == null ? '—' : walletBalance.toFixed(4);

  const formattedMatches = useMemo(() => {
    const now = Date.now();

    return recentMatches.map((match) => {
      const isWin = match.result === 'win';
      const resultLabel = isWin ? 'Victory' : 'Defeat';
      const amount = isWin
        ? match.profit != null
          ? `+${match.profit.toFixed(4)} SOL`
          : 'Won'
        : match.stakeAmount != null
          ? `-${match.stakeAmount.toFixed(4)} SOL`
          : 'Lost';

      const timestamp = match.createdAt ? new Date(match.createdAt).getTime() : now;
      const diff = now - timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      let timeStr = '';
      if (days > 0) timeStr = `${days}d ago`;
      else if (hours > 0) timeStr = `${hours}h ago`;
      else if (minutes > 0) timeStr = `${minutes}m ago`;
      else timeStr = 'Just now';

      const scoreLine =
        match.playerScore != null && match.opponentScore != null
          ? ` (${match.playerScore}-${match.opponentScore})`
          : '';

      return {
        result: `${resultLabel}${scoreLine}`,
        amount,
        time: timeStr,
        color: isWin ? '#00FFA3' : '#FF4444',
        id: match.id,
      };
    });
  }, [recentMatches]);

  useEffect(() => {
    if (!rewardsData || toastShownRef.current) {
      return;
    }

    const hasRefPoints = (rewardsData.reflexPoints ?? 0) >= 50;
    const pendingToast =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('referral_toast_pending') === 'true'
        : false;
    const hasSeenToast =
      typeof localStorage !== 'undefined' ? localStorage.getItem('referral_toast_shown') : null;

    if (hasRefPoints && pendingToast && !hasSeenToast) {
      toastShownRef.current = true;

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('referral_toast_shown', 'true');
        localStorage.removeItem('referral_toast_pending');
      }

      toast.custom(
        () => (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0B0F1A]/95 border border-[#00FFA3]/50 shadow-[0_0_30px_rgba(0,255,163,0.2)] w-full max-w-sm backdrop-blur-md animate-in slide-in-from-top-5 duration-500">
            <div className="relative p-2 bg-[#00FFA3]/20 rounded-full shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-[#00FFA3]/20 animate-ping rounded-full"></div>
              <Gift className="relative w-6 h-6 text-[#00FFA3]" />
            </div>
            <div>
              <p className="text-[#00FFA3] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                Referral Bonus Active!
              </p>
              <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                Welcome to the Arena. You've received a starting bonus.
              </p>
              <div className="flex items-center gap-1.5 mt-2 bg-[#00FFA3]/10 border border-[#00FFA3]/20 px-3 py-1.5 rounded-lg w-fit">
                <Zap className="w-3.5 h-3.5 text-[#00FFA3]" fill="#00FFA3" />
                <span className="text-xs font-bold text-[#00FFA3]">+50 Reflex Points</span>
              </div>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
    }
  }, [rewardsData]);

  return (
    <div id="page-root" className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-3 xs:p-4 sm:p-6 relative overflow-hidden">
      <FuturisticBackground />
      
      <div className="relative z-10 max-w-md mx-auto">
        {/* Header with Avatar and Balance */}
        <div className="relative mb-4 xs:mb-6">
         
          <div className="relative backdrop-blur-[3px] border-2 border-[#00FFA3]/50 rounded-2xl overflow-hidden">
           
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
                </div>
              </div>
              
              {/* Wallet Balance Section - Reduced Height */}
              <div className="relative">
                {/* Inner glow border - static */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 blur opacity-50 rounded-xl"></div>
                
                <div className="relative backdrop-blur-[3px] border border-[#00FFA3]/30 rounded-xl p-4 overflow-hidden">
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
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg">
                        <Zap className="w-4 h-4 text-[#00FFA3]" />
                      </div>
                      <h3 className="text-white text-sm">Wallet Balance</h3>
                    </div>

                    <div className="flex justify-end mb-3">
                      {/* Jackpot CTA matches Rewards Access styling with a fixed height to preserve layout */}
                      <button
                        type="button"
                        onClick={() => setShowJackpot(true)}
                        className="group relative h-[44px] overflow-hidden transition-all duration-300"
                        style={{
                          clipPath:
                            'polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))',
                        }}
                      >
                        <span
                          className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] p-[2px]"
                          style={{
                            clipPath:
                              'polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))',
                          }}
                        >
                          <span className="block h-full bg-gradient-to-br from-[#00FFA3]/30 via-[#06B6D4]/30 to-[#7C3AED]/30 backdrop-blur-md"></span>
                        </span>

                        <span className="absolute inset-0">
                          <span className="absolute inset-0 bg-gradient-to-br from-[#00A876] via-[#0582A8] to-[#5A28B0] group-hover:from-[#0582A8] group-hover:via-[#00A876] group-hover:to-[#5A28B0] transition-all duration-500"></span>
                          <span
                            className="absolute inset-0 opacity-10"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l6 10h8l-6 10 6 10h-8l-6 10-6-10H6l6-10-6-10h8z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
                              backgroundSize: '20px 20px',
                            }}
                          ></span>
                          <span
                            className="absolute inset-0 opacity-20"
                            style={{
                              backgroundImage:
                                'linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.3) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.3) 76%, transparent 77%)',
                              backgroundSize: '8px 8px',
                            }}
                          ></span>
                          <span
                            className="absolute inset-0 opacity-30"
                            style={{
                              backgroundImage:
                                'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                            }}
                          ></span>
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full"></span>
                          <span className="absolute inset-0 bg-radial-gradient from-white/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
                        </span>

                        <span className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-white/80"></span>
                        <span className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-white/80"></span>
                        <span className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-white/80"></span>
                        <span className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-white/80"></span>
                        <span className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white to-transparent"></span>
                        <span className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white to-transparent"></span>
                        <span className="absolute left-0 top-1/2 h-6 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-white to-transparent"></span>
                        <span className="absolute right-0 top-1/2 h-6 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-white to-transparent"></span>

                        <span className="relative flex h-full flex-col items-center justify-center px-4 py-2 text-center">
                          <span className="relative mb-1.5">
                            <span className="absolute inset-0 -m-2 rounded-full border-2 border-white/30 transition-all duration-300 group-hover:scale-125 group-hover:border-white/60"></span>
                            <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/30 backdrop-blur-sm transition-all group-hover:bg-white/40">
                              <Trophy className="h-4 w-4 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" fill="white" />
                            </span>
                            <span className="absolute top-0 right-0 h-1 w-1 rounded-full bg-white opacity-0 transition-opacity group-hover:animate-ping group-hover:opacity-100"></span>
                            <span
                              className="absolute bottom-0 left-0 h-1 w-1 rounded-full bg-white opacity-0 transition-opacity group-hover:animate-ping group-hover:opacity-100"
                              style={{ animationDelay: '150ms' }}
                            ></span>
                          </span>
                          <span className="relative">
                            <span
                              className="mb-0.5 block text-xs uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                              style={{ textShadow: '0 0 10px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}
                            >
                              Jackpot
                            </span>
                            <span className="mb-1 block h-px bg-gradient-to-r from-transparent via-white/70 to-transparent transition-all group-hover:via-white"></span>
                            <span className="flex items-center justify-center gap-0.5">
                              <span
                                className="text-[10px] uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                style={{ textShadow: '0 0 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}
                              >
                                Access
                              </span>
                              <svg
                                className="h-3 w-3 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </span>
                          <span className="absolute bottom-1 left-2 right-2 h-0.5 overflow-hidden rounded-full bg-black/20">
                            <span className="block h-full w-0 bg-white/60 transition-all duration-500 group-hover:w-full"></span>
                          </span>
                        </span>
                      </button>
                    </div>

                    <div className="mb-3">
                      <p className="text-3xl text-[#00FFA3] font-bold">
                        {balanceDisplay}
                        <span className="text-lg text-gray-400 ml-2">SOL</span>
                      </p>
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
            className="w-full bg-white/10 backdrop-blur-sm border border-[#7C3AED]/30 hover:bg-white/10 hover:border-[#7C3AED]/60 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] text-white p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Gift className="w-6 h-6 text-[#7C3AED]" />
            <span>Ambassador Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('rewards')}
            className="relative w-full backdrop-blur-sm overflow-hidden p-4 rounded-xl transition-all duration-300 group"
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
            className="w-full bg-white/10 backdrop-blur-sm border border-[#06B6D4]/30 hover:bg-white/10 hover:border-[#06B6D4]/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-white p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            <TrendingUp className="w-6 h-6 text-[#06B6D4]" />
            <span>My Stats</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] text-white p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Settings className="w-6 h-6 text-gray-300" />
            <span>Settings</span>
          </button>
        </div>

        {/* Recent Activity - Futuristic Panel */}
        <div className="relative">
          {/* Multi-layer border effect */}
          <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/10 via-[#06B6D4]/10 to-[#7C3AED]/10" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}></div>
          
          <div className="relative bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg overflow-hidden" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
            {/* Top decorative line */}
            <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#00FFA3]/50 to-transparent"></div>
            
            {/* Corner indicators */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#00FFA3]/50"></div>
            <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#06B6D4]/50"></div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs text-gray-400 uppercase tracking-widest">Recent Staked Matches</h3>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-[#00FFA3] rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-[#06B6D4] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-[#7C3AED] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                {matchesLoading ? (
                  <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-400">Loading recent matches...</p>
                  </div>
                ) : formattedMatches.length === 0 ? (
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
                  formattedMatches.map((match, i) => (
                    <div key={match.id ?? i} className="relative group">
                      <div className="flex items-center justify-between py-3 px-3 bg-white/10 backdrop-blur-sm border-l-2 transition-all hover:bg-white/10" style={{ borderColor: match.color }}>
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
                      {i < formattedMatches.length - 1 && <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mt-2"></div>}
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
        currentBalance={walletBalance}
      />
      <JackpotDialog
        open={showJackpot}
        onClose={() => setShowJackpot(false)}
      />
    </div>
  );
}
