import { useNavigate } from 'react-router-dom';
import { GameArenaScreen } from '../../../components/GameArenaScreen';
import { useGame } from '../context/GameProvider';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function ArenaRoute() {
  const navigate = useNavigate();
  const { matchDetails, setMatchDetails } = useGame();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      if (screen === 'dashboard' || screen === 'lobby') {
        setMatchDetails({ ...matchDetails, stakeAmount: 0 });
      }
      navigate(screenToPath(screen));
    }
  };

  return (
    <GameArenaScreen
      onNavigate={handleNavigate}
      isRanked={matchDetails.isRanked}
      stakeAmount={matchDetails.stakeAmount}
      matchType={matchDetails.matchType}
    />
  );
}
