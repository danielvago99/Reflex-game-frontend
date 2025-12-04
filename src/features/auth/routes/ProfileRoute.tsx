import { useNavigate } from 'react-router-dom';
import { ProfileScreen } from '../../../components/ProfileScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { usePlayerProfile } from '../../../hooks/usePlayerProfile';
import { usePlayerStats } from '../../../hooks/usePlayerStats';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function ProfileRoute() {
  const navigate = useNavigate();
  const { profile } = usePlayerProfile();
  const { stats } = usePlayerStats();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <ProfileScreen
      onNavigate={handleNavigate}
      playerName={profile?.username || 'Player'}
      avatarUrl={profile?.avatar}
      stats={stats}
    />
  );
}
