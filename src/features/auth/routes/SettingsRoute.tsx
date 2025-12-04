import { useNavigate } from 'react-router-dom';
import { SettingsScreen } from '../../../components/SettingsScreen';
import { useWallet } from '../../wallet/context/WalletProvider';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { usePlayerProfile } from '../../../hooks/usePlayerProfile';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function SettingsRoute() {
  const navigate = useNavigate();
  const { logout } = useWallet();
  const { profile, updateProfile, refresh, loading } = usePlayerProfile();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  const handleUpdateProfile = async (updates: { username?: string; avatar?: string | null }) => {
    await updateProfile(updates);
    await refresh();
  };

  return (
    <SettingsScreen
      currentName={profile?.username || 'Player'}
      currentAvatar={profile?.avatar}
      loading={loading}
      onNavigate={handleNavigate}
      onUpdateProfile={handleUpdateProfile}
      onLogout={logout}
    />
  );
}
