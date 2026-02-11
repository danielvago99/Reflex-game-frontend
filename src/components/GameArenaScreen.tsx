import { GameArena } from './arena/GameArena';

interface GameArenaScreenProps {
  onNavigate: (screen: string) => void;
  isRanked?: boolean;
  stakeAmount?: number;
  matchType?: 'ranked' | 'friend' | 'bot';
  opponentName?: string;
}

export function GameArenaScreen({
  onNavigate,
  isRanked = false,
  stakeAmount = 0,
  matchType = 'bot',
  opponentName,
}: GameArenaScreenProps) {
  const handleQuit = () => {
    onNavigate('lobby');
  };

  const handlePlayAgain = () => {
    onNavigate('lobby:ranked-rematch');
  };

  const handleGoToDashboard = () => {
    onNavigate('dashboard');
  };

  return (
    <GameArena
      onQuit={handleQuit}
      onPlayAgain={handlePlayAgain}
      onGoToDashboard={handleGoToDashboard}
      isRanked={isRanked}
      stakeAmount={stakeAmount}
      matchType={matchType}
      opponentName={opponentName}
    />
  );
}
