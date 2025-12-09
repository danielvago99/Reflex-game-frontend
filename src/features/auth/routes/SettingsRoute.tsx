import { useNavigate } from 'react-router-dom';
import { SettingsScreen } from '../../../components/SettingsScreen';
import { useGame } from '../../arena/context/GameProvider';
import { useWallet } from '../../wallet/context/WalletProvider';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useAuth } from '../hooks/useAuth';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function SettingsRoute() {
  const navigate = useNavigate();
  const { playerName, setPlayerName } = useGame();
  const { logout } = useWallet();
  const { updateProfile } = useAuth();
  const { user, refresh } = useUserDashboard();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  const handleUpdateName = async (newName: string) => {
    await updateProfile({ username: newName });
    setPlayerName(newName);
    await refresh();
  };

  const handleUpdateAvatar = async (avatarUrl: string) => {
    await updateProfile({ avatar: avatarUrl });
    await refresh();
  };

  return (
    <SettingsScreen
      currentName={user?.username ?? playerName}
      avatarUrl={user?.avatar ?? undefined}
      onNavigate={handleNavigate}
      onUpdateName={handleUpdateName}
      onUpdateAvatar={handleUpdateAvatar}
      onLogout={logout}
    />
  );
}
