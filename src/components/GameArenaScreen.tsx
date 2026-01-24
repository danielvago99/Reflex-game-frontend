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

  return (
    <GameArena
      onQuit={handleQuit}
      isRanked={isRanked}
      stakeAmount={stakeAmount}
      matchType={matchType}
      opponentName={opponentName}
    />
  );
}
