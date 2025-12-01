import { useNavigate } from 'react-router-dom';
import { WelcomeScreen } from '../../../components/WelcomeScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { useWallet } from '../../wallet/context/WalletProvider';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

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

  const handleWalletConnect = async (
    address: string,
    provider: string,
    signMessage?: (message: string) => Promise<Uint8Array>
  ) => {
    connectExternalWallet(address, provider);

    if (!signMessage) {
      toast.error('Unable to authenticate: wallet provider cannot sign messages.');
      return;
    }

    try {
      await loginWithExternalWallet({ address, signMessage });
      navigate('/dashboard');
    } catch (error) {
      console.error('External wallet login failed', error);
      toast.error(error instanceof Error ? error.message : 'Failed to authenticate with wallet');
    }
  };

  return <WelcomeScreen onNavigate={handleNavigate} onWalletConnect={handleWalletConnect} />;
}
