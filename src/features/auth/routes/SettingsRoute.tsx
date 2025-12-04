import { useNavigate } from 'react-router-dom';
import { SettingsScreen } from '../../../components/SettingsScreen';
import { useAuth } from '../hooks/useAuth';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function SettingsRoute() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <SettingsScreen
      onNavigate={handleNavigate}
      onLogout={logout}
    />
  );
}
