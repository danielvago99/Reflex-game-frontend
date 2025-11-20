import { useNavigate } from 'react-router-dom';
import { ProfileScreen } from '../../../components/ProfileScreen';
import { useGame } from '../../arena/context/GameProvider';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function ProfileRoute() {
  const navigate = useNavigate();
  const { playerName } = useGame();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return <ProfileScreen onNavigate={handleNavigate} playerName={playerName} />;
}
