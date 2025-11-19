import { useState, useEffect, useMemo } from 'react';
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
import { usePerformanceMode } from '../../hooks/usePerformanceMode'; // LOW PERF MODE

interface GameArenaProps {
  onQuit: () => void;
  isRanked?: boolean;
  stakeAmount?: number;
  matchType?: 'ranked' | 'friend' | 'bot'; // Add matchType prop
}

type GameState = 'countdown' | 'playing' | 'result';

interface Target {
  shape: 'circle' | 'square' | 'triangle';
  color: string;
  colorName: string;
}

export function GameArena({ onQuit, isRanked = false, stakeAmount = 0, matchType = 'bot' }: GameArenaProps) {
  const { isLowPerformance } = usePerformanceMode(); // LOW PERF MODE
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
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | 'tie' | null>(null);
  const [currentTarget, setCurrentTarget] = useState<Target | null>(null);
  const [targetAppearTime, setTargetAppearTime] = useState<number | null>(null);
  const [isTargetPresent, setIsTargetPresent] = useState(false);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [allPlayerTimes, setAllPlayerTimes] = useState<(number | null)[]>([null, null, null]);
  const [allOpponentTimes, setAllOpponentTimes] = useState<(number | null)[]>([null, null, null]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const TOTAL_ROUNDS = 3;
  const MAX_PAUSES = 3;

  // Detect mobile
  const isMobile = window.innerWidth < 640;

  // Reset all game state for restart
  const handleRestart = () => {
    setGameState('countdown');
    setCurrentRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setShowPauseMenu(false);
    setPlayerReactionTime(null);
    setOpponentReactionTime(null);
    setRoundResult(null);
    setCurrentTarget(null);
    setTargetAppearTime(null);
    setIsTargetPresent(false);
    setShowFinalResults(false);
    setAllPlayerTimes([null, null, null]);
    setAllOpponentTimes([null, null, null]);
  };

  // Players (get from profile in real app)
  const player = {
    name: 'You',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player1',
  };

  const opponent = {
    name: 'CryptoNinja',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=opponent1',
  };

  // Target combinations
  const targets: Target[] = useMemo(() => [
    { shape: 'circle', color: '#00FF00', colorName: 'Green' },
    { shape: 'square', color: '#FF0000', colorName: 'Red' },
    { shape: 'triangle', color: '#0000FF', colorName: 'Blue' },
    { shape: 'circle', color: '#FFFF00', colorName: 'Yellow' },
    { shape: 'square', color: '#9333EA', colorName: 'Purple' },
    { shape: 'triangle', color: '#06B6D4', colorName: 'Cyan' },
  ], []); // LOW PERF MODE

  // Initialize first round target immediately
  useEffect(() => {
    if (!currentTarget) {
      const target = targets[Math.floor(Math.random() * targets.length)];
      setCurrentTarget(target);
    }
  }, []);

  const startRound = () => {
    // Pick random target
    const target = targets[Math.floor(Math.random() * targets.length)];
    setCurrentTarget(target);
    setPlayerReactionTime(null);
    setOpponentReactionTime(null);
    setTargetAppearTime(null);
    setIsTargetPresent(false);
  };

  const handleTargetAppeared = () => {
    setTargetAppearTime(Date.now());
    setIsTargetPresent(true);

    // Simulate opponent reaction (AI opponent)
    const opponentDelay = 200 + Math.random() * 300; // 200-500ms
    setTimeout(() => {
      setOpponentReactionTime(Math.round(opponentDelay));
    }, opponentDelay);
  };

  const handleTargetDisappeared = () => {
    setIsTargetPresent(false);
  };

  const handleReact = () => {
    if (gameState !== 'playing' || playerReactionTime !== null) return;

    // Check if target is present
    if (!isTargetPresent || !targetAppearTime) {
      // Player clicked too early - they lose!
      setPlayerReactionTime(999999); // Set a very high time
      setRoundResult('lose');
      
      // Wait a bit then show results
      setTimeout(() => {
        handleRoundComplete(999999);
      }, 500);
      return;
    }

    const reactionTime = Date.now() - targetAppearTime;
    setPlayerReactionTime(reactionTime);

    // Wait a bit then show results
    setTimeout(() => {
      handleRoundComplete(reactionTime);
    }, 500);
  };

  const handleRoundComplete = (playerTime: number) => {
    const opponentTime = opponentReactionTime || 999999;

    // Determine winner
    let winner: 'player' | 'opponent' | 'tie';
    if (playerTime < opponentTime) {
      winner = 'player';
      setPlayerScore(prev => prev + 1);
      setRoundResult('win');
    } else if (playerTime > opponentTime) {
      winner = 'opponent';
      setOpponentScore(prev => prev + 1);
      setRoundResult('lose');
    } else {
      winner = 'tie';
      setRoundResult('tie');
    }

    setGameState('result');

    // Store times for final results
    const newPlayerTimes = [...allPlayerTimes];
    const newOpponentTimes = [...allOpponentTimes];
    newPlayerTimes[currentRound - 1] = playerTime;
    newOpponentTimes[currentRound - 1] = opponentTime;
    setAllPlayerTimes(newPlayerTimes);
    setAllOpponentTimes(newOpponentTimes);
  };

  const handleNextRound = () => {
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound(prev => prev + 1);
      setRoundResult(null);
      // Skip countdown for rounds 2 and 3, go directly to playing
      setGameState('playing');
      startRound();
    } else {
      // Game over - go to results
      setShowFinalResults(true);
    }
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
        {!isLowPerformance && (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          </>
        )}

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
        {!isLowPerformance && <div className="absolute inset-0 bg-scan-lines opacity-5"></div>}
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
          totalRounds={TOTAL_ROUNDS}
        />

        {/* Arena Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
          {currentTarget && (
            <ArenaCanvas
              isActive={gameState === 'playing'}
              targetShape={currentTarget.shape}
              targetColor={currentTarget.color}
              onTargetAppeared={handleTargetAppeared}
              onTargetDisappeared={handleTargetDisappeared}
            />
          )}

          {/* Target Hint Panel */}
          {isLowPerformance ? (
            currentTarget && gameState === 'playing' && (
              <TargetHintPanel
                targetShape={currentTarget.shape}
                targetColor={currentTarget.color}
                colorName={currentTarget.colorName}
                isActive={gameState === 'playing'}
                hasReacted={playerReactionTime !== null}
                reactionTime={playerReactionTime}
              />
            )
          ) : (
            <AnimatePresence>
              {currentTarget && gameState === 'playing' && (
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
          )}
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
      {isLowPerformance ? (
        gameState === 'countdown' && !showHowToPlay && (
          <CountdownOverlay
            onComplete={() => {
              setGameState('playing');
              startRound();
            }}
          />
        )
      ) : (
        <AnimatePresence>
          {gameState === 'countdown' && !showHowToPlay && (
            <CountdownOverlay
              onComplete={() => {
                setGameState('playing');
                startRound();
              }}
            />
          )}
        </AnimatePresence>
      )}

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
          onNext={handleNextRound}
          currentRound={currentRound}
          totalRounds={TOTAL_ROUNDS}
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

      {showHowToPlay && currentTarget && (
        <HowToPlayOverlay
          targetShape={currentTarget.shape}
          targetColor={currentTarget.color}
          onContinue={() => setShowHowToPlay(false)}
        />
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