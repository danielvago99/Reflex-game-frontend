import { useNavigate } from 'react-router-dom';
import { WelcomeScreen } from '../../../components/WelcomeScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { useWallet } from '../../wallet/context/WalletProvider';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function WelcomeRoute() {
  const navigate = useNavigate();
  const { connectExternalWallet } = useWallet();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  const handleWalletConnect = (address: string, provider: string) => {
    connectExternalWallet(address, provider);
    navigate('/dashboard');
  };

  return <WelcomeScreen onNavigate={handleNavigate} onWalletConnect={handleWalletConnect} />;
}
