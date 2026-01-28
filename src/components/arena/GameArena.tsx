import { useState, useEffect, useCallback, useRef } from 'react';
import { HUD } from './HUD';
import { ArenaCanvas } from './ArenaCanvas';
import { BottomBar } from './BottomBar';
import { PauseMenu } from './PauseMenu';
import { ForfeitConfirmDialog } from './ForfeitConfirmDialog';
import { CountdownOverlay } from './CountdownOverlay';
import { RoundResultModal } from './RoundResultModal';
import { GameResultModal } from './GameResultModal';
import { TargetHintPanel } from './TargetHintPanel';
import { HowToPlayOverlay } from './HowToPlayOverlay';
import { FullscreenToggle } from './FullscreenToggle';
import { CustomStatusBar } from './CustomStatusBar';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { MAX_ROUNDS, ROUNDS_TO_WIN } from '../../features/arena/constants';
import { useGame } from '../../features/arena/context/GameProvider';
import { useWebSocket, useWebSocketEvent } from '../../hooks/useWebSocket';
import type { WSRoundPrepare, WSRoundResult, WSRoundShowTarget } from '../../types/api';

interface GameArenaProps {
  onQuit: () => void;
  isRanked?: boolean;
  stakeAmount?: number;
  matchType?: 'ranked' | 'friend' | 'bot'; // Add matchType prop
  opponentName?: string;
}

type GameState = 'countdown' | 'playing' | 'result';

interface Target {
  shape: 'circle' | 'square' | 'triangle';
  color: string;
  colorName: string;
}

