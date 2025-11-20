import { useNavigate } from 'react-router-dom';
import { LobbyScreen } from '../../../components/LobbyScreen';
import { useGame } from '../context/GameProvider';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function LobbyRoute() {
  const navigate = useNavigate();
  const { setMatchDetails } = useGame();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <LobbyScreen
      onNavigate={handleNavigate}
      onStartMatch={(isRanked, stakeAmount, matchType) => {
        setMatchDetails({ isRanked, stakeAmount, matchType });
        navigate('/arena');
      }}
    />
  );
}
