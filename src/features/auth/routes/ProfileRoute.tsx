import { useNavigate } from 'react-router-dom';
import { ProfileScreen } from '../../../components/ProfileScreen';
import { useGame } from '../../arena/context/GameProvider';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useMatchHistory } from '../../../hooks/useMatchHistory';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function ProfileRoute() {
  const navigate = useNavigate();
  const { playerName } = useGame();
  const { user, loading } = useUserDashboard();
  const { matches, loading: matchesLoading } = useMatchHistory(10);

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <ProfileScreen
      onNavigate={handleNavigate}
      playerName={user?.username ?? playerName}
      avatarUrl={user?.avatar ?? undefined}
      stats={user?.stats ?? undefined}
      isLoading={loading}
      matchHistory={matches}
      matchHistoryLoading={matchesLoading}
    />
  );
}
