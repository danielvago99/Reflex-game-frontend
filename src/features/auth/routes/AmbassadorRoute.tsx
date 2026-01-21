import { useNavigate } from 'react-router-dom';
import { AmbassadorScreen } from '../../../components/AmbassadorScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { useUserDashboard } from '../hooks/useUserDashboard';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function AmbassadorRoute() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUserDashboard();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <AmbassadorScreen
      onNavigate={handleNavigate}
      playerName={user?.username}
      isLoading={userLoading}
    />
  );
}
