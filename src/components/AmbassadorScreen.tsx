import { ArrowLeft, Copy, Share2, Gift, Users, Trophy, Check, Zap, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAmbassadorData } from '../features/auth/hooks/useAmbassadorData';
import { copyToClipboard } from '../utils/clipboard';
import { FuturisticBackground } from './FuturisticBackground';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface AmbassadorScreenProps {
  onNavigate: (screen: string) => void;
  referralLink?: string;
  activePlayers?: number;
  totalInvited?: number;
  playerName?: string;
  isLoading?: boolean;
}

export function AmbassadorScreen({
  onNavigate,
  referralLink,
  activePlayers: initialActivePlayers = 0,
  totalInvited: initialTotalInvited,
  playerName,
  isLoading,
}: AmbassadorScreenProps) {
  useScrollToTop();
  const { data } = useAmbassadorData();
  const [copied, setCopied] = useState(false);
  const resolvedReferralLink = data?.referralLink ?? referralLink;
  const resolvedActivePlayers = data?.activeReferrals ?? initialActivePlayers;
  const resolvedTotalInvited = data?.totalReferrals ?? initialTotalInvited;
  const [activePlayers, setActivePlayers] = useState(resolvedActivePlayers);

  useEffect(() => {
    setActivePlayers(resolvedActivePlayers);
  }, [resolvedActivePlayers]);

  const totalInvited = resolvedTotalInvited ?? activePlayers;
  
  // Calculate current tier based on active players
  const getCurrentTier = (players: number): string => {
    if (players < 10) return 'Bronze';
    if (players < 30) return 'Silver';
    return 'Gold';
  };
  
  const currentTier = getCurrentTier(activePlayers);
  
  // Calculate progress to next tier
  const calculateTierProgress = (players: number, tier: string): number => {
    if (tier === 'Bronze') {
      return (players / 10) * 100;
    } else if (tier === 'Silver') {
      return ((players - 10) / 20) * 100;
    } else {
      return 100; // Gold tier maxed out
    }
  };
  
  const tierProgress = calculateTierProgress(activePlayers, currentTier);

  const handleCopyLink = () => {
    if (!resolvedReferralLink) return;

    copyToClipboard(resolvedReferralLink);
    setCopied(true);
    toast.success('Referral link copied!', {
      description: 'Share it with your friends to earn Reflex Points',
      duration: 3000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchedReferrals = data?.referralsList ?? [];
  const referredPlayers = fetchedReferrals.map((player) => ({
    id: player.id,
    name: player.name,
    status: player.status,
    matches: player.matches ?? 0,
    progress: Math.min(((player.matches ?? 0) / 10) * 100, 100),
    points: player.status === 'active' ? 100 : 0,
  }));

  const getTierInfo = (tier: string) => {
    switch(tier) {
      case 'Bronze':
        return { color: '#CD7F32', next: 'Silver', needed: 10, gradient: 'from-[#CD7F32]/30 to-[#CD7F32]/10', currentPoints: 90, nextPoints: 100 };
      case 'Silver':
        return { color: '#C0C0C0', next: 'Gold', needed: 30, gradient: 'from-[#C0C0C0]/30 to-[#C0C0C0]/10', currentPoints: 100, nextPoints: 110 };
      case 'Gold':
        return { color: '#FFD700', next: 'Max Tier', needed: 30, gradient: 'from-[#FFD700]/30 to-[#FFD700]/10', currentPoints: 110, nextPoints: 110 };
      default:
        return { color: '#CD7F32', next: 'Silver', needed: 10, gradient: 'from-[#CD7F32]/30 to-[#CD7F32]/10', currentPoints: 90, nextPoints: 100 };
    }
  };

  const tierInfo = getTierInfo(currentTier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-6 relative overflow-hidden">
      {/* Background effects */}
      <FuturisticBackground />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-[#00FFA3]/50 p-3 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl text-white mb-1">Ambassador Dashboard</h1>
            <p className="text-sm text-gray-400">Build your network. Earn rewards.</p>
          </div>
        </div>

        {/* Tier Status Card - At Top */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#7C3AED]/20 to-[#00FFA3]/20 blur-sm" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}></div>
          
          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl overflow-hidden" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>
            
            {/* Corner indicators */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#7C3AED]/50"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#00FFA3]/50"></div>
            
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${tierInfo.gradient} border border-white/10`}>
                    <Trophy className="w-6 h-6" style={{ color: tierInfo.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Current Tier</p>
                    <p className="text-xl text-white" style={{ color: tierInfo.color }}>{currentTier}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Next: {tierInfo.next}</p>
                  <p className="text-sm text-[#00FFA3]">{activePlayers}/{tierInfo.needed} active</p>
                </div>
              </div>
              
              {/* Futuristic Transparent Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress to {tierInfo.next}</span>
                  <span className="text-[#00FFA3]">{tierProgress.toFixed(0)}%</span>
                </div>
                
                {/* Custom transparent futuristic progress bar */}
                <div className="relative h-3 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full overflow-hidden">
                  {/* Background grid pattern */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)'
                  }}></div>
                  
                  {/* Progress fill with gradient */}
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      currentTier === 'Gold' 
                        ? 'bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FF8C00]' 
                        : currentTier === 'Silver'
                        ? 'bg-gradient-to-r from-[#C0C0C0] via-[#00FFA3] to-[#06B6D4]'
                        : 'bg-gradient-to-r from-[#CD7F32] via-[#7C3AED] to-[#00FFA3]'
                    }`}
                    style={{ width: `${tierProgress}%` }}
                  ></div>
                  
                  {/* Border glow - matches tier color */}
                  <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                    currentTier === 'Gold'
                      ? 'border border-[#FFD700]/40 shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                      : currentTier === 'Silver'
                      ? 'border border-[#00FFA3]/30'
                      : 'border border-[#CD7F32]/30'
                  }`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Invited', value: totalInvited, color: '#06B6D4', icon: Users, suffix: '' },
            { label: 'Active Players', value: activePlayers, color: '#00FFA3', icon: Target, suffix: '' },
          ].map((stat, i) => (
            <div key={i} className="relative group">
              <div className="absolute -inset-px bg-gradient-to-br from-white/10 to-white/5 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}></div>
              
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 shadow-lg overflow-hidden transition-all" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                <div className="absolute top-0 left-0 w-2 h-px" style={{ backgroundColor: stat.color }}></div>
                
                <div className="p-3 text-center">
                  <stat.icon className="w-4 h-4 mx-auto mb-2" style={{ color: stat.color }} />
                  <p className="text-2xl text-white mb-1">{stat.value}{stat.suffix}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* CTA to Rewards Center */}
          <div className="relative group cursor-pointer" onClick={() => onNavigate('rewards')}>
            {/* Outer glow layers */}
            <div className="absolute -inset-2 bg-gradient-to-br from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] opacity-50 group-hover:opacity-80 blur-xl transition-all duration-500"></div>
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#7C3AED] via-[#00FFA3] to-[#06B6D4] opacity-60 group-hover:opacity-100 blur-md transition-all duration-500"></div>
            
            {/* Main button container with angled cuts */}
            <div className="relative overflow-hidden transition-all duration-300 group-hover:scale-105" style={{ clipPath: 'polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))' }}>
              {/* Triple border layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] p-[2px]" style={{ clipPath: 'polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                <div className="bg-gradient-to-br from-[#00FFA3]/30 via-[#06B6D4]/30 to-[#7C3AED]/30 h-full backdrop-blur-md"></div>
              </div>
              
              {/* Animated background layers */}
              <div className="absolute inset-0">
                {/* Base gradient - DARKER */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00A876] via-[#0582A8] to-[#5A28B0] group-hover:from-[#0582A8] group-hover:via-[#00A876] group-hover:to-[#5A28B0] transition-all duration-500"></div>
                
                {/* Hexagon pattern overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l6 10h8l-6 10 6 10h-8l-6 10-6-10H6l6-10-6-10h8z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
                  backgroundSize: '20px 20px'
                }}></div>
                
                {/* Animated grid lines */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.3) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.3) 76%, transparent 77%)',
                  backgroundSize: '8px 8px'
                }}></div>
                
                {/* Diagonal scan lines */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                }}></div>
                
                {/* Moving shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                
                {/* Pulsing center glow */}
                <div className="absolute inset-0 bg-radial-gradient from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              
              {/* Corner indicators */}
              <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-white/80"></div>
              <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-white/80"></div>
              <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-white/80"></div>
              <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-white/80"></div>
              
              {/* Top accent line */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
              
              {/* Side accent markers */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6 bg-gradient-to-b from-transparent via-white to-transparent"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-gradient-to-b from-transparent via-white to-transparent"></div>
              
              {/* Content */}
              <div className="relative p-3 text-center flex flex-col items-center justify-center h-full">
                {/* Icon container with multiple layers */}
                <div className="relative mb-1.5">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 -m-2 rounded-full border-2 border-white/30 group-hover:border-white/60 transition-all group-hover:scale-125 duration-300"></div>
                  
                  {/* Icon background */}
                  <div className="relative p-2 bg-white/30 rounded-full backdrop-blur-sm border border-white/50 group-hover:bg-white/40 transition-all">
                    <Zap className="w-4 h-4 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" fill="white" />
                  </div>
                  
                  {/* Orbiting particles */}
                  <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                  <div className="absolute bottom-0 left-0 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '150ms' }}></div>
                </div>
                
                {/* Text with shadow */}
                <div className="relative">
                  <p className="text-xs text-white uppercase tracking-[0.2em] mb-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>Rewards</p>
                  
                  {/* Animated underline */}
                  <div className="h-px bg-gradient-to-r from-transparent via-white/70 to-transparent mb-1 group-hover:via-white transition-all"></div>
                  
                  <div className="flex items-center gap-0.5 justify-center">
                    <p className="text-[10px] text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 0 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>Access</p>
                    <svg className="w-3 h-3 text-white group-hover:translate-x-1 transition-transform duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                {/* Bottom status bar */}
                <div className="absolute bottom-1 left-2 right-2 h-0.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/60 w-0 group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Link Section */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 blur-sm" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}></div>

          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl overflow-hidden" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>

            <div className="p-5">
              <h3 className="text-sm text-gray-300 uppercase tracking-wider mb-3">Your Referral Link</h3>

              <div className="relative mb-4">
                <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20" style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}></div>
              <div className="relative bg-[#0B0F1A]/50 backdrop-blur-sm p-3 text-sm text-gray-300 break-all border border-white/10" style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
                {resolvedReferralLink ?? 'No referral link available yet.'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopyLink}
                disabled={!resolvedReferralLink || isLoading}
                className="relative bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] text-[#0B0F1A] py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy Link</span>
                    </>
                  )}
                </button>

                <button className="relative bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#06B6D4]/50 text-white py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Info Box - How It Works & Rewards (Dynamic Tier Colors) */}
        <div className="relative mb-6">
          {/* Dynamic glow based on current tier */}
          <div 
            className="absolute -inset-1 blur-md rounded-xl" 
            style={{
              background: currentTier === 'Gold'
                ? 'linear-gradient(to right, rgba(255, 215, 0, 0.3), rgba(255, 165, 0, 0.3))'
                : currentTier === 'Silver'
                ? 'linear-gradient(to right, rgba(192, 192, 192, 0.3), rgba(0, 255, 163, 0.3))'
                : 'linear-gradient(to right, rgba(205, 127, 50, 0.3), rgba(124, 58, 237, 0.3))'
            }}
          ></div>
          
          <div 
            className="relative backdrop-blur-lg border-2 shadow-xl rounded-xl p-4"
            style={{
              background: currentTier === 'Gold'
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))'
                : currentTier === 'Silver'
                ? 'linear-gradient(135deg, rgba(192, 192, 192, 0.1), rgba(0, 255, 163, 0.05))'
                : 'linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(124, 58, 237, 0.05))',
              borderColor: currentTier === 'Gold'
                ? 'rgba(255, 215, 0, 0.4)'
                : currentTier === 'Silver'
                ? 'rgba(192, 192, 192, 0.4)'
                : 'rgba(205, 127, 50, 0.4)'
            }}
          >
            {/* Header with dynamic icon color */}
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: currentTier === 'Gold'
                    ? 'rgba(255, 215, 0, 0.2)'
                    : currentTier === 'Silver'
                    ? 'rgba(192, 192, 192, 0.2)'
                    : 'rgba(205, 127, 50, 0.2)'
                }}
              >
                <Trophy className="w-5 h-5" style={{ color: tierInfo.color }} />
              </div>
              <h3 className="text-white font-semibold">How Rewards & Tiers Work</h3>
            </div>

            {/* Key Points */}
            <div className="space-y-2.5 mb-3">
              {/* Point 1: Active Players */}
              <div className="flex items-start gap-2.5">
                <div 
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[#0B0F1A] text-xs font-bold mt-0.5"
                  style={{ backgroundColor: '#00FFA3' }}
                >
                  1
                </div>
                <div>
                  <p className="text-xs text-white leading-relaxed">
                    <span className="text-[#00FFA3] font-semibold">Active Player:</span> A player becomes "active" after completing <span className="text-[#00FFA3]">10 matches</span>. Until then, they don't count toward your tier.
                  </p>
                </div>
              </div>

              {/* Point 2: Rewards Trigger */}
              <div className="flex items-start gap-2.5">
                <div 
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[#0B0F1A] text-xs font-bold mt-0.5"
                  style={{ backgroundColor: tierInfo.color }}
                >
                  2
                </div>
                <div>
                  <p className="text-xs text-white leading-relaxed">
                    <span style={{ color: tierInfo.color }} className="font-semibold">Rewards Trigger:</span> When a player hits <span style={{ color: tierInfo.color }}>10 matches</span>, you earn <span style={{ color: tierInfo.color }}>{tierInfo.currentPoints} pts</span> (your current {currentTier} tier rate).
                  </p>
                </div>
              </div>

              {/* Point 3: Tier Progression */}
              <div className="flex items-start gap-2.5">
                <div 
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                  style={{ backgroundColor: '#06B6D4' }}
                >
                  3
                </div>
                <div>
                  <p className="text-xs text-white leading-relaxed">
                    <span className="text-[#06B6D4] font-semibold">Tier Unlock:</span> Tiers are based on <span className="text-[#06B6D4]">active players</span> (not total invited). You need {tierInfo.needed} active for {tierInfo.next}.
                  </p>
                </div>
              </div>
            </div>

            {/* Tier Rewards Table */}
            <div className="relative mb-3">
              <div 
                className="absolute -inset-px rounded-lg"
                style={{
                  background: currentTier === 'Gold'
                    ? 'linear-gradient(to right, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.1))'
                    : currentTier === 'Silver'
                    ? 'linear-gradient(to right, rgba(192, 192, 192, 0.2), rgba(0, 255, 163, 0.1))'
                    : 'linear-gradient(to right, rgba(205, 127, 50, 0.2), rgba(124, 58, 237, 0.1))'
                }}
              ></div>
              <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-2.5">
                <p className="text-xs text-white mb-1.5">Reward Points (per active player):</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#CD7F32]" />
                    <span className={currentTier === 'Bronze' ? 'text-[#CD7F32] font-semibold' : 'text-gray-400'}>Bronze: 90</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#C0C0C0]" />
                    <span className={currentTier === 'Silver' ? 'text-[#C0C0C0] font-semibold' : 'text-gray-400'}>Silver: 100</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#FFD700]" />
                    <span className={currentTier === 'Gold' ? 'text-[#FFD700] font-semibold' : 'text-gray-400'}>Gold: 110</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Tier Motivation */}
            {currentTier !== 'Gold' && (
              <div 
                className="relative mb-3"
                style={{
                  background: currentTier === 'Silver'
                    ? 'linear-gradient(to right, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))'
                    : 'linear-gradient(to right, rgba(192, 192, 192, 0.1), rgba(0, 255, 163, 0.05))',
                  border: '1px solid',
                  borderColor: currentTier === 'Silver'
                    ? 'rgba(255, 215, 0, 0.3)'
                    : 'rgba(192, 192, 192, 0.3)',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                <p className="text-xs text-white">
                  <Zap className="w-3 h-3 inline mr-1" style={{ color: currentTier === 'Silver' ? '#FFD700' : '#C0C0C0' }} />
                  Reach <span style={{ color: currentTier === 'Silver' ? '#FFD700' : '#C0C0C0' }}>{tierInfo.needed} active players</span> to unlock <span style={{ color: currentTier === 'Silver' ? '#FFD700' : '#C0C0C0' }}>{tierInfo.next}</span> tier and earn <span style={{ color: currentTier === 'Silver' ? '#FFD700' : '#C0C0C0' }}>{tierInfo.nextPoints} pts</span> per player!
                </p>
              </div>
            )}

            {/* Visual Example */}
            <div className="pt-3 border-t border-white/10">
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                <span style={{ color: tierInfo.color }}>Example:</span> Invite 20 players → 8 complete 10 matches → You have <span className="text-[#00FFA3]">8 active</span> + earned <span style={{ color: tierInfo.color }}>{8 * tierInfo.currentPoints} pts</span> → Still {currentTier} (need {tierInfo.needed} for {tierInfo.next})
              </p>
            </div>
          </div>
        </div>
        {/* Referred Players List */}
        <div className="relative">
          <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/10 to-[#06B6D4]/10" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}></div>
          
          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg overflow-hidden" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
            <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#00FFA3]/50 to-transparent"></div>
            
            {/* Corner indicators */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#00FFA3]/50"></div>
            <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#06B6D4]/50"></div>
            
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs text-gray-400 uppercase tracking-widest">Referred Players</h3>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00FFA3]" />
                  <span className="text-sm text-[#00FFA3]">{totalInvited}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {referredPlayers.length === 0 ? (
                  // Empty State
                  <div className="relative">
                    <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-8 text-center">
                      {/* Decorative elements */}
                      <div className="absolute top-2 left-2 w-16 h-16 border-t-2 border-l-2 border-[#00FFA3]/20 rounded-tl-lg"></div>
                      <div className="absolute bottom-2 right-2 w-16 h-16 border-b-2 border-r-2 border-[#06B6D4]/20 rounded-br-lg"></div>
                      
                      <div className="relative">
                        {/* Icon */}
                        <div className="mx-auto mb-4 p-4 bg-white/5 rounded-full border border-white/10 w-16 h-16 flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        
                        {/* Text */}
                        <h4 className="text-white mb-2">No Referrals Yet</h4>
                        <p className="text-sm text-gray-400 mb-4 max-w-xs mx-auto">
                          Share your referral link to start building your network and earning Reflex Points.
                        </p>
                        
                        {/* CTA */}
                        <button
                          onClick={handleCopyLink}
                          className="mx-auto bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 hover:from-[#00FFA3]/30 hover:to-[#06B6D4]/30 border border-[#00FFA3]/30 text-[#00FFA3] py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="text-sm">Copy Referral Link</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Player List
                  referredPlayers.map((player) => (
                    <div key={player.id} className="relative">
                      <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 hover:border-[#00FFA3]/30 rounded-lg p-3 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm">{player.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              player.status === 'active' 
                                ? 'bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/30' 
                                : player.status === 'pending'
                                ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {player.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {player.points > 0 && (
                              <>
                                <Zap className="w-3 h-3 text-[#00FFA3]" />
                                <span className="text-sm text-[#00FFA3]">+{player.points}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Futuristic transparent progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{player.matches}/10 matches</span>
                            <span className={player.progress >= 100 ? 'text-[#00FFA3]' : 'text-gray-400'}>
                              {player.progress}%
                            </span>
                          </div>
                          
                          {/* Transparent futuristic progress bar */}
                          <div className="relative h-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full overflow-hidden">
                            {/* Background grid */}
                            <div className="absolute inset-0 opacity-20" style={{
                              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 9px)'
                            }}></div>
                            
                            {/* Progress fill */}
                            <div 
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                player.progress >= 100 
                                  ? 'bg-gradient-to-r from-[#00FFA3] to-[#06B6D4]'
                                  : 'bg-gradient-to-r from-[#06B6D4] to-[#7C3AED]'
                              }`}
                              style={{ width: `${player.progress}%` }}
                            ></div>
                            
                            {/* Glow effect when complete */}
                            {player.progress >= 100 && (
                              <div className="absolute inset-0 rounded-full border border-[#00FFA3]/50 shadow-[0_0_10px_rgba(0,255,163,0.5)]"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
