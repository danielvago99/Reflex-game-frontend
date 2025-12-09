import { useNavigate } from 'react-router-dom';
import { DashboardScreen } from '../../../components/DashboardScreen';
import { useGame } from '../../arena/context/GameProvider';
import { useWallet } from '../../wallet/context/WalletProvider';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { screenToPath, ScreenPaths, type AppScreen } from '../../../shared/types/navigation';
import { useMatchHistory } from '../../../hooks/useMatchHistory';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function DashboardRoute() {
  const navigate = useNavigate();
  const { playerName } = useGame();
  const { address } = useWallet();
  const { user, loading } = useUserDashboard();
  const { matches, loading: matchesLoading } = useMatchHistory(5);

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <DashboardScreen
      onNavigate={handleNavigate}
      playerName={user?.username ?? playerName}
      walletAddress={user?.walletAddress ?? address}
      avatarUrl={user?.avatar ?? undefined}
      stats={user?.stats ?? undefined}
      isLoading={loading}
      recentMatches={matches}
      matchesLoading={matchesLoading}
    />
  );
}
