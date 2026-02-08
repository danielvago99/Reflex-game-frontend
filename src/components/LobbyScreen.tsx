import { Bot, Users, ArrowLeft, Play, UserPlus, KeyRound, Zap, Ticket } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { FriendInviteDialog } from './friends/FriendInviteDialog';
import { FriendJoinDialog } from './friends/FriendJoinDialog';
import { TransactionModal } from './TransactionModal';
import { DailyChallengeCard } from './DailyChallengeCard';
import { FuturisticBackground } from './FuturisticBackground';
import { useRewardsData } from '../features/rewards/hooks/useRewardsData';
import { getFreeStakeOptions, getFreeStakeTotal } from '../features/rewards/utils/freeStakes';
import { MatchmakingOverlay, MatchmakingStatus } from './game/MatchmakingOverlay';
import { useWebSocket } from '../hooks/useWebSocket';
import { wsService } from '../utils/websocket';
import { toast } from 'sonner';

interface LobbyScreenProps {
  onNavigate: (screen: string) => void;
  onStartMatch?: (
    isRanked: boolean,
    stakeAmount: number,
    matchType: 'ranked' | 'friend' | 'bot',
    opponentName?: string
  ) => void;
  walletProvider?: string; // External wallet provider name (Phantom, Solflare, etc.)
}

