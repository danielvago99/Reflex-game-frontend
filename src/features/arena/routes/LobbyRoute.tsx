import { useLocation, useNavigate } from 'react-router-dom';
import { LobbyScreen } from '../../../components/LobbyScreen';
import { useGame } from '../context/GameProvider';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function LobbyRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setMatchDetails } = useGame();
  const navState = location.state as {
    preselectMode?: 'ranked' | 'bot';
    preselectStake?: string;
  } | null;

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <LobbyScreen
      preselectMode={navState?.preselectMode}
      preselectStake={navState?.preselectStake}
      onNavigate={handleNavigate}
      onStartMatch={(isRanked, stakeAmount, matchType, opponentName, opponentUserId) => {
        setMatchDetails({ isRanked, stakeAmount, matchType, opponentName, opponentUserId });
        navigate('/arena');
      }}
    />
  );
}
