import { useNavigate } from 'react-router-dom';
import { SettingsScreen } from '../../../components/SettingsScreen';
import { useGame } from '../../arena/context/GameProvider';
import { useWallet } from '../../wallet/context/WalletProvider';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function SettingsRoute() {
  const navigate = useNavigate();
  const { playerName, setPlayerName } = useGame();
  const { logout } = useWallet();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <SettingsScreen
      currentName={playerName}
      onNavigate={handleNavigate}
      onUpdateName={setPlayerName}
      onLogout={logout}
    />
  );
}
