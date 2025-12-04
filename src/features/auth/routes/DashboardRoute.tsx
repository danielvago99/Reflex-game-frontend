import { useNavigate } from 'react-router-dom';
import { DashboardScreen } from '../../../components/DashboardScreen';
import { useWallet } from '../../wallet/context/WalletProvider';
import { screenToPath, ScreenPaths, type AppScreen } from '../../../shared/types/navigation';
import { usePlayerProfile } from '../../../hooks/usePlayerProfile';
import { usePlayerStats } from '../../../hooks/usePlayerStats';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function DashboardRoute() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { profile } = usePlayerProfile();
  const { stats } = usePlayerStats();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <DashboardScreen
      onNavigate={handleNavigate}
      playerName={profile?.username || 'Player'}
      walletAddress={address}
      avatarUrl={profile?.avatar || undefined}
      balance={stats?.totalSolWon ?? 5.42}
      reflexPoints={stats?.totalReflexPoints}
    />
  );
}