export function GameArena({
  onQuit,
  isRanked = false,
  stakeAmount = 0,
  matchType = 'bot',
  opponentName,
}: GameArenaProps) {
  const { playerName } = useGame();
  // Game state
  const [gameState, setGameState] = useState<GameState>('countdown');
  const [currentRound, setCurrentRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showForfeitDialog, setShowForfeitDialog] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(true);
  const [playerReactionTime, setPlayerReactionTime] = useState<number | null>(null);
  const [opponentReactionTime, setOpponentReactionTime] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | null>(null);
  const [currentTarget, setCurrentTarget] = useState<Target | null>(null);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [allPlayerTimes, setAllPlayerTimes] = useState<(number | null)[]>(Array(MAX_ROUNDS).fill(null));
  const [allOpponentTimes, setAllOpponentTimes] = useState<(number | null)[]>(Array(MAX_ROUNDS).fill(null));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [roundResolved, setRoundResolved] = useState(false);
  const [lossReason, setLossReason] = useState<'early-click' | 'no-reaction' | 'slower' | null>(null);
  const [targetShowSignal, setTargetShowSignal] = useState(0);
  const [hasSentClick, setHasSentClick] = useState(false);
  const [hasRequestedInitialRound, setHasRequestedInitialRound] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  const isWaitingForTarget = currentTarget === null;

  const targetShownTimestampRef = useRef<number | null>(null);

  const targetShapes: Target['shape'][] = ['circle', 'square', 'triangle'];
  const targetColors = ['#00FF00', '#FF0000', '#0000FF', '#FFFF00', '#9333EA', '#06B6D4', '#FF6B00', '#FF0099'];
  const targetColorNames: Record<string, string> = {
    '#FF0000': 'Red',
    '#00FF00': 'Green',
    '#0000FF': 'Blue',
    '#FFFF00': 'Yellow',
    '#9333EA': 'Purple',
    '#06B6D4': 'Cyan',
    '#FF6B00': 'Orange',
    '#FF0099': 'Pink',
  };

  const [defaultTarget] = useState<Target>(() => {
    const shape = targetShapes[Math.floor(Math.random() * targetShapes.length)];
    const color = targetColors[Math.floor(Math.random() * targetColors.length)];

    return {
      shape,
      color,
      colorName: targetColorNames[color] ?? 'Target',
    };
  });

  const { isConnected, send } = useWebSocket({ autoConnect: true });

  const MAX_PAUSES = 3;
  const isMatchOver =
    playerScore >= ROUNDS_TO_WIN ||
    opponentScore >= ROUNDS_TO_WIN ||
    currentRound >= MAX_ROUNDS;

  // Detect mobile
  const isMobile = window.innerWidth < 640;

  // Reset all game state for restart
  const handleRestart = () => {
    if (isConnected) {
      send('match:reset', {
        stake: stakeAmount,
        matchType,
      });
    }

    setGameState('countdown');
    setCurrentRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setShowPauseMenu(false);
    setPlayerReactionTime(null);
    setOpponentReactionTime(null);
    setRoundResult(null);
    setCurrentTarget(null);
    setShowFinalResults(false);
    setAllPlayerTimes(Array(MAX_ROUNDS).fill(null));
    setAllOpponentTimes(Array(MAX_ROUNDS).fill(null));
    setRoundResolved(false);
    setLossReason(null);
    setShowHowToPlay(true);
    setHasRequestedInitialRound(false);
    setTargetShowSignal(0);
    setWaitingForOpponent(false);
  };

  // Players (get from profile in real app)
  const player = {
    name: playerName || 'You',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player1',
  };

  const opponent = {
    name: opponentName ?? (matchType === 'bot' ? 'Training Bot' : 'Opponent'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=opponent1',
  };

  const prepareRound = useCallback(
    (roundNumber: number) => {
      setPlayerReactionTime(null);
      setOpponentReactionTime(null);
      setRoundResolved(false);
      setLossReason(null);
      setHasSentClick(false);
      setTargetShowSignal(0);
      setCurrentTarget(null);

      if (!isConnected) {
        toast.error('WebSocket disconnected', {
          description: 'Reconnecting to game server...'
        });
        return;
      }

      const roundReadyPayload: { round: number; stake: number } = {
        round: roundNumber,
        stake: stakeAmount,
      };

      send('round:ready', roundReadyPayload);
    },
    [isConnected, send, stakeAmount]
  );

  const handleTargetAppeared = () => {};

  const handleTargetDisappeared = () => {};

  const handleReact = (e?: { isTrusted?: boolean }) => {
    if (e && !e.isTrusted) return;

    if (gameState !== 'playing' || roundResolved || hasSentClick) return;

    setHasSentClick(true);

    if (!isConnected) {
      toast.error('Not connected to game server', {
        description: 'Attempting to reconnect...'
      });
      setHasSentClick(false);
      return;
    }

    const duration = Date.now() - (targetShownTimestampRef.current ?? Date.now());

    send('player:click', {
      clientTimestamp: Date.now(),
      clientDuration: duration,
      round: currentRound,
    });
  };

  const handleRoundResult = useCallback((result: WSRoundResult) => {
    setRoundResolved(true);
    setHasSentClick(false);

    setPlayerReactionTime(result.playerTime);
    setOpponentReactionTime(result.opponentTime);

    setPlayerScore(result.scores.player);
    setOpponentScore(result.scores.bot);

    setAllPlayerTimes(prev => {
      const updated = [...prev];
      updated[result.round - 1] = result.playerTime;
      return updated;
    });

    setAllOpponentTimes(prev => {
      const updated = [...prev];
      updated[result.round - 1] = result.opponentTime;
      return updated;
    });

    const roundOutcome = result.winner === 'player' ? 'win' : 'lose';
    setRoundResult(roundOutcome);
    setLossReason(result.reason ?? (result.winner === 'player' ? null : 'slower'));
    setGameState('result');
  }, []);

  useWebSocketEvent<WSRoundPrepare>('round:prepare', payload => {
    console.log('round:prepare payload received:', payload);
    setCurrentTarget(payload.target);
    setLossReason(null);
  }, []);

  useWebSocketEvent<WSRoundShowTarget>('round:show_target', payload => {
    console.log('round:show_target payload received:', payload);
    targetShownTimestampRef.current = Date.now();
    setTargetShowSignal(signal => signal + 1);
    setRoundResolved(false);
    setHasSentClick(false);
  }, []);

  useWebSocketEvent<WSRoundResult>('round:result', handleRoundResult, [handleRoundResult]);

  useWebSocketEvent<{ count?: number }>('game:countdown', () => {
    setWaitingForOpponent(false);
    setGameState('countdown');
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setHasRequestedInitialRound(false);
      return;
    }

    const shouldPrepareInitialRound = gameState === 'playing' && !hasRequestedInitialRound;

    if (shouldPrepareInitialRound) {
      prepareRound(currentRound);
      setHasRequestedInitialRound(true);
    }
  }, [isConnected, gameState, hasRequestedInitialRound, prepareRound, currentRound]);

  const handleNextRound = () => {
    if (isMatchOver) {
      setRoundResult(null);
      setShowFinalResults(true);
      return;
    }

    setCurrentRound(prev => {
      const nextRound = prev + 1;
      prepareRound(nextRound);
      return nextRound;
    });
    setRoundResult(null);
    // Skip countdown for later rounds, go directly to playing
    setGameState('playing');
    setRoundResolved(false);
    setLossReason(null); // reset reason for new round
  };

  const handleReadyUp = () => {
    setShowHowToPlay(false);
    setWaitingForOpponent(true);

    if (!isConnected) {
      toast.error('WebSocket disconnected', {
        description: 'Reconnecting to game server...'
      });
      return;
    }

    send('game:player_ready', {});
  };

  const handlePause = () => {
    const isPauseLimited = isRanked || stakeAmount > 0;
    
    // Check if pause limit reached for ranked/friend matches
    if (isPauseLimited && pauseCount >= MAX_PAUSES) {
      toast.error('⏸️ Pause limit reached', {
        description: `Maximum ${MAX_PAUSES} pauses allowed in ranked matches`,
        duration: 3000,
      });
      return;
    }
    
    setPauseCount(prev => prev + 1);
    setShowPauseMenu(true);
  };

  const handleResume = () => {
    setShowPauseMenu(false);
  };

  const handleAutoResume = () => {
    setShowPauseMenu(false);
    toast.info('⏱️ Match resumed automatically', {
      description: 'Pause time limit reached',
      duration: 3000,
    });
  };

  const handleQuitClick = () => {
    // If it's a ranked match or has stakes, show forfeit confirmation
    // Bot practice matches can quit directly
    if (isRanked || stakeAmount > 0) {
      setShowPauseMenu(false);
      setShowForfeitDialog(true);
    } else {
      // Bot match - can quit without penalty
      onQuit();
    }
  };

  const handleConfirmForfeit = () => {
    onQuit();
  };

  return (
    <div 
      className="relative w-full min-h-screen bg-gradient-to-br from-[#0a0118] via-[#0f0524] to-[#1a0836] overflow-hidden transition-all duration-300 ease-out"
      style={{
        transition: 'all 0.3s ease-out'
      }}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(14, 165, 233, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(14, 165, 233, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>

        {/* Scan lines */}
        <div className="absolute inset-0 bg-scan-lines opacity-5"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* HUD */}
        <HUD
          player={player}
          opponent={opponent}
          playerScore={playerScore}
          opponentScore={opponentScore}
          currentRound={currentRound}
          totalRounds={MAX_ROUNDS}
          stakeAmount={stakeAmount}
        />

        {/* Arena Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
          <ArenaCanvas
            isActive={gameState === 'playing'}
            targetShape={(currentTarget || defaultTarget).shape}
            targetColor={(currentTarget || defaultTarget).color}
            onTargetAppeared={handleTargetAppeared}
            onTargetDisappeared={handleTargetDisappeared}
            targetShowSignal={targetShowSignal}
            isWaitingForTarget={isWaitingForTarget}
          />

          {/* Target Hint Panel */}
          <AnimatePresence>
            {currentTarget && (gameState === 'playing') && (
              <TargetHintPanel
                targetShape={currentTarget.shape}
                targetColor={currentTarget.color}
                colorName={currentTarget.colorName}
                isActive={gameState === 'playing'}
                hasReacted={playerReactionTime !== null}
                reactionTime={playerReactionTime}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Bar */}
        <BottomBar
          onPause={handlePause}
          onReact={handleReact}
          isActive={gameState === 'playing' && playerReactionTime === null}
          reactionTime={playerReactionTime}
        />
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {gameState === 'countdown' && !showHowToPlay && !waitingForOpponent && (
          <CountdownOverlay
            onComplete={() => {
              setGameState('playing');
            }}
          />
        )}
      </AnimatePresence>

      {showPauseMenu && (
        <PauseMenu
          onResume={handleResume}
          onQuit={handleQuitClick}
          isRanked={isRanked}
          stakeAmount={stakeAmount}
          onAutoResume={handleAutoResume}
          pausesUsed={pauseCount}
          maxPauses={MAX_PAUSES}
        />
      )}

      {roundResult && (
        <RoundResultModal
          result={roundResult}
          playerReactionTime={playerReactionTime}
          opponentReactionTime={opponentReactionTime}
          lossReason={lossReason}
          onNext={handleNextRound}
          currentRound={currentRound}
          totalRounds={MAX_ROUNDS}
          isMatchOver={isMatchOver}
        />
      )}

      {showFinalResults && (
        <GameResultModal
          playerScore={playerScore}
          opponentScore={opponentScore}
          playerTimes={allPlayerTimes}
          opponentTimes={allOpponentTimes}
          isRanked={isRanked}
          stakeAmount={stakeAmount}
          matchType={matchType}
          onPlayAgain={handleRestart}
          onBackToMenu={onQuit}
        />
      )}

      {showForfeitDialog && (
        <ForfeitConfirmDialog
          isRanked={isRanked}
          stakeAmount={stakeAmount}
          onConfirm={handleConfirmForfeit}
          onCancel={() => setShowForfeitDialog(false)}
        />
      )}

      {showHowToPlay && (
        <HowToPlayOverlay
          targetShape={(currentTarget ?? defaultTarget).shape}
          targetColor={(currentTarget ?? defaultTarget).color}
          onContinue={handleReadyUp}
        />
      )}

      {waitingForOpponent && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#00FFA3]/20 via-[#06B6D4]/20 to-[#7C3AED]/20 blur-2xl opacity-50"></div>
            <div
              className="relative bg-black/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl overflow-hidden min-h-[220px] flex flex-col items-center justify-center text-center p-8"
              style={{
                clipPath:
                  'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
              }}
            >
              <div className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-[#00FFA3] to-transparent"></div>
              <div className="absolute top-0 left-0 w-px h-8 bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-8 h-px bg-gradient-to-l from-[#7C3AED] to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-px h-8 bg-gradient-to-t from-[#7C3AED] to-transparent"></div>

              <div className="flex flex-col items-center gap-4">
                <div
                  className="mx-auto h-12 w-12 animate-spin rounded-full shadow-[0_0_18px_rgba(124,58,237,0.6)]"
                  style={{
                    background: 'conic-gradient(from 0deg, #7C3AED, #00FFA3, #06B6D4, #7C3AED)',
                    WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)',
                    mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)',
                  }}
                ></div>
                <div>
                  <p className="text-xl font-semibold text-white">Waiting for opponent to get ready...</p>
                  <p className="text-sm text-gray-300 mt-1">
                    {opponent.name} is preparing. We&apos;ll start as soon as they&apos;re ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Toggle - Top right corner */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[60]" style={{ top: 'max(0.75rem, var(--safe-area-top))' }}>
        <FullscreenToggle onFullscreenChange={setIsFullscreen} />
      </div>

      {/* Custom Status Bar - Only show on mobile when fullscreen */}
      {isMobile && isFullscreen && (
        <CustomStatusBar isVisible={isFullscreen} />
      )}
    </div>
  );
}