export function LobbyScreen({ onNavigate, onStartMatch, walletProvider }: LobbyScreenProps) {
  const { data, consumeFreeStake } = useRewardsData();
  const { isConnected, send } = useWebSocket({ autoConnect: true });
  const [selectedMode, setSelectedMode] = useState<'bot' | 'ranked' | null>(null);
  const [selectedStake, setSelectedStake] = useState('0.1');
  const [activeTab, setActiveTab] = useState('quickplay');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [friendRoom, setFriendRoom] = useState<{ sessionId: string; roomCode: string; stakeAmount: number } | null>(null);
  const [selectedFreeStakeAmount, setSelectedFreeStakeAmount] = useState<number | null>(null);
  const [useFreeStakeMode, setUseFreeStakeMode] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchmakingStatus>('idle');
  const [opponentName, setOpponentName] = useState('');
  const [friendIntroOpen, setFriendIntroOpen] = useState(false);
  const [waitingForStakeConfirmation, setWaitingForStakeConfirmation] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<{
    sessionId: string;
    stake: number;
    isBot: boolean;
    matchType: 'ranked' | 'friend' | 'bot';
    roomCode?: string;
    opponentName?: string;
  } | null>(null);
  const suppressFriendRoomClose = Boolean(pendingMatch && pendingMatch.matchType === 'friend');
  const matchFoundTimeoutRef = useRef<number | null>(null);
  const stakeConfirmationTimeoutRef = useRef<number | null>(null);
  const pendingMatchRef = useRef<{
    sessionId: string;
    stake: number;
    isBot: boolean;
    matchType: 'ranked' | 'friend' | 'bot';
    roomCode?: string;
    opponentName?: string;
  } | null>(null);
  const dailyMatchesPlayed = data?.dailyMatchesPlayed ?? data?.dailyProgress ?? 0;
  const dailyMatchesTarget = data?.dailyTarget ?? 5;
  const dailyStreak = data?.dailyStreak ?? data?.streak ?? 0;
  const dailyChallengeCompleted = dailyMatchesPlayed >= dailyMatchesTarget;

  const freeStakes = getFreeStakeOptions(data);
  const freeStakeTotal = getFreeStakeTotal(freeStakes);

  useEffect(() => {
    if (selectedMode !== 'ranked') {
      setSelectedFreeStakeAmount(null);
      setUseFreeStakeMode(false);
    }
  }, [selectedMode]);

  useEffect(() => {
    const unsubscribeSearching = wsService.on('match:searching', (message: any) => {
      console.log('match:searching payload received:', message?.payload);
      setMatchStatus('searching');
    });

    const unsubscribeMatchFound = wsService.on('match_found', (message: any) => {
      console.log('match_found payload received:', message?.payload);
      const payload = message?.payload ?? {};
      const matchType =
        payload.matchType === 'friend' || payload.matchType === 'ranked' || payload.matchType === 'bot'
          ? payload.matchType
          : payload.isBot
            ? 'bot'
            : 'ranked';
      const resolvedStake = payload.stakeAmount ?? payload.stake ?? parseFloat(selectedStake);
      const matchDetails = {
        sessionId: payload.sessionId as string,
        stake: resolvedStake,
        isBot: matchType === 'bot',
        matchType,
        roomCode: payload.roomCode,
        opponentName: payload.opponentName ?? (matchType === 'bot' ? 'Training Bot' : 'Unknown Opponent'),
      };

      setMatchStatus(matchType === 'friend' ? 'idle' : 'found');
      setOpponentName(matchDetails.opponentName ?? 'Unknown Opponent');
      setPendingMatch(matchDetails);
      pendingMatchRef.current = matchDetails;
      setShowInviteDialog(false);
      setShowJoinDialog(false);
      setWaitingForStakeConfirmation(false);
      setFriendIntroOpen(matchType === 'friend');
      if (matchType === 'friend') {
        setFriendRoom(null);
      }

      if (matchFoundTimeoutRef.current) {
        window.clearTimeout(matchFoundTimeoutRef.current);
      }

      if (matchType !== 'bot') {
        matchFoundTimeoutRef.current = window.setTimeout(() => {
          if (walletProvider) {
            void handleExternalWalletTransaction(matchDetails);
          } else {
            setShowTransactionModal(true);
          }
        }, 1500);
      }
    });

    const unsubscribeEnterArena = wsService.on('game:enter_arena', () => {
      console.log('game:enter_arena received');
      setWaitingForStakeConfirmation(false);
      setFriendIntroOpen(false);
      if (pendingMatchRef.current) {
        if (onStartMatch) {
          onStartMatch(
            pendingMatchRef.current.matchType === 'ranked',
            pendingMatchRef.current.stake,
            pendingMatchRef.current.matchType,
            pendingMatchRef.current.opponentName
          );
        } else {
          onNavigate('arena');
        }
      }
      setShowTransactionModal(false);
      setMatchStatus('idle');
    });

      const unsubscribeMatchCancelled = wsService.on('match:cancelled', (message: any) => {
      const payload = message?.payload ?? {};
      const isStakeCancel =
        payload.reason === 'stake_cancel' ||
        payload.reason === 'stake_cancel_timeout' ||
        payload.cancelReason === 'stake_cancel' ||
        payload.type === 'stake_cancel';
      const toastMessage = isStakeCancel
        ? 'Match cancelled due to stake cancel.'
        : payload.message ?? 'Match cancelled.';
      setMatchStatus('idle');
      setPendingMatch(null);
      pendingMatchRef.current = null;
      setOpponentName('');
      setShowTransactionModal(false);
      setWaitingForStakeConfirmation(false);
      setFriendIntroOpen(false);
      setFriendRoom(null);
      toast.info(toastMessage, {
        description: 'You have been returned to the lobby.',
      });
    });

    return () => {
      unsubscribeSearching();
      unsubscribeMatchFound();
      unsubscribeEnterArena();
      unsubscribeMatchCancelled();
      if (matchFoundTimeoutRef.current) {
        window.clearTimeout(matchFoundTimeoutRef.current);
        matchFoundTimeoutRef.current = null;
      }
      if (stakeConfirmationTimeoutRef.current) {
        window.clearTimeout(stakeConfirmationTimeoutRef.current);
        stakeConfirmationTimeoutRef.current = null;
      }
    };
  }, [onNavigate, onStartMatch, selectedStake, walletProvider]);

  useEffect(() => {
    if (!waitingForStakeConfirmation || !pendingMatchRef.current) {
      if (stakeConfirmationTimeoutRef.current) {
        window.clearTimeout(stakeConfirmationTimeoutRef.current);
        stakeConfirmationTimeoutRef.current = null;
      }
      return;
    }

    if (pendingMatchRef.current.matchType === 'bot') {
      return;
    }

    if (stakeConfirmationTimeoutRef.current) {
      window.clearTimeout(stakeConfirmationTimeoutRef.current);
    }

    stakeConfirmationTimeoutRef.current = window.setTimeout(() => {
      const matchToCancel = pendingMatchRef.current;
      if (!matchToCancel) return;
      send('match:cancel_stake', {
        sessionId: matchToCancel.sessionId,
        reason: 'stake_cancel_timeout',
      });
      setWaitingForStakeConfirmation(false);
      setMatchStatus('idle');
      setPendingMatch(null);
      pendingMatchRef.current = null;
    }, 15000);

    return () => {
      if (stakeConfirmationTimeoutRef.current) {
        window.clearTimeout(stakeConfirmationTimeoutRef.current);
        stakeConfirmationTimeoutRef.current = null;
      }
    };
  }, [send, waitingForStakeConfirmation]);

  const startRankedMatchmaking = () => {
    if (!isConnected) {
      toast.error('Connection lost. Reconnecting...');
      return;
    }

    setMatchStatus('searching');
    send('match:find', { stake: parseFloat(selectedStake) });
  };

  const handleStartMatch = async () => {
    // For bot mode (practice), no transaction needed
    if (selectedMode === 'bot') {
      if (!isConnected) {
        toast.error('Connection lost. Reconnecting...');
        return;
      }
      wsService.send('match:create_bot', {});
      return;
    }

    // For ranked mode
    if (selectedMode === 'ranked') {
      startRankedMatchmaking();
    }
  };

  // Handle transaction signing with external wallet providers
  const handleExternalWalletTransaction = async (matchDetails?: {
    sessionId: string;
    stake: number;
    isBot: boolean;
    matchType: 'ranked' | 'friend' | 'bot';
    opponentName?: string;
  }) => {
    try {
      // Get the wallet provider from window
      let provider: any;
      switch (walletProvider) {
        case 'Phantom':
          provider = (window as any).phantom?.solana;
          break;
        case 'Solflare':
          provider = (window as any).solflare;
          break;
        case 'Backpack':
          provider = (window as any).backpack;
          break;
        case 'Glow':
          provider = (window as any).glow;
          break;
        case 'Slope':
          provider = (window as any).Slope;
          break;
        case 'Coin98':
          provider = (window as any).coin98?.sol;
          break;
        default:
          throw new Error('Unknown wallet provider');
      }

      if (!provider) {
        throw new Error('Wallet provider not found');
      }

      if (!matchDetails) {
        throw new Error('Match details are missing');
      }

      // Skip transaction for free stakes (DAO treasury handles it)
      if (matchDetails.matchType === 'ranked' && useFreeStakeMode && selectedFreeStakeAmount) {
        try {
          await consumeFreeStake(selectedFreeStakeAmount);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to use free stake.';
          toast.error('Free stake unavailable', { description: message });
          return;
        }

        send('match:stake_confirmed', {
          sessionId: matchDetails.sessionId,
          stake: matchDetails.stake,
          matchType: matchDetails.matchType,
        });
        return;
      }

      // For regular SOL stakes, the wallet provider will show its native signing UI
      // In production, you would create the actual transaction here
      // For now, we'll simulate it
      
      // Example of how you'd create a real Solana transaction:
      // const transaction = new Transaction().add(
      //   SystemProgram.transfer({
      //     fromPubkey: provider.publicKey,
      //     toPubkey: new PublicKey('ESCROW_ADDRESS'),
      //     lamports: parseFloat(selectedStake) * 1e9 // Convert SOL to lamports
      //   })
      // );
      
      // The provider's native UI will automatically appear when calling signAndSendTransaction
      // const signature = await provider.signAndSendTransaction(transaction);
      
      // For demo purposes, simulate the external wallet approval
      console.log(`[${walletProvider}] Transaction signing requested for ${matchDetails.stake} SOL`);
      console.log('Native wallet UI would appear here for user approval...');
      
      // Simulate successful approval (in production, await actual signature)
      // The user would approve/reject in their wallet extension UI
      
      send('match:stake_confirmed', {
        sessionId: matchDetails.sessionId,
        stake: matchDetails.stake,
        matchType: matchDetails.matchType,
      });
      if (matchDetails.matchType !== 'bot') {
        setWaitingForStakeConfirmation(true);
      }
    } catch (error: any) {
      console.error('External wallet transaction error:', error);
      const reason = error?.code === 4001 ? 'transaction rejected' : 'transaction failed';
      if (pendingMatchRef.current) {
        send('match:stake_failed', {
          sessionId: pendingMatchRef.current.sessionId,
          reason,
        });
      }
      toast.error('Transaction failed', {
        description: 'Match cancelled due to transaction failure.',
      });
    }
  };

  const handleTransactionConfirm = async () => {
    if (pendingMatch?.matchType === 'ranked' && useFreeStakeMode && selectedFreeStakeAmount) {
      try {
        await consumeFreeStake(selectedFreeStakeAmount);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to use free stake.';
        toast.error('Free stake unavailable', { description: message });
        return;
      }
    }

    if (!pendingMatch) {
      toast.error('Match details unavailable', {
        description: 'Please try matchmaking again.',
      });
      return;
    }

    send('match:stake_confirmed', {
      sessionId: pendingMatch.sessionId,
      stake: pendingMatch.stake,
      matchType: pendingMatch.matchType,
    });
    
    setShowTransactionModal(false);
    if (pendingMatch.matchType !== 'bot') {
      setWaitingForStakeConfirmation(true);
    }
  };

  const handleTransactionCancelled = () => {
    send('match:cancel_stake', {});
    if (pendingMatchRef.current) {
      send('match:stake_failed', {
        sessionId: pendingMatchRef.current.sessionId,
        reason: 'transaction cancelled by user',
      });
    }
  };

  const handleTransactionFailure = (message: string) => {
    if (pendingMatchRef.current) {
      send('match:stake_failed', {
        sessionId: pendingMatchRef.current.sessionId,
        reason: message,
      });
    }
  };

  const handleFriendContinue = () => {
    setFriendIntroOpen(false);
    if (!pendingMatchRef.current) return;
    if (walletProvider) {
      void handleExternalWalletTransaction(pendingMatchRef.current);
      return;
    }
    setShowTransactionModal(true);
  };

  const handleCancelMatchmaking = () => {
    send('match:cancel', { stake: parseFloat(selectedStake) });
    setMatchStatus('idle');
  };

  const handleJoinSuccess = (roomCode: string) => {
    setShowJoinDialog(false);
    setActiveTab('friends');
    console.log('Joined friend room:', roomCode);
  };

  return (
    <div id="page-root" className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-3 xs:p-4 sm:p-6 relative overflow-hidden">
      <FuturisticBackground />
      
      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 xs:gap-4 mb-4 xs:mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/10 p-2.5 xs:p-3 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
          </button>
          <h1 className="text-xl xs:text-2xl text-white">Select Game Mode</h1>
        </div>

        {/* Daily Challenge Compact Widget */}
        <div className="mb-4 xs:mb-6">
          <DailyChallengeCard
            variant="compact"
            onClick={() => onNavigate('daily-challenge')}
            matchesPlayed={dailyMatchesPlayed}
            matchesTarget={dailyMatchesTarget}
            currentStreak={dailyStreak}
            isCompleted={dailyChallengeCompleted}
          />
        </div>

        {/* Tabs for Quick Play vs Friends */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 xs:mb-6">
          <TabsList className="bg-white/5 backdrop-blur-sm border border-white/10 w-full grid grid-cols-2 p-1">
            <TabsTrigger 
              value="quickplay"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00FFA3] data-[state=active]:to-[#06B6D4] data-[state=active]:text-[#0B0F1A] data-[state=active]:shadow-[0_0_20px_rgba(0,255,163,0.4)] text-gray-400 hover:text-white transition-all duration-300"
            >
              <Play className="w-4 h-4 mr-2" />
              Quick Play
            </TabsTrigger>
            <TabsTrigger 
              value="friends"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#06B6D4] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(124,58,237,0.4)] text-gray-400 hover:text-white transition-all duration-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Friends
            </TabsTrigger>
          </TabsList>

          {/* Quick Play Tab Content */}
          <TabsContent value="quickplay" className="space-y-4 mt-6">
            {/* Game Mode Selection */}
            <div className="space-y-4 mb-8">
              {/* Vs Bot */}
              <div 
                onClick={() => setSelectedMode('bot')}
                className="relative group cursor-pointer"
              >
                {/* Outer glow */}
                <div className={`absolute -inset-1 bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 blur-md transition-opacity duration-300 ${selectedMode === 'bot' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)' }}></div>
                
                <div className={`relative backdrop-blur-sm border-2 transition-all overflow-hidden ${selectedMode === 'bot' ? 'bg-[#00FFA3]/10 border-[#00FFA3]' : 'bg-white/5 border-[#00FFA3]/30 group-hover:border-[#00FFA3]'}`} style={{ clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)' }}>
                  {/* Top accent */}
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>
                  
                  {/* Corner indicators */}
                  <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-[#00FFA3]/50"></div>
                  
                  <div className="p-6 flex items-start gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-lg opacity-50"></div>
                      <div className="relative bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] p-4 transition-all" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                        <Bot className="w-8 h-8 text-[#0B0F1A]" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl text-white mb-2">Practice vs Bot</h3>
                      <p className="text-sm text-gray-400 mb-3">
                        Warm up and improve your skills against AI
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full"></div>
                          <span className="text-gray-300 text-xs">No stakes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full"></div>
                          <span className="text-gray-300 text-xs">Unlimited plays</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1v1 */}
              <div 
                onClick={() => setSelectedMode('ranked')}
                className="relative group cursor-pointer"
              >
                {/* Outer glow */}
                <div className={`absolute -inset-1 bg-gradient-to-br from-[#7C3AED]/30 to-[#06B6D4]/30 blur-md transition-opacity duration-300 ${selectedMode === 'ranked' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)' }}></div>
                
                <div className={`relative backdrop-blur-sm border-2 transition-all overflow-hidden ${selectedMode === 'ranked' ? 'bg-[#7C3AED]/10 border-[#7C3AED]' : 'bg-white/5 border-[#7C3AED]/30 group-hover:border-[#7C3AED]'}`} style={{ clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)' }}>
                  {/* Top accent */}
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent"></div>
                  
                  {/* Corner indicators */}
                  <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-[#7C3AED]/50"></div>
                  
                  {/* Scan line */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7C3AED]/5 to-transparent animate-pulse"></div>
                  
                  <div className="p-6 flex items-start gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] blur-lg opacity-50"></div>
                      <div className="relative bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-4 transition-all" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                        <Users className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl text-white">1v1 Ranked Match</h3>
                        <span className="bg-[#7C3AED]/30 text-white text-xs px-2 py-1 rounded backdrop-blur-sm border border-[#7C3AED]/50">Live</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Compete against real players and earn SOL
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full"></div>
                          <span className="text-gray-300 text-xs">Private Matchmaking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Entry Stake - Futuristic Panel - Only show for ranked mode */}
            {selectedMode === 'ranked' && (
            <div className="relative mb-6">
              <div className="absolute -inset-px" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}></div>
              
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl overflow-hidden" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
                {/* Decorative lines */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent"></div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white uppercase tracking-wider text-sm">Entry Stake</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-400">Locked</span>
                    </div>
                  </div>
                  
                  {/* Stake display */}
                  <div className="relative mb-4">
                    <div className="absolute -inset-px bg-gradient-to-r from-[#7C3AED]/30 to-[#06B6D4]/10" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}></div>
                    <div className="relative bg-gradient-to-r from-[#00FFA3]/10 to-[#06B6D4]/10 backdrop-blur-sm p-5" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Stake Amount</span>
                        <span className="text-2xl text-gray-200 drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]">
                          {selectedStake} SOL
                        </span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-200">Winner takes</span>
                        <span className="text-gray-200 drop-shadow-[0_0_6px_rgba(0,255,163,0.4)]">{(parseFloat(selectedStake) * 1.7).toFixed(2)} SOL</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-200">Staking fee</span>
                        <span className="text-gray-300">{(parseFloat(selectedStake) * 0.3).toFixed(2)} SOL</span>
                      </div>
                    </div>
                  </div>

                  {/* Stake Options */}
                  <div className="grid grid-cols-3 gap-3">
                    {['0.05', '0.1', '0.2'].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setSelectedStake(amount);
                          setSelectedFreeStakeAmount(null);
                          setUseFreeStakeMode(false);
                        }}
                        className={`relative transition-all group ${selectedStake === amount ? 'scale-105' : 'hover:scale-105'}`}
                      >
                        {selectedStake === amount ? (
                          <>
                            {/* Selected state - Reward button style */}
                            {/* Outer glow layers */}
                            <div className="absolute -inset-2 bg-gradient-to-br from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] opacity-50 blur-xl transition-all duration-500"></div>
                            <div className="absolute -inset-1 bg-gradient-to-tr from-[#7C3AED] via-[#00FFA3] to-[#06B6D4] opacity-60 blur-md transition-all duration-500"></div>
                            
                            {/* Main button container with angled cuts */}
                            <div className="relative overflow-hidden transition-all duration-300" style={{ clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                              {/* Triple border layers */}
                              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] p-[2px]" style={{ clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                                <div className="bg-gradient-to-br from-[#00FFA3]/30 via-[#06B6D4]/30 to-[#7C3AED]/30 h-full backdrop-blur-md"></div>
                              </div>
                              
                              {/* Animated background layers */}
                              <div className="absolute inset-0">
                                {/* Base gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#00A876] via-[#0582A8] to-[#5A28B0]"></div>
                                
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
                              </div>
                              
                              {/* Corner indicators */}
                              <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t border-l border-white/80"></div>
                              <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-white/80"></div>
                              <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b border-l border-white/80"></div>
                              <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b border-r border-white/80"></div>
                              
                              {/* Top accent line */}
                              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
                              <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
                              
                              {/* Content */}
                              <div className="relative p-3 text-center flex flex-col items-center justify-center h-full">
                                <p className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>
                                  {amount} <span className="text-xs">SOL</span>
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Unselected state - Minimal style */}
                            <div className="absolute -inset-1 bg-gradient-to-br from-[#00FFA3]/10 to-[#06B6D4]/10 opacity-0 group-hover:opacity-100 blur-md transition-all duration-300" style={{ clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))' }}></div>
                            
                            <div className="relative bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-[#00FFA3]/30 py-3 rounded-lg transition-all text-center overflow-hidden" style={{ clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                              <div className="absolute inset-0 opacity-5" style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                              }}></div>
                              <p className="relative text-gray-300 group-hover:text-white transition-colors">
                                {amount} <span className="text-xs">SOL</span>
                              </p>
                            </div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Free Stakes Section */}
                  {freeStakes.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-[#7C3AED]/20 rounded-lg">
                          <Zap className="w-4 h-4 text-[#7C3AED]" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm text-white uppercase tracking-wider">Free Stakes</h4>
                          <p className="text-xs text-gray-400">Earned from Reflex Points</p>
                        </div>
                        <div className="px-3 py-1 bg-gradient-to-r from-[#7C3AED]/20 to-[#00FFA3]/20 rounded-full border border-[#7C3AED]/30">
                          <span className="text-xs text-white font-medium">{freeStakeTotal} available</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {freeStakes.map((stake) => {
                          const stakeAmount = stake.amount;
                          const isSelected = selectedFreeStakeAmount === stakeAmount;

                          const colors = stakeAmount === 0.05
                            ? { from: '#00FFA3', to: '#06B6D4', text: 'text-[#00FFA3]', bg: 'bg-[#00FFA3]' }
                            : stakeAmount === 0.1 || stakeAmount === 0.10
                            ? { from: '#7C3AED', to: '#00FFA3', text: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]' }
                            : { from: '#06B6D4', to: '#7C3AED', text: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]' };

                          return (
                            <button
                              key={stakeAmount}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedStake('0.1');
                                  setSelectedFreeStakeAmount(null);
                                  setUseFreeStakeMode(false);
                                } else {
                                  setSelectedStake(stakeAmount.toString());
                                  setSelectedFreeStakeAmount(stakeAmount);
                                  setUseFreeStakeMode(true);
                                }
                              }}
                              className="relative group"
                            >
                              {isSelected ? (
                                <>
                                  <div
                                    className="absolute -inset-1 blur-lg opacity-60 animate-pulse"
                                    style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                                  ></div>

                                  <div
                                    className="relative border-2 rounded-xl p-4 shadow-xl"
                                    style={{
                                      background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                                      borderColor: colors.from
                                    }}
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                        <Ticket className="w-5 h-5 text-white" />
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg text-white font-bold">{stakeAmount}</div>
                                        <div className="text-[10px] text-white/90 uppercase tracking-wide">SOL</div>
                                      </div>
                                      <div className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded-full">
                                        <span className="text-[10px] text-white font-medium">×{stake.count}</span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div
                                    className="absolute -inset-1 opacity-0 group-hover:opacity-100 blur-md transition-all duration-300"
                                    style={{ background: `linear-gradient(135deg, ${colors.from}20, ${colors.to}20)` }}
                                  ></div>

                                  <div
                                    className="relative backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 group-hover:scale-105"
                                    style={{
                                      background: `linear-gradient(135deg, ${colors.from}10, ${colors.to}10)`,
                                      borderColor: `${colors.from}30`
                                    }}
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <div
                                        className="p-2 backdrop-blur-sm rounded-lg"
                                        style={{ backgroundColor: `${colors.from}20` }}
                                      >
                                        <Ticket className="w-5 h-5" style={{ color: colors.from }} />
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg text-white">{stakeAmount}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">SOL</div>
                                      </div>
                                      <div
                                        className="px-2 py-0.5 backdrop-blur-sm rounded-full"
                                        style={{ backgroundColor: `${colors.from}20` }}
                                      >
                                        <span className="text-[10px] font-medium" style={{ color: colors.from }}>×{stake.count}</span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Start Match Button */}
            {selectedMode && (
              <>
                <button
                  onClick={handleStartMatch}
                  className="w-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_40px_rgba(0,255,163,0.6)] text-[#0B0F1A] p-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3 animate-pulse hover:animate-none"
                >
                  <Play className="w-6 h-6" fill="currentColor" />
                  <span className="text-xl">Start Match</span>
                </button>

                {/* Info */}
                <p className="text-center text-sm text-gray-500 mt-4">
                  {selectedMode === 'ranked' 
                    ? `By starting a match, you agree to stake ${selectedStake} SOL`
                    : 'Practice mode - No stakes required'}
                </p>
              </>
            )}
          </TabsContent>

          {/* Friends Tab Content */}
          <TabsContent value="friends" className="space-y-4 mt-6">
            {/* Create Private Room */}
            <div 
              onClick={() => setShowInviteDialog(true)}
              className="relative group cursor-pointer"
            >
              {/* Outer glow */}
              <div className="absolute -inset-1 bg-gradient-to-br from-[#7C3AED]/30 to-[#06B6D4]/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)' }}></div>
              
              <div className="relative bg-white/5 backdrop-blur-sm border-2 border-[#7C3AED]/30 group-hover:border-[#7C3AED] transition-all overflow-hidden" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)' }}>
                {/* Top accent */}
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent"></div>
                
                {/* Corner indicators */}
                <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-[#7C3AED]/50"></div>
                
                <div className="p-6 flex items-start gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-4 transition-all" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                      <UserPlus className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl text-white mb-2">Create Private Room</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Start a private match and invite your friends
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full"></div>
                        <span className="text-gray-300 text-xs">Custom stakes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full"></div>
                        <span className="text-gray-300 text-xs">Private code</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Join by Code */}
            <div 
              onClick={() => setShowJoinDialog(true)}
              className="relative group cursor-pointer"
            >
              {/* Outer glow */}
              <div className="absolute -inset-1 bg-gradient-to-br from-[#06B6D4]/30 to-[#00FFA3]/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}></div>
              
              <div className="relative bg-white/5 backdrop-blur-sm border-2 border-[#06B6D4]/30 group-hover:border-[#06B6D4] transition-all overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}>
                {/* Top accent */}
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent"></div>
                
                {/* Corner indicators */}
                <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-[#06B6D4]/50"></div>
                
                <div className="p-6 flex items-start gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#06B6D4] to-[#00FFA3] blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-[#06B6D4] to-[#00FFA3] p-4 transition-all" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
                      <KeyRound className="w-8 h-8 text-[#0B0F1A]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl text-white mb-2">Join by Code</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Enter a room code to join your friend's match
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full"></div>
                        <span className="text-gray-300 text-xs">6-digit code</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full"></div>
                        <span className="text-gray-300 text-xs">Instant join</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[#7C3AED] mt-0.5" />
                <div>
                  <p className="text-white text-sm mb-1">Play with Friends</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Create a private room to invite specific friends, or join using a room code they share with you. 
                    Perfect for friendly competitions.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <MatchmakingOverlay
        status={matchStatus}
        onCancel={handleCancelMatchmaking}
        opponentName={opponentName}
      />

      {friendIntroOpen && pendingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#00FFA3]/20 via-[#06B6D4]/20 to-[#7C3AED]/20 blur-2xl opacity-60"></div>
            <div
              className="relative bg-black/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl overflow-hidden p-6 text-center"
              style={{
                clipPath:
                  'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
              }}
            >
              <div className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-[#00FFA3] to-transparent"></div>
              <div className="absolute top-0 left-0 w-px h-8 bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-8 h-px bg-gradient-to-l from-[#7C3AED] to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-px h-8 bg-gradient-to-t from-[#7C3AED] to-transparent"></div>

              <div className="relative space-y-4 text-center">
                <h2 className="text-2xl font-semibold text-white">Friend Match Ready</h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                  <p className="text-xs uppercase tracking-wider text-gray-400">Opponent</p>
                  <p className="truncate text-lg font-semibold text-white">{pendingMatch.opponentName ?? 'Unknown Opponent'}</p>
                  <p className="mt-4 text-xs uppercase tracking-wider text-gray-400">Stake</p>
                  <p className="text-lg font-semibold text-[#00FFA3]">◎ {pendingMatch.stake.toFixed(3)} SOL</p>
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Winner payout</p>
                      <p className="text-base font-semibold text-white">
                        ◎ {(pendingMatch.stake * 2 * 0.85).toFixed(3)} SOL
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Review the details and continue to confirm your stake.
                </p>
                <button
                  onClick={handleFriendContinue}
                  className="w-full rounded-lg bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] px-4 py-3 font-semibold text-[#0B0F1A] transition hover:shadow-[0_0_25px_rgba(0,255,163,0.4)]"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {waitingForStakeConfirmation && pendingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#7C3AED]/20 via-[#00FFA3]/20 to-[#06B6D4]/20 blur-2xl opacity-60"></div>
            <div
              className="relative bg-black/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl overflow-hidden p-6 text-center"
              style={{
                clipPath:
                  'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
              }}
            >
              <div className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-[#00FFA3] to-transparent"></div>
              <div className="absolute top-0 left-0 w-px h-8 bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-8 h-px bg-gradient-to-l from-[#7C3AED] to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-px h-8 bg-gradient-to-t from-[#7C3AED] to-transparent"></div>

              <div className="relative space-y-4">
                <div
                  className="mx-auto h-12 w-12 animate-spin rounded-full shadow-[0_0_18px_rgba(124,58,237,0.6)]"
                  style={{
                    background: 'conic-gradient(from 0deg, #7C3AED, #00FFA3, #06B6D4, #7C3AED)',
                    WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)',
                    mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)',
                  }}
                ></div>
                <div>
                  <p className="text-lg font-semibold text-white">Waiting for opponent to confirm stake...</p>
                  <p className="text-sm text-gray-400">
                    {pendingMatch.opponentName ?? 'Your opponent'} needs to confirm ◎ {pendingMatch.stake.toFixed(3)} SOL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <FriendInviteDialog 
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        roomInfo={friendRoom}
        onRoomCreated={setFriendRoom}
        suppressRoomClose={suppressFriendRoomClose}
      />
      
      <FriendJoinDialog 
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onJoinSuccess={handleJoinSuccess}
      />
      
      <TransactionModal 
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        onConfirm={handleTransactionConfirm}
        onCancel={handleTransactionCancelled}
        onFailure={handleTransactionFailure}
        stakeAmount={pendingMatch?.stake ?? parseFloat(selectedStake)}
        isFreeStake={useFreeStakeMode}
      />
    </div>
  );
}
