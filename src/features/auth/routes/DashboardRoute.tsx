import { useNavigate } from 'react-router-dom';
import { DashboardScreen } from '../../../components/DashboardScreen';
import { useGame } from '../../arena/context/GameProvider';
import { useWallet } from '../../wallet/context/WalletProvider';
import { screenToPath, ScreenPaths, type AppScreen } from '../../../shared/types/navigation';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function DashboardRoute() {
  const navigate = useNavigate();
  const { playerName } = useGame();
  const { address } = useWallet();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <DashboardScreen
      onNavigate={handleNavigate}
      playerName={playerName}
      walletAddress={address}
      balance={5.42}
    />
  );
}
