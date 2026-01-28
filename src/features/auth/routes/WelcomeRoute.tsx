import { useNavigate } from 'react-router-dom';
import { WelcomeScreen } from '../../../components/WelcomeScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { useWallet } from '../../wallet/context/WalletProvider';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { connectToExternalWallet } from '../../../utils/externalWallet';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function WelcomeRoute() {
  const navigate = useNavigate();
  const { connectExternalWallet } = useWallet();
  const { loginWithExternalWallet } = useAuth();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  const handleWalletConnect = async () => {
    try {
      const connection = await connectToExternalWallet();
      connectExternalWallet(connection.address, connection.provider);
      await loginWithExternalWallet({ address: connection.address, signMessage: connection.signMessage });
      navigate('/dashboard');
    } catch (error) {
      console.error('External wallet login failed', error);
      toast.error(error instanceof Error ? error.message : 'Failed to authenticate with wallet');
    }
  };

  return <WelcomeScreen onNavigate={handleNavigate} onWalletConnect={handleWalletConnect} />;
}
